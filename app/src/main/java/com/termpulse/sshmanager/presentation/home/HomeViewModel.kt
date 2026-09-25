package com.termpulse.sshmanager.presentation.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.termpulse.sshmanager.domain.model.Server
import com.termpulse.sshmanager.domain.usecase.GetServersUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class HomeUiState(
    val servers: List<Server> = emptyList(),
    val searchQuery: String = "",
    val selectedTag: String? = null,
    val availableTags: List<String> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class HomeViewModel(
    private val getServersUseCase: GetServersUseCase
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    private val _selectedTag = MutableStateFlow<String?>(null)

    val uiState: StateFlow<HomeUiState> = combine(
        getServersUseCase(),
        _searchQuery,
        _selectedTag
    ) { allServers, query, tag ->
        val filtered = allServers.filter { server ->
            val matchesQuery = query.isBlank() ||
                server.name.contains(query, ignoreCase = true) ||
                server.host.contains(query, ignoreCase = true) ||
                server.username.contains(query, ignoreCase = true) ||
                server.tags.any { it.contains(query, ignoreCase = true) }

            val matchesTag = tag == null || server.tags.contains(tag)
            matchesQuery && matchesTag
        }

        val tags = allServers.flatMap { it.tags }.distinct().sorted()

        HomeUiState(
            servers = filtered,
            searchQuery = query,
            selectedTag = tag,
            availableTags = tags,
            isLoading = false
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = HomeUiState(isLoading = true)
    )

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun onTagSelected(tag: String?) {
        _selectedTag.value = if (_selectedTag.value == tag) null else tag
    }
}
