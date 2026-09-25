package com.termpulse.sshmanager

import android.app.Application
import androidx.room.Room
import com.termpulse.sshmanager.data.local.database.AppDatabase
import com.termpulse.sshmanager.data.local.secure.KeystoreManager
import com.termpulse.sshmanager.data.repository.ServerRepositoryImpl
import com.termpulse.sshmanager.data.ssh.SshClientEngine
import com.termpulse.sshmanager.domain.repository.ServerRepository
import com.termpulse.sshmanager.domain.usecase.ConnectSshUseCase
import com.termpulse.sshmanager.domain.usecase.GetServersUseCase
import com.termpulse.sshmanager.domain.usecase.SaveServerUseCase

class TermPulseApplication : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var keystoreManager: KeystoreManager
        private set

    lateinit var serverRepository: ServerRepository
        private set

    lateinit var sshClientEngine: SshClientEngine
        private set

    lateinit var getServersUseCase: GetServersUseCase
        private set

    lateinit var saveServerUseCase: SaveServerUseCase
        private set

    lateinit var connectSshUseCase: ConnectSshUseCase
        private set

    override fun onCreate() {
        super.onCreate()

        database = Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java,
            "termpulse_database"
        ).fallbackToDestructiveMigration().build()

        keystoreManager = KeystoreManager(applicationContext)
        serverRepository = ServerRepositoryImpl(database, keystoreManager)
        sshClientEngine = SshClientEngine()

        getServersUseCase = GetServersUseCase(serverRepository)
        saveServerUseCase = SaveServerUseCase(serverRepository)
        connectSshUseCase = ConnectSshUseCase(serverRepository)
    }
}
