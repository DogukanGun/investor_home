package de.investorhome.ui.screens.main

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import de.investorhome.data.api.Listing
import de.investorhome.data.api.AreaSummary
import de.investorhome.data.api.RetrofitClient
import de.investorhome.ui.components.ScreenHeader
import de.investorhome.ui.theme.Dimensions
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen() {
    val scope = rememberCoroutineScope()
    var listings by remember { mutableStateOf(emptyList<Listing>()) }
    var areas by remember { mutableStateOf(emptyList<AreaSummary>()) }
    var loading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                listings = RetrofitClient.listingsService.getListings(listingKind = "sale", limit = 100)
                areas = RetrofitClient.areasService.getAreas()
                loading = false
            } catch (e: Exception) {
                errorMessage = "Error: ${e.message ?: "Unknown error"}"
                loading = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(Dimensions.screenPadding)
    ) {
        ScreenHeader(eyebrow = "OVERVIEW", title = "Dashboard", subtitle = "Real-time insights")

        if (errorMessage != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = Dimensions.spacingLg),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Text(
                    errorMessage!!,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(Dimensions.cardPaddingSmall)
                )
            }
        }

        val goodDeals = listings.count { it.deal_rating == "good" }
        val activeListings = listings.size
        val medianPrice = areas.mapNotNull { it.sale_median_ppm2 }.takeIf { it.isNotEmpty() }?.average()?.toInt()

        KpiCard(label = "Active Listings", value = activeListings.toString())
        KpiCard(label = "Good Deals", value = goodDeals.toString(), accentColor = MaterialTheme.colorScheme.secondary)
        if (medianPrice != null) {
            KpiCard(label = "Median Price/m²", value = "€$medianPrice", accentColor = MaterialTheme.colorScheme.tertiary)
        }

        if (loading) {
            CircularProgressIndicator(modifier = Modifier.padding(top = Dimensions.progressPaddingTop))
        }
    }
}

@Composable
fun KpiCard(label: String, value: String, accentColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.primary) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = Dimensions.spacingMd),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(modifier = Modifier.padding(Dimensions.cardPadding)) {
            Text(
                label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                value,
                style = MaterialTheme.typography.headlineLarge,
                color = accentColor,
                modifier = Modifier.padding(top = Dimensions.spacingSm)
            )
        }
    }
}
