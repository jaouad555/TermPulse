package com.termpulse.sshmanager.domain.usecase

import com.termpulse.sshmanager.domain.model.AuthType
import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.domain.repository.ServerRepository
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mock

class ServerValidationTest {

    private lateinit var mockRepository: ServerRepository
    private lateinit var saveServerUseCase: SaveServerUseCase

    @Before
    fun setUp() {
        mockRepository = mock(ServerRepository::class.java)
        saveServerUseCase = SaveServerUseCase(mockRepository)
    }

    @Test
    fun `empty server name returns failure`() = runBlocking {
        val server = Server(
            id = "1",
            name = "",
            host = "192.168.1.1",
            port = 22,
            username = "root",
            authType = AuthType.PASSWORD
        )
        val result = saveServerUseCase(server, "secret", null)
        assertTrue(result.isFailure)
        assertEquals("Server name cannot be empty", result.exceptionOrNull()?.message)
    }

    @Test
    fun `invalid port returns failure`() = runBlocking {
        val server = Server(
            id = "1",
            name = "Test Server",
            host = "192.168.1.1",
            port = 99999,
            username = "root",
            authType = AuthType.PASSWORD
        )
        val result = saveServerUseCase(server, "secret", null)
        assertTrue(result.isFailure)
        assertEquals("Port must be between 1 and 65535", result.exceptionOrNull()?.message)
    }

    @Test
    fun `blank secret returns failure`() = runBlocking {
        val server = Server(
            id = "1",
            name = "Test Server",
            host = "192.168.1.1",
            port = 22,
            username = "root",
            authType = AuthType.PASSWORD
        )
        val result = saveServerUseCase(server, "  ", null)
        assertTrue(result.isFailure)
        assertEquals("Password or Private Key is required", result.exceptionOrNull()?.message)
    }
}
