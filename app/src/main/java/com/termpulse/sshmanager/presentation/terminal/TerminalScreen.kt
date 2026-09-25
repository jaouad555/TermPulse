package com.termpulse.sshmanager.presentation.terminal

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.termpulse.sshmanager.domain.model.ConnectionState
import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.presentation.theme.TerminalBlack
import com.termpulse.sshmanager.presentation.theme.TerminalGreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TerminalScreen(
    server: Server,
    connectionState: ConnectionState,
    terminalLines: List<String>,
    onSendCommand: (String) -> Unit,
    onSendKey: (String) -> Unit,
    onDisconnect: () -> Unit,
    onReconnect: () -> Unit,
    onClear: () -> Unit,
    onBack: () -> Unit
) {
    var commandInput by remember { mutableStateOf("") }
    val verticalScrollState = rememberScrollState()

    // Auto-scroll on new output
    LaunchedEffect(terminalLines.size) {
        verticalScrollState.animateScrollTo(verticalScrollState.maxValue)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(
                                    when (connectionState) {
                                        is ConnectionState.Connected -> TerminalGreen
                                        is ConnectionState.Connecting -> Color(0xFFEAB308)
                                        else -> Color(0xFFEF4444)
                                    }
                                )
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "${server.username}@${server.name}",
                                style = MaterialTheme.typography.titleMedium,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = when (connectionState) {
                                    is ConnectionState.Connected -> "Interactive Shell • xterm-256color"
                                    is ConnectionState.Connecting -> "Establishing encrypted tunnel..."
                                    is ConnectionState.Error -> "Connection dropped"
                                    else -> "Disconnected"
                                },
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = onClear) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear")
                    }
                    IconButton(onClick = if (connectionState is ConnectionState.Connected) onDisconnect else onReconnect) {
                        Icon(Icons.Default.Refresh, contentDescription = "Reconnect")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = TerminalBlack,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White,
                    actionIconContentColor = Color.White
                )
            )
        },
        bottomBar = {
            Column(modifier = Modifier.background(Color(0xFF131B2A))) {
                // Special Keys Toolbar (ESC, TAB, CTRL-C, |, ~, /, -, UP, DOWN)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val specialKeys = listOf(
                        "ESC" to "\u001b",
                        "TAB" to "\t",
                        "CTRL-C" to "\u0003",
                        "CTRL-D" to "\u0004",
                        "CTRL-Z" to "\u001a",
                        "|" to "|",
                        "~" to "~",
                        "/" to "/",
                        "-" to "-",
                        "▲" to "\u001b[A",
                        "▼" to "\u001b[B"
                    )

                    specialKeys.forEach { (label, keySeq) ->
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = Color(0xFF1E293B),
                            modifier = Modifier.clickable { onSendKey(keySeq) }
                        ) {
                            Text(
                                text = label,
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFFE2E8F0),
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
                            )
                        }
                    }
                }

                // Command Input Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "❯ ",
                        fontFamily = FontFamily.Monospace,
                        color = TerminalGreen,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                    )

                    BasicTextField(
                        value = commandInput,
                        onValueChange = { commandInput = it },
                        textStyle = TextStyle(
                            color = Color.White,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 14.sp
                        ),
                        cursorBrush = SolidColor(TerminalGreen),
                        modifier = Modifier
                            .weight(1f)
                            .background(Color(0xFF0F172A), RoundedCornerShape(6.dp))
                            .padding(horizontal = 10.dp, vertical = 8.dp)
                    )

                    Spacer(modifier = Modifier.width(6.dp))

                    IconButton(
                        onClick = {
                            if (commandInput.isNotBlank()) {
                                onSendCommand(commandInput + "\n")
                                commandInput = ""
                            }
                        }
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Send",
                            tint = TerminalGreen
                        )
                    }
                }
            }
        },
        containerColor = TerminalBlack
    ) { padding ->
        // Terminal Output Window
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(TerminalBlack)
                .verticalScroll(verticalScrollState)
                .padding(12.dp)
        ) {
            Column {
                terminalLines.forEach { line ->
                    Text(
                        text = line,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        lineHeight = 16.sp,
                        color = Color(0xFFE2E8F0)
                    )
                }
            }
        }
    }
}
