package com.termpulse.sshmanager.domain.usecase

import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.domain.repository.ServerRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class GetServersUseCase(
    private val repository: ServerRepository
) {
    operator fun invoke(query: String = "", tagFilter: String? = null): Flow<List<Server>> {
        return repository.getServers().map { list ->
            list.filter { server ->
                val matchesQuery = query.isBlank() ||
                    server.name.contains(query, ignoreCase = true) ||
                    server.host.contains(query, ignoreCase = true) ||
                    server.username.contains(query, ignoreCase = true) ||
                    server.tags.any { it.contains(query, ignoreCase = true) }

                val matchesTag = tagFilter.isNullOrBlank() || server.tags.contains(tagFilter)
                matchesQuery && matchesTag
            }
        }
    }
}

class SaveServerUseCase(
    private val repository: ServerRepository
) {
    suspend operator fun invoke(
        server: Server,
        secret: String,
        passphrase: String? = null
    ): Result<Unit> {
        // Validation
        if (server.name.isBlank()) return Result.failure(IllegalArgumentException("Server name cannot be empty"))
        if (server.host.isBlank()) return Result.failure(IllegalArgumentException("Host IP/domain cannot be empty"))
        if (server.username.isBlank()) return Result.failure(IllegalArgumentException("Username cannot be empty"))
        if (server.port !in 1..65535) return Result.failure(IllegalArgumentException("Port must be between 1 and 65535"))
        if (secret.isBlank()) return Result.failure(IllegalArgumentException("Password or Private Key is required"))

        return try {
            repository.saveServer(server, secret, passphrase)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

class ConnectSshUseCase(
    private val serverRepository: ServerRepository
) {
    suspend fun testConnection(server: Server, secret: String, passphrase: String? = null): Result<Long> {
        return serverRepository.testConnection(server, secret, passphrase)
    }
}
