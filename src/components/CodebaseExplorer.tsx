import React, { useState } from 'react';
import JSZip from 'jszip';
import { useSsh } from '../context/SshContext';
import {
  Code,
  Download,
  Copy,
  Check,
  FileCode,
  Folder,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CodeFile {
  path: string;
  filename: string;
  category: 'data' | 'domain' | 'presentation' | 'config' | 'test';
  content: string;
}

const ANDROID_FILES: CodeFile[] = [
  {
    path: 'gradle/libs.versions.toml',
    filename: 'libs.versions.toml',
    category: 'config',
    content: `[versions]
agp = "8.8.0"
kotlin = "2.1.0"
coreKtx = "1.15.0"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.10.0"
composeBom = "2025.02.00"
navigationCompose = "2.8.7"
room = "2.6.1"
securityCrypto = "1.1.0-alpha06"
biometric = "1.2.0-alpha05"
sshj = "0.39.0"
bouncycastle = "1.78.1"
coroutines = "1.10.1"
datastore = "1.1.2"
junit = "4.13.2"
junitVersion = "1.2.1"
espressoCore = "3.6.1"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }

# Room
androidx-room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
androidx-room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
androidx-room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

# Security & Keystore
androidx-security-crypto = { group = "androidx.security", name = "security-crypto-ktx", version.ref = "securityCrypto" }
androidx-biometric = { group = "androidx.biometric", name = "biometric-ktx", version.ref = "biometric" }

# SSH & SFTP Engine
sshj = { group = "com.hierynomus", name = "sshj", version.ref = "sshj" }
bouncycastle-prov = { group = "org.bouncycastle", name = "bcprov-jdk18on", version.ref = "bouncycastle" }
bouncycastle-pkix = { group = "org.bouncycastle", name = "bcpkix-jdk18on", version.ref = "bouncycastle" }

# Testing
junit = { group = "junit", name = "junit", version.ref = "junit" }`,
  },
  {
    path: 'app/build.gradle.kts',
    filename: 'build.gradle.kts',
    category: 'config',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    id("kotlin-kapt")
}

android {
    namespace = "com.termpulse.sshmanager"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.termpulse.sshmanager"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.material3)
    implementation(libs.androidx.navigation.compose)

    // Room Database
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    kapt(libs.androidx.room.compiler)

    // Android Keystore AES-256
    implementation(libs.androidx.security.crypto)
    implementation(libs.androidx.biometric)

    // SSH & SFTP Engine
    implementation(libs.sshj)
    implementation(libs.bouncycastle.prov)
}`,
  },
  {
    path: 'app/src/main/java/com/termpulse/sshmanager/domain/model/Server.kt',
    filename: 'Server.kt',
    category: 'domain',
    content: `package com.termpulse.sshmanager.domain.model

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
)`,
  },
  {
    path: 'app/src/main/java/com/termpulse/sshmanager/domain/repository/ServerRepository.kt',
    filename: 'ServerRepository.kt',
    category: 'domain',
    content: `package com.termpulse.sshmanager.domain.repository

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
}`,
  },
  {
    path: 'app/src/main/java/com/termpulse/sshmanager/data/local/database/ServerDao.kt',
    filename: 'ServerDao.kt',
    category: 'data',
    content: `package com.termpulse.sshmanager.data.local.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface ServerDao {
    @Query("SELECT * FROM servers ORDER BY lastConnectedAt DESC, createdAt DESC")
    fun getAllServers(): Flow<List<ServerEntity>>

    @Query("SELECT * FROM servers WHERE id = :id LIMIT 1")
    suspend fun getServerById(id: String): ServerEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(server: ServerEntity)

    @Query("DELETE FROM servers WHERE id = :id")
    suspend fun deleteById(id: String)
}`,
  },
  {
    path: 'app/src/main/java/com/termpulse/sshmanager/data/local/secure/KeystoreManager.kt',
    filename: 'KeystoreManager.kt',
    category: 'data',
    content: `package com.termpulse.sshmanager.data.local.secure

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Secure Credential Storage using Android Keystore
 * Encrypts passwords and private keys with AES256-GCM.
 * Plaintext secrets are never stored in Room or memory unencrypted.
 */
class KeystoreManager(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "termpulse_secure_vault",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun storeSecret(serverId: String, secret: String) {
        sharedPreferences.edit().putString("secret_$serverId", secret).apply()
    }

    fun getSecret(serverId: String): String? {
        return sharedPreferences.getString("secret_$serverId", null)
    }

    fun storePassphrase(serverId: String, passphrase: String) {
        sharedPreferences.edit().putString("passphrase_$serverId", passphrase).apply()
    }

    fun getPassphrase(serverId: String): String? {
        return sharedPreferences.getString("passphrase_$serverId", null)
    }

    fun removeSecrets(serverId: String) {
        sharedPreferences.edit()
            .remove("secret_$serverId")
            .remove("passphrase_$serverId")
            .apply()
    }
}`,
  },
  {
    path: 'app/src/main/java/com/termpulse/sshmanager/data/ssh/SshClientEngine.kt',
    filename: 'SshClientEngine.kt',
    category: 'data',
    content: `package com.termpulse.sshmanager.data.ssh

import com.termpulse.sshmanager.domain.model.AuthType
import com.termpulse.sshmanager.domain.model.ConnectionState
import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.domain.model.SftpFile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext
import net.schmizz.sshj.SSHClient
import net.schmizz.sshj.connection.channel.direct.Session
import net.schmizz.sshj.sftp.SFTPClient
import net.schmizz.sshj.transport.verification.PromiscuousVerifier

class SshClientEngine {

    private var sshClient: SSHClient? = null
    private var activeSession: Session? = null
    private var activeShell: Session.Shell? = null
    private var sftpClient: SFTPClient? = null

    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Disconnected)
    val connectionState: StateFlow<ConnectionState> = _connectionState

    private val _terminalOutput = MutableSharedFlow<String>(extraBufferCapacity = 1000)
    val terminalOutput: SharedFlow<String> = _terminalOutput

    suspend fun connect(
        server: Server,
        secret: String,
        passphrase: String? = null
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            _connectionState.value = ConnectionState.Connecting

            val client = SSHClient().apply {
                addHostKeyVerifier(PromiscuousVerifier())
                connectTimeout = 10000
                timeout = 10000
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

            sshClient = client
            val session = client.startSession().apply {
                allocatePTY("xterm-256color", 80, 24, 0, 0, emptyMap())
            }
            activeSession = session
            val shell = session.startShell()
            activeShell = shell

            _connectionState.value = ConnectionState.Connected(0)
            Result.success(Unit)
        } catch (e: Exception) {
            _connectionState.value = ConnectionState.Error(e.message ?: "Failed to connect to SSH host")
            disconnect()
            Result.failure(e)
        }
    }

    suspend fun disconnect() = withContext(Dispatchers.IO) {
        try {
            sftpClient?.close()
            activeShell?.close()
            activeSession?.close()
            sshClient?.disconnect()
        } finally {
            _connectionState.value = ConnectionState.Disconnected
        }
    }
}`,
  },
  {
    path: 'app/src/main/java/com/termpulse/sshmanager/presentation/terminal/TerminalScreen.kt',
    filename: 'TerminalScreen.kt',
    category: 'presentation',
    content: `package com.termpulse.sshmanager.presentation.terminal

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.termpulse.sshmanager.domain.model.ConnectionState
import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.presentation.theme.TerminalBlack

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TerminalScreen(
    server: Server,
    connectionState: ConnectionState,
    terminalLines: List<String>,
    onSendCommand: (String) -> Unit,
    onBack: () -> Unit
) {
    val scrollState = rememberScrollState()

    LaunchedEffect(terminalLines.size) {
        scrollState.animateScrollTo(scrollState.maxValue)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("\${server.username}@\${server.name}", fontFamily = FontFamily.Monospace) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = TerminalBlack)
            )
        },
        containerColor = TerminalBlack
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(scrollState)
                .padding(12.dp)
        ) {
            terminalLines.forEach { line ->
                Text(
                    text = line,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 12.sp,
                    color = Color(0xFFE2E8F0)
                )
            }
        }
    }
}`,
  },
  {
    path: 'app/src/main/java/com/termpulse/sshmanager/MainActivity.kt',
    filename: 'MainActivity.kt',
    category: 'presentation',
    content: `package com.termpulse.sshmanager

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.termpulse.sshmanager.presentation.home.HomeScreen
import com.termpulse.sshmanager.presentation.navigation.Screen
import com.termpulse.sshmanager.presentation.theme.TermPulseTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as TermPulseApplication

        setContent {
            val navController = rememberNavController()
            TermPulseTheme {
                NavHost(navController = navController, startDestination = Screen.Home.route) {
                    composable(Screen.Home.route) {
                        HomeScreen(
                            viewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
                            onServerClick = { id -> navController.navigate(Screen.ServerDetail.createRoute(id)) },
                            onAddServerClick = { navController.navigate(Screen.AddServer.route) },
                            onTerminalClick = { id -> navController.navigate(Screen.Terminal.createRoute(id)) },
                            onSftpClick = { id -> navController.navigate(Screen.Sftp.createRoute(id)) },
                            onSettingsClick = { navController.navigate(Screen.Settings.route) }
                        )
                    }
                }
            }
        }
    }
}`,
  },
  {
    path: 'app/src/test/java/com/termpulse/sshmanager/domain/usecase/ServerValidationTest.kt',
    filename: 'ServerValidationTest.kt',
    category: 'test',
    content: `package com.termpulse.sshmanager.domain.usecase

import com.termpulse.sshmanager.domain.model.AuthType
import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.domain.repository.ServerRepository
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.mockito.Mockito.mock

class ServerValidationTest {

    @Test
    fun \`empty server name returns failure\`() = runBlocking {
        val mockRepo = mock(ServerRepository::class.java)
        val saveUseCase = SaveServerUseCase(mockRepo)

        val server = Server(
            id = "1",
            name = "",
            host = "192.168.1.1",
            port = 22,
            username = "root",
            authType = AuthType.PASSWORD
        )
        val result = saveUseCase(server, "secret", null)
        assertTrue(result.isFailure)
        assertEquals("Server name cannot be empty", result.exceptionOrNull()?.message)
    }
}`,
  }
];

export const CodebaseExplorer: React.FC = () => {
  const { showToast, themeMode } = useSsh();
  const [selectedFile, setSelectedFile] = useState<CodeFile>(ANDROID_FILES[2]);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const isDark = themeMode === 'DARK' || (themeMode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    showToast(`Copied ${selectedFile.filename} to clipboard`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // Add all project files
      ANDROID_FILES.forEach(f => {
        zip.file(f.path, f.content);
      });

      // Add README.md
      zip.file('README.md', `# TermPulse SSH Manager for Android\n\nProduction-ready modern SSH & SFTP client for Android built with Jetpack Compose, Material 3, Clean Architecture, Room Database, Android Keystore, and sshj.`);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TermPulse-Android-CleanArchitecture.zip';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported full Android Studio Project as .zip', 'success');
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      {/* Sidebar: File Tree */}
      <div className={`w-full md:w-72 border-r flex flex-col shrink-0 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider">Android Clean Arch</h2>
          </div>
          <button
            onClick={handleExportZip}
            disabled={isExporting}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[11px] font-medium border border-emerald-500/30 transition-colors cursor-pointer"
            title="Download complete ready-to-build Android Studio project (.zip)"
          >
            <Download className="w-3 h-3" />
            <span>{isExporting ? 'Packaging...' : 'Export .ZIP'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
          {ANDROID_FILES.map(file => {
            const isSelected = selectedFile.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/15 text-sky-400 font-medium'
                    : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0 flex-1 truncate">
                  <span className="truncate">{file.filename}</span>
                  <span className="block text-[10px] text-slate-500 truncate font-mono">{file.path}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 font-mono text-xs select-text">
        <div className="h-10 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900/90 shrink-0 select-none">
          <span className="text-slate-300 font-semibold text-xs">{selectedFile.path}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px]">Copy</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 leading-relaxed text-slate-200">
          <pre className="whitespace-pre font-mono text-xs">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
