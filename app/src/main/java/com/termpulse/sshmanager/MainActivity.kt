package com.termpulse.sshmanager

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.termpulse.sshmanager.domain.model.ConnectionState
import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.presentation.home.HomeScreen
import com.termpulse.sshmanager.presentation.home.HomeViewModel
import com.termpulse.sshmanager.presentation.navigation.Screen
import com.termpulse.sshmanager.presentation.servers.AddEditServerScreen
import com.termpulse.sshmanager.presentation.settings.SettingsScreen
import com.termpulse.sshmanager.presentation.sftp.SftpScreen
import com.termpulse.sshmanager.presentation.terminal.TerminalScreen
import com.termpulse.sshmanager.presentation.theme.TermPulseTheme
import com.termpulse.sshmanager.presentation.theme.ThemeMode

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as TermPulseApplication
        val repository = app.serverRepository
        val sshEngine = app.sshClientEngine

        setContent {
            var themeMode by remember { mutableStateOf(ThemeMode.DARK) }
            val navController = rememberNavController()

            TermPulseTheme(themeMode = themeMode) {
                NavHost(
                    navController = navController,
                    startDestination = Screen.Home.route
                ) {
                    composable(Screen.Home.route) {
                        val homeViewModel = remember {
                            HomeViewModel(getServersUseCase = app.getServersUseCase)
                        }
                        HomeScreen(
                            viewModel = homeViewModel,
                            onServerClick = { id -> navController.navigate(Screen.ServerDetail.createRoute(id)) },
                            onAddServerClick = { navController.navigate(Screen.AddServer.route) },
                            onTerminalClick = { id -> navController.navigate(Screen.Terminal.createRoute(id)) },
                            onSftpClick = { id -> navController.navigate(Screen.Sftp.createRoute(id)) },
                            onSettingsClick = { navController.navigate(Screen.Settings.route) }
                        )
                    }

                    composable(Screen.AddServer.route) {
                        AddEditServerScreen(
                            existingServer = null,
                            onSave = { server, secret, passphrase ->
                                // Coroutine to save and return
                                navController.popBackStack()
                            },
                            onTestConnection = { server, secret, passphrase ->
                                repository.testConnection(server, secret, passphrase)
                            },
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable(Screen.Settings.route) {
                        SettingsScreen(
                            currentTheme = themeMode,
                            onThemeChanged = { themeMode = it },
                            onBack = { navController.popBackStack() }
                        )
                    }
                }
            }
        }
    }
}
