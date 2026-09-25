package com.termpulse.sshmanager.data.ssh

import com.termpulse.sshmanager.domain.model.AuthType
import com.termpulse.sshmanager.domain.model.ConnectionState
import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.domain.model.SftpFile
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import net.schmizz.sshj.SSHClient
import net.schmizz.sshj.connection.channel.direct.Session
import net.schmizz.sshj.sftp.SFTPClient
import net.schmizz.sshj.transport.verification.PromiscuousVerifier
import net.schmizz.sshj.userauth.keyprovider.KeyProvider
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.io.OutputStream

class SshClientEngine {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var sshClient: SSHClient? = null
    private var activeSession: Session? = null
    private var activeShell: Session.Shell? = null
    private var shellOutputStream: OutputStream? = null
    private var sftpClient: SFTPClient? = null

    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Disconnected)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private val _terminalOutput = MutableSharedFlow<String>(extraBufferCapacity = 1000)
    val terminalOutput: SharedFlow<String> = _terminalOutput.asSharedFlow()

    suspend fun connect(
        server: Server,
        secret: String,
        passphrase: String? = null
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            _connectionState.value = ConnectionState.Connecting

            val client = SSHClient().apply {
                addHostKeyVerifier(PromiscuousVerifier())
                connectTimeout = 10000
                timeout = 10000
                connect(server.host, server.port)
            }

            if (server.authType == AuthType.PASSWORD) {
                client.authPassword(server.username, secret)
            } else {
                val keyProvider: KeyProvider = if (!passphrase.isNullOrEmpty()) {
                    client.loadKeys(secret, passphrase)
                } else {
                    client.loadKeys(secret, null)
                }
                client.authPublickey(server.username, keyProvider)
            }

            sshClient = client
            val session = client.startSession().apply {
                allocatePTY("xterm-256color", 80, 24, 0, 0, emptyMap())
            }
            activeSession = session

            val shell = session.startShell()
            activeShell = shell
            shellOutputStream = shell.outputStream

            // Listen to remote output
            scope.launch {
                readShellStream(shell.inputStream)
            }

            _connectionState.value = ConnectionState.Connected(0)
            Result.success(Unit)
        } catch (e: Exception) {
            _connectionState.value = ConnectionState.Error(e.message ?: "Failed to connect to SSH host")
            disconnect()
            Result.failure(e)
        }
    }

    private suspend fun readShellStream(inputStream: InputStream) {
        val buffer = ByteArray(4096)
        try {
            while (_connectionState.value is ConnectionState.Connected) {
                val bytesRead = inputStream.read(buffer)
                if (bytesRead == -1) break
                val chunk = String(buffer, 0, bytesRead, Charsets.UTF_8)
                _terminalOutput.emit(chunk)
            }
        } catch (e: Exception) {
            // Stream ended or connection closed
        } finally {
            disconnect()
        }
    }

    suspend fun sendCommand(data: String) = withContext(Dispatchers.IO) {
        try {
            shellOutputStream?.write(data.toByteArray(Charsets.UTF_8))
            shellOutputStream?.flush()
        } catch (e: Exception) {
            _connectionState.value = ConnectionState.Error("Failed to write to terminal: ${e.message}")
        }
    }

    suspend fun resizeTerminal(cols: Int, rows: Int) = withContext(Dispatchers.IO) {
        try {
            activeSession?.changeWindowDimensions(cols, rows, 0, 0)
        } catch (_: Exception) {}
    }

    suspend fun disconnect() = withContext(Dispatchers.IO) {
        try {
            _connectionState.value = ConnectionState.Disconnecting
            sftpClient?.close()
            activeShell?.close()
            activeSession?.close()
            sshClient?.disconnect()
        } catch (_: Exception) {
        } finally {
            sftpClient = null
            activeShell = null
            activeSession = null
            sshClient = null
            _connectionState.value = ConnectionState.Disconnected
        }
    }

    // SFTP Engine Operations
    suspend fun listFiles(remotePath: String): Result<List<SftpFile>> = withContext(Dispatchers.IO) {
        try {
            val client = sshClient ?: return@withContext Result.failure(IllegalStateException("Not connected"))
            val sftp = sftpClient ?: client.newSFTPClient().also { sftpClient = it }

            val entries = sftp.ls(remotePath).map { entry ->
                SftpFile(
                    name = entry.name,
                    path = "$remotePath/${entry.name}".replace("//", "/"),
                    isDirectory = entry.isDirectory,
                    size = entry.attributes.size,
                    modifyTime = entry.attributes.mtime * 1000L,
                    permissions = entry.attributes.mode.toString(),
                    owner = entry.attributes.username ?: "user"
                )
            }
            Result.success(entries)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun readFile(remotePath: String): Result<ByteArray> = withContext(Dispatchers.IO) {
        try {
            val client = sshClient ?: return@withContext Result.failure(IllegalStateException("Not connected"))
            val sftp = sftpClient ?: client.newSFTPClient().also { sftpClient = it }
            val outputStream = ByteArrayOutputStream()

            sftp.open(remotePath).use { file ->
                val buf = ByteArray(8192)
                var offset = 0L
                var read: Int
                while (true) {
                    read = file.read(offset, buf, 0, buf.size)
                    if (read <= 0) break
                    outputStream.write(buf, 0, read)
                    offset += read
                }
            }
            Result.success(outputStream.toByteArray())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun writeFile(remotePath: String, data: ByteArray): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val client = sshClient ?: return@withContext Result.failure(IllegalStateException("Not connected"))
            val sftp = sftpClient ?: client.newSFTPClient().also { sftpClient = it }

            val inStream = ByteArrayInputStream(data)
            sftp.open(remotePath, setOf(net.schmizz.sshj.sftp.OpenMode.WRITE, net.schmizz.sshj.sftp.OpenMode.CREAT, net.schmizz.sshj.sftp.OpenMode.TRUNC)).use { file ->
                val buf = ByteArray(8192)
                var offset = 0L
                var read: Int
                while (inStream.read(buf).also { read = it } != -1) {
                    file.write(offset, buf, 0, read)
                    offset += read
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
