package com.termpulse.sshmanager.domain.model

sealed interface ConnectionState {
    data object Disconnected : ConnectionState
    data object Connecting : ConnectionState
    data class Connected(val sessionDurationSeconds: Long = 0) : ConnectionState
    data class Reconnecting(val attempt: Int) : ConnectionState
    data object Disconnecting : ConnectionState
    data class Error(val message: String, val canRetry: Boolean = true) : ConnectionState
}

data class SftpFile(
    val name: String,
    val path: String,
    val isDirectory: Boolean,
    val size: Long,
    val modifyTime: Long,
    val permissions: String,
    val owner: String
)
