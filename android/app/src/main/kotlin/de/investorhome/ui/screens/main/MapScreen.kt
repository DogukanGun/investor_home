package de.investorhome.ui.screens.main

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import de.investorhome.ui.components.ScreenHeader
import de.investorhome.ui.theme.Dimensions

@Composable
fun MapScreen() {
    var isMapReady by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(modifier = Modifier.padding(Dimensions.screenPadding)) {
            ScreenHeader(eyebrow = "LOCATION", title = "Map View", subtitle = "Interactive property map")
        }

        if (!isMapReady) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(Dimensions.screenPadding),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    "MapLibre + OpenStreetMap integration",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    "Ready for implementation",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.outline,
                    modifier = Modifier.padding(top = Dimensions.spacingSm)
                )
                Button(
                    onClick = { isMapReady = true },
                    modifier = Modifier.padding(top = Dimensions.spacingLg)
                ) {
                    Text("Enable Map Preview")
                }
            }
        } else {
            Card(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(Dimensions.screenPadding),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.surfaceDim),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "MapView placeholder\n(MapLibre integration)",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
