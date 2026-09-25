package com.termpulse.sshmanager.presentation.servers

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.termpulse.sshmanager.domain.model.AuthType
import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.presentation.theme.Dimens
import kotlinx.coroutines.launch
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditServerScreen(
    existingServer: Server? = null,
    onSave: (Server, String, String?) -> Unit,
    onTestConnection: suspend (Server, String, String?) -> Result<Long>,
    onBack: () -> Unit
) {
    var name by remember { mutableStateOf(existingServer?.name ?: "") }
    var host by remember { mutableStateOf(existingServer?.host ?: "") }
    var port by remember { mutableStateOf(existingServer?.port?.toString() ?: "22") }
    var username by remember { mutableStateOf(existingServer?.username ?: "root") }
    var authType by remember { mutableStateOf(existingServer?.authType ?: AuthType.PASSWORD) }
    var secret by remember { mutableStateOf("") }
    var passphrase by remember { mutableStateOf("") }
    var tagsInput by remember { mutableStateOf(existingServer?.tags?.joinToString(", ") ?: "") }
    var showPassword by remember { mutableStateOf(false) }

    var isTesting by remember { mutableStateOf(false) }
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text(if (existingServer == null) "Add SSH Server" else "Edit Server") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(Dimens.paddingMedium),
            verticalArrangement = Arrangement.spacedBy(Dimens.paddingMedium)
        ) {
            // General Info
            Text(
                text = "CONNECTION DETAILS",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold
            )

            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Server Friendly Name") },
                placeholder = { Text("e.g. Production Web API") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Dimens.paddingSmall)) {
                OutlinedTextField(
                    value = host,
                    onValueChange = { host = it },
                    label = { Text("Host / IP Address") },
                    placeholder = { Text("192.168.1.10 or domain.com") },
                    singleLine = true,
                    modifier = Modifier.weight(0.7f)
                )

                OutlinedTextField(
                    value = port,
                    onValueChange = { port = it },
                    label = { Text("Port") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.weight(0.3f)
                )
            }

            OutlinedTextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("SSH Username") },
                placeholder = { Text("e.g. root or ubuntu") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            // Authentication Type Switcher
            Text(
                text = "AUTHENTICATION METHOD",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(Dimens.cornerMedium))
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .padding(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(Dimens.cornerSmall))
                        .background(
                            if (authType == AuthType.PASSWORD) MaterialTheme.colorScheme.surface
                            else MaterialTheme.colorScheme.surfaceVariant
                        )
                        .clickable { authType = AuthType.PASSWORD }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Password",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = if (authType == AuthType.PASSWORD) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(Dimens.cornerSmall))
                        .background(
                            if (authType == AuthType.PRIVATE_KEY) MaterialTheme.colorScheme.surface
                            else MaterialTheme.colorScheme.surfaceVariant
                        )
                        .clickable { authType = AuthType.PRIVATE_KEY }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Key, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Private Key",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = if (authType == AuthType.PRIVATE_KEY) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            }

            if (authType == AuthType.PASSWORD) {
                OutlinedTextField(
                    value = secret,
                    onValueChange = { secret = it },
                    label = { Text("SSH Password") },
                    placeholder = { Text("Encrypted via Android Keystore") },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Icon(
                                if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = "Toggle visibility"
                            )
                        }
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            } else {
                OutlinedTextField(
                    value = secret,
                    onValueChange = { secret = it },
                    label = { Text("Private Key (PEM, OpenSSH, RSA, Ed25519)") },
                    placeholder = { Text("-----BEGIN OPENSSH PRIVATE KEY-----\n...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp),
                    textStyle = MaterialTheme.typography.bodyMedium.copy(fontFamily = FontFamily.Monospace)
                )

                OutlinedTextField(
                    value = passphrase,
                    onValueChange = { passphrase = it },
                    label = { Text("Passphrase (Optional)") },
                    placeholder = { Text("Leave blank if key is unencrypted") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Tags
            OutlinedTextField(
                value = tagsInput,
                onValueChange = { tagsInput = it },
                label = { Text("Tags (comma separated)") },
                placeholder = { Text("Production, Web, AWS, Docker") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(Dimens.paddingSmall))

            // Action Buttons
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Dimens.paddingMedium)) {
                OutlinedButton(
                    onClick = {
                        scope.launch {
                            isTesting = true
                            val candidate = Server(
                                id = existingServer?.id ?: UUID.randomUUID().toString(),
                                name = name,
                                host = host,
                                port = port.toIntOrNull() ?: 22,
                                username = username,
                                authType = authType
                            )
                            val res = onTestConnection(candidate, secret, passphrase.ifBlank { null })
                            isTesting = false
                            if (res.isSuccess) {
                                snackbarHostState.showSnackbar("Connection successful! Latency: ${res.getOrNull()} ms")
                            } else {
                                snackbarHostState.showSnackbar("Connection failed: ${res.exceptionOrNull()?.message}")
                            }
                        }
                    },
                    modifier = Modifier.weight(1f),
                    enabled = !isTesting && host.isNotBlank() && username.isNotBlank() && secret.isNotBlank()
                ) {
                    if (isTesting) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    } else {
                        Text("Test Connection")
                    }
                }

                Button(
                    onClick = {
                        val parsedPort = port.toIntOrNull() ?: 22
                        val tags = tagsInput.split(",").map { it.trim() }.filter { it.isNotBlank() }
                        val server = (existingServer ?: Server(
                            id = UUID.randomUUID().toString(),
                            name = name,
                            host = host,
                            port = parsedPort,
                            username = username,
                            authType = authType,
                            tags = tags
                        )).copy(
                            name = name,
                            host = host,
                            port = parsedPort,
                            username = username,
                            authType = authType,
                            tags = tags,
                            updatedAt = System.currentTimeMillis()
                        )
                        onSave(server, secret, passphrase.ifBlank { null })
                    },
                    modifier = Modifier.weight(1f),
                    enabled = name.isNotBlank() && host.isNotBlank() && username.isNotBlank() && secret.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Save Server")
                }
            }
        }
    }
}
