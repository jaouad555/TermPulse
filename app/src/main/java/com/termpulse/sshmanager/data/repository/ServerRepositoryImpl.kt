package com.termpulse.sshmanager.data.repository

import com.termpulse.sshmanager.data.local.database.AppDatabase
import com.termpulse.sshmanager.data.local.database.ServerEntity
import com.termpulse.sshmanager.data.local.secure.KeystoreManager
import com.termpulse.sshmanager.domain.model.AuthType
import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.domain.repository.ServerRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import net.schmizz.sshj.SSHClient
import net.schmizz.sshj.transport.verification.PromiscuousVerifier

class ServerRepositoryImpl(
    private val database: AppDatabase,
    private val keystoreManager: KeystoreManager
) : ServerRepository {

    override fun getServers(): Flow<List<Server>> {
        return database.serverDao().getAllServers().map { list ->
            list.map { it.toDomain() }
        }
    }

    override suspend fun getServerById(id: String): Server? = withContext(Dispatchers.IO) {
        database.serverDao().getServerById(id)?.toDomain()
    }

    override suspend fun saveServer(server: Server, secret: String, passphrase: String?) = withContext(Dispatchers.IO) {
        // Save metadata in Room
        database.serverDao().insertOrUpdate(ServerEntity.fromDomain(server))
        // Securely encrypt sensitive credentials in Android Keystore
        keystoreManager.storeSecret(server.id, secret)
        if (!passphrase.isNullOrBlank()) {
            keystoreManager.storePassphrase(server.id, passphrase)
        }
    }

    override suspend fun deleteServer(id: String) = withContext(Dispatchers.IO) {
        database.serverDao().deleteById(id)
        keystoreManager.removeSecrets(id)
    }

    override suspend fun updateLastConnected(id: String) = withContext(Dispatchers.IO) {
        database.serverDao().updateLastConnected(id, System.currentTimeMillis())
    }

    override suspend fun getDecryptedSecret(id: String): String? = withContext(Dispatchers.IO) {
        keystoreManager.getSecret(id)
    }

    override suspend fun getDecryptedPassphrase(id: String): String? = withContext(Dispatchers.IO) {
        keystoreManager.getPassphrase(id)
    }

    override suspend fun testConnection(server: Server, secret: String, passphrase: String?): Result<Long> = withContext(Dispatchers.IO) {
        val startTime = System.currentTimeMillis()
        try {
            val client = SSHClient().apply {
                addHostKeyVerifier(PromiscuousVerifier())
                connectTimeout = 8000
                timeout = 8000
                connect(server.host, server.port)
            }

            if (server.authType == AuthType.PASSWORD) {
                client.authPassword(server.username, secret)
            } else {
                val keyProvider = if (!passphrase.isNullOrEmpty()) {
                    client.loadKeys(secret, passphrase)
                } else {
                    client.loadKeys(secret, null)
                }
                client.authPublickey(server.username, keyProvider)
            }

            val latency = System.currentTimeMillis() - startTime
            client.disconnect()
            Result.success(latency)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
