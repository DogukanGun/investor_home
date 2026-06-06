package de.investorhome.ui.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF4d8eff),
    primaryContainer = Color(0xFFadc6ff),
    secondary = Color(0xFF4edea3),
    secondaryContainer = Color(0xFF00a572),
    tertiary = Color(0xFFffb95f),
    tertiaryContainer = Color(0xFFca8100),
    error = Color(0xFFffb4ab),
    errorContainer = Color(0xFF93000a),
    background = Color(0xFF10131a),
    surface = Color(0xFF1d2027),
    onBackground = Color(0xFFe1e2ec),
    onSurface = Color(0xFFe1e2ec),
)

@Composable
fun InvestorHomeTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
