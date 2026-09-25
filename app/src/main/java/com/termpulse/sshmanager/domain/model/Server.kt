package com.termpulse.sshmanager.domain.model

enum class AuthType {
    PASSWORD,
    PRIVATE_KEY
}

enum class ConnectionStatus {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    RECONNECTING,
    DISCONNECTING,
    ERROR
}

data class Server(
    val id: String,
    val name: String,
    val host: String,
    val port: Int = 22,
    val username: String,
    val authType: AuthType,
    val privateKeyReference: String? = null,
    val tags: List<String> = emptyList(),
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val lastConnectedAt: Long? = null,
    val status: ConnectionStatus = ConnectionStatus.DISCONNECTED,
    val osInfo: String? = null
)
