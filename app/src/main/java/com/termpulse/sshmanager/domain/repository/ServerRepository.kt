package com.termpulse.sshmanager.domain.repository

import com.termpulse.sshmanager.domain.model.ConnectionState
import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.domain.model.SftpFile
import kotlinx.coroutines.flow.Flow

interface ServerRepository {
    fun getServers(): Flow<List<Server>>
    suspend fun getServerById(id: String): Server?
    suspend fun saveServer(server: Server, secret: String, passphrase: String?)
    suspend fun deleteServer(id: String)
    suspend fun updateLastConnected(id: String)
    suspend fun getDecryptedSecret(id: String): String?
    suspend fun getDecryptedPassphrase(id: String): String?
    suspend fun testConnection(server: Server, secret: String, passphrase: String?): Result<Long>
}

interface SshRepository {
    val connectionState: Flow<ConnectionState>
    val terminalOutput: Flow<String>

    suspend fun connect(server: Server, secret: String, passphrase: String?): Result<Unit>
    suspend fun sendCommand(data: String)
    suspend fun resizeTerminal(cols: Int, rows: Int)
    suspend fun disconnect()

    suspend fun listFiles(path: String): Result<List<SftpFile>>
    suspend fun readFile(path: String): Result<ByteArray>
    suspend fun writeFile(path: String, data: ByteArray): Result<Unit>
    suspend fun createDirectory(path: String): Result<Unit>
    suspend fun deleteFile(path: String, isDirectory: Boolean): Result<Unit>
    suspend fun renameFile(oldPath: String, newPath: String): Result<Unit>
}
