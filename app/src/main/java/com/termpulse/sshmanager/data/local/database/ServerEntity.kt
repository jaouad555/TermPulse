package com.termpulse.sshmanager.data.local.database

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.termpulse.sshmanager.domain.model.AuthType
import com.termpulse.sshmanager.domain.model.ConnectionStatus
import com.termpulse.sshmanager.domain.model.Server

@Entity(tableName = "servers")
data class ServerEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val host: String,
    val port: Int,
    val username: String,
    val authType: String, // PASSWORD or PRIVATE_KEY
    val privateKeyReference: String?,
    val tagsJson: String, // JSON array of strings
    val createdAt: Long,
    val updatedAt: Long,
    val lastConnectedAt: Long?,
    val osInfo: String?
) {
    fun toDomain(): Server {
        val parsedTags = if (tagsJson.isBlank()) emptyList() else tagsJson.split(",").filter { it.isNotBlank() }
        return Server(
            id = id,
            name = name,
            host = host,
            port = port,
            username = username,
            authType = try { AuthType.valueOf(authType) } catch (_: Exception) { AuthType.PASSWORD },
            privateKeyReference = privateKeyReference,
            tags = parsedTags,
            createdAt = createdAt,
            updatedAt = updatedAt,
            lastConnectedAt = lastConnectedAt,
            status = ConnectionStatus.DISCONNECTED,
            osInfo = osInfo
        )
    }

    companion object {
        fun fromDomain(server: Server): ServerEntity {
            return ServerEntity(
                id = server.id,
                name = server.name,
                host = server.host,
                port = server.port,
                username = server.username,
                authType = server.authType.name,
                privateKeyReference = server.privateKeyReference,
                tagsJson = server.tags.joinToString(","),
                createdAt = server.createdAt,
                updatedAt = server.updatedAt,
                lastConnectedAt = server.lastConnectedAt,
                osInfo = server.osInfo
            )
        }
    }
}
