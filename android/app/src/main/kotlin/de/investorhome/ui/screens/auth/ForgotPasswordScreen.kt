package de.investorhome.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import de.investorhome.R
import de.investorhome.data.api.RetrofitClient
import de.investorhome.data.api.ForgotPasswordRequest
import de.investorhome.ui.theme.Dimensions
import kotlinx.coroutines.launch

@Composable
fun ForgotPasswordScreen(navController: NavController? = null) {
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var submitted by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Top bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Dimensions.cardPadding),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            IconButton(onClick = { navController?.navigateUp() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }
            Text(stringResource(R.string.reset_password), style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.width(48.dp))
        }

        if (submitted) {
            // Success state
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(Dimensions.cardPadding),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                shape = MaterialTheme.shapes.medium
            ) {
                Column(
                    modifier = Modifier.padding(Dimensions.cardPadding),
                    verticalArrangement = Arrangement.spacedBy(Dimensions.spacingMd)
                ) {
                    Text(
                        "✓ ${stringResource(R.string.check_your_email)}",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Text(
                        stringResource(R.string.reset_link_sent),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Text(
                        stringResource(R.string.link_expires_in),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Button(
                        onClick = { navController?.navigate("auth/login") { popUpTo("auth/forgot-password") { inclusive = true } } },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(stringResource(R.string.back_to_login))
                    }
                }
            }
        } else {
            // Form
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(Dimensions.screenPadding),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    stringResource(R.string.enter_email_reset),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                if (error != null) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                    ) {
                        Text(
                            error!!,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(Dimensions.cardPaddingSmall)
                        )
                    }
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text(stringResource(R.string.email)) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    singleLine = true,
                    enabled = !loading
                )

                Button(
                    onClick = {
                        error = null
                        loading = true
                        scope.launch {
                            try {
                                RetrofitClient.authService.forgotPassword(
                                    ForgotPasswordRequest(email = email)
                                )
                                submitted = true
                            } catch (e: Exception) {
                                error = e.message ?: "Failed to send reset email"
                            } finally {
                                loading = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !loading && email.isNotEmpty()
                ) {
                    Text(if (loading) "Sending..." else stringResource(R.string.send_reset_link))
                }
            }
        }
    }
}
