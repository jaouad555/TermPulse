package com.termpulse.sshmanager.presentation.navigation

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object AddServer : Screen("add_server")
    data class EditServer(val serverId: String) : Screen("edit_server/{serverId}") {
        companion object {
            fun createRoute(serverId: String) = "edit_server/$serverId"
        }
    }
    data class ServerDetail(val serverId: String) : Screen("server_detail/{serverId}") {
        companion object {
            fun createRoute(serverId: String) = "server_detail/$serverId"
        }
    }
    data class Terminal(val serverId: String) : Screen("terminal/{serverId}") {
        companion object {
            fun createRoute(serverId: String) = "terminal/$serverId"
        }
    }
    data class Sftp(val serverId: String) : Screen("sftp/{serverId}") {
        companion object {
            fun createRoute(serverId: String) = "sftp/$serverId"
        }
    }
    data object Settings : Screen("settings")
}
