package de.investorhome.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import de.investorhome.R
import de.investorhome.data.api.RegisterRequest
import de.investorhome.data.api.RetrofitClient
import de.investorhome.data.session.SessionManager
import de.investorhome.ui.theme.Dimensions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun RegisterScreen(navController: NavController) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val scope = rememberCoroutineScope()

    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var passwordMismatch by remember { mutableStateOf(false) }
    var showPassword by remember { mutableStateOf(false) }
    var showConfirmPassword by remember { mutableStateOf(false) }
    var emailError by remember { mutableStateOf(false) }
    var passwordError by remember { mutableStateOf(false) }
    var apiError by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(Dimensions.screenPadding),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            "InvestorHome",
            style = MaterialTheme.typography.displayLarge,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom =16.dp)
        )

        Text(
            stringResource(R.string.sign_up),
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(bottom =8.dp)
        )

        OutlinedTextField(
            value = fullName,
            onValueChange = { fullName = it },
            label = { Text(stringResource(R.string.full_name), style = MaterialTheme.typography.labelMedium) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            shape = RoundedCornerShape(Dimensions.shapeRadiusField),
            enabled = !loading,
        )

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text(stringResource(R.string.email), style = MaterialTheme.typography.labelMedium) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = if (emailError) 8.dp else 12.dp),
            shape = RoundedCornerShape(Dimensions.shapeRadiusField),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            enabled = !loading,
            isError = emailError,
            supportingText = {
                if (emailError) {
                    Text(stringResource(R.string.email_error), style = MaterialTheme.typography.labelSmall)
                }
            }
        )

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text(stringResource(R.string.password), style = MaterialTheme.typography.labelMedium) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = if (passwordError) 8.dp else 12.dp),
            visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
            trailingIcon = {
                IconButton(onClick = { showPassword = !showPassword }, modifier = Modifier.padding(end = 8.dp)) {
                    Icon(
                        imageVector = if (showPassword) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                        contentDescription = if (showPassword) "Hide password" else "Show password",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            shape = RoundedCornerShape(Dimensions.shapeRadiusField),
            enabled = !loading,
            isError = passwordError,
            supportingText = {
                if (passwordError) {
                    Text(stringResource(R.string.password_error), style = MaterialTheme.typography.labelSmall)
                }
            }
        )

        OutlinedTextField(
            value = confirmPassword,
            onValueChange = {
                confirmPassword = it
                passwordMismatch = password != it && it.isNotEmpty()
            },
            label = { Text(stringResource(R.string.confirm_password), style = MaterialTheme.typography.labelMedium) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = if (passwordMismatch) 8.dp else 24.dp),
            visualTransformation = if (showConfirmPassword) VisualTransformation.None else PasswordVisualTransformation(),
            trailingIcon = {
                IconButton(onClick = { showConfirmPassword = !showConfirmPassword }, modifier = Modifier.padding(end = 8.dp)) {
                    Icon(
                        imageVector = if (showConfirmPassword) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                        contentDescription = if (showConfirmPassword) "Hide password" else "Show password",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            shape = RoundedCornerShape(Dimensions.shapeRadiusField),
            enabled = !loading,
            isError = passwordMismatch,
        )

        if (passwordMismatch) {
            Text(
                stringResource(R.string.password_mismatch),
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(bottom =16.dp)
            )
        }

        if (apiError != null) {
            Text(
                apiError ?: "",
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        Button(
            onClick = {
                emailError = email.isEmpty() || !email.contains("@")
                passwordError = password.length < 6

                if (!emailError && !passwordError && !passwordMismatch && password.isNotEmpty() && confirmPassword.isNotEmpty()) {
                    loading = true
                    apiError = null
                    scope.launch {
                        try {
                            val response = withContext(Dispatchers.IO) {
                                RetrofitClient.authService.register(RegisterRequest(email, password, fullName))
                            }
                            sessionManager.login(
                                email = response.email,
                                name = response.name,
                                token = response.access_token
                            )
                            navController.navigate("main") {
                                popUpTo("auth/login") { inclusive = true }
                            }
                        } catch (e: Exception) {
                            apiError = e.message ?: "Registration failed"
                            loading = false
                        }
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            shape = RoundedCornerShape(Dimensions.shapeRadiusButton),
            enabled = !loading && !passwordMismatch && password.isNotEmpty() && confirmPassword.isNotEmpty(),
        ) {
            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier.then(Modifier),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    stringResource(R.string.sign_up),
                    style = MaterialTheme.typography.bodyMedium.copy(color = Color.White)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                stringResource(R.string.already_have_account),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            TextButton(
                onClick = { navController.navigate("auth/login") },
                modifier = Modifier.padding(top = 4.dp)
            ) {
                Text(
                    stringResource(R.string.log_in),
                    color = MaterialTheme.colorScheme.primary,
                    style = MaterialTheme.typography.labelLarge
                )
            }
        }

        Spacer(modifier = Modifier.height(Dimensions.spacingXxl))
    }
}
