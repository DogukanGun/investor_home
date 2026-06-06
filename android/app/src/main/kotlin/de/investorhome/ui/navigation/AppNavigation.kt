package de.investorhome.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import de.investorhome.ui.screens.auth.LoginScreen
import de.investorhome.ui.screens.auth.RegisterScreen
import de.investorhome.ui.screens.auth.ForgotPasswordScreen
import de.investorhome.ui.screens.main.MainScreen

@Composable
fun AppNavigation(startRoute: String = "main") {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = startRoute) {
        composable("auth/login") {
            LoginScreen(navController)
        }
        composable("auth/register") {
            RegisterScreen(navController)
        }
        composable("auth/forgot-password") {
            ForgotPasswordScreen(navController)
        }
        composable("main") {
            MainScreen(navController)
        }
    }
}
