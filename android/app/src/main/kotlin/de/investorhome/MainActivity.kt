package de.investorhome

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import de.investorhome.ui.navigation.AppNavigation
import de.investorhome.ui.theme.InvestorHomeTheme
import de.investorhome.data.session.SessionManager
import de.investorhome.data.api.RetrofitClient
import de.investorhome.data.api.RetrofitClientManager

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val sessionManager = SessionManager(this)
        RetrofitClientManager.initialize(sessionManager)

        setContent {
            InvestorHomeTheme {
                Surface(modifier = Modifier.background(MaterialTheme.colorScheme.background)) {
                    val isLoggedIn = remember { mutableStateOf<Boolean?>(null) }
                    val hasRegistered = remember { mutableStateOf<Boolean?>(null) }

                    LaunchedEffect(Unit) {
                        isLoggedIn.value = sessionManager.isLoggedIn()
                        hasRegistered.value = sessionManager.hasRegistered()
                    }

                    val startRoute = when {
                        isLoggedIn.value == true -> "main"
                        hasRegistered.value == true -> "auth/login"
                        else -> "auth/register"
                    }

                    when (isLoggedIn.value) {
                        true, false -> AppNavigation(startRoute = startRoute)
                        null -> {} // Loading
                    }
                }
            }
        }
    }
}
