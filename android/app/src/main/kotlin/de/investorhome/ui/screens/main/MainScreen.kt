package de.investorhome.ui.screens.main

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavController
import androidx.compose.ui.platform.LocalContext
import de.investorhome.R
import de.investorhome.data.session.SessionManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(navController: NavController? = null) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val scope = rememberCoroutineScope()
    var selectedTab by remember { mutableStateOf(0) }

    val tabs = listOf(
        Tab(R.string.dashboard_title, Icons.Default.Home),
        Tab(R.string.browse_title, Icons.Default.Search),
        Tab(R.string.areas_title, Icons.Default.BarChart),
        Tab(R.string.searches_title, Icons.Default.Favorite)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("InvestorHome") },
                actions = {
                    IconButton(onClick = {
                        scope.launch {
                            sessionManager.logout()
                            navController?.navigate("auth/login") {
                                popUpTo("main") { inclusive = true }
                            }
                        }
                    }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout")
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                tabs.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        icon = { Icon(tab.icon, contentDescription = stringResource(tab.labelResId)) },
                        label = { Text(stringResource(tab.labelResId), style = MaterialTheme.typography.labelSmall) },
                        selected = selectedTab == index,
                        onClick = { selectedTab = index }
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            when (selectedTab) {
                0 -> DashboardScreen()
                1 -> BrowseScreen()
                2 -> AreasScreen()
                3 -> SearchesScreen()
            }
        }
    }
}

data class Tab(val labelResId: Int, val icon: ImageVector)
