package de.investorhome.ui.screens.main

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.ui.unit.dp
import de.investorhome.data.api.RetrofitClient
import de.investorhome.data.api.Listing
import de.investorhome.ui.components.ScreenHeader
import de.investorhome.ui.theme.Dimensions
import kotlinx.coroutines.launch

@Composable
fun BrowseScreen() {
    val scope = rememberCoroutineScope()
    var listings by remember { mutableStateOf<List<Listing>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var selectedRating by remember { mutableStateOf<String?>(null) }
    var city by remember { mutableStateOf("") }
    var sort by remember { mutableStateOf("undervaluation") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var selectedListingUrl by remember { mutableStateOf<String?>(null) }

    fun loadListings() {
        scope.launch {
            try {
                loading = true
                errorMessage = null
                listings = RetrofitClient.listingsService.getListings(
                    listingKind = "sale",
                    city = city.takeIf { it.isNotEmpty() },
                    rating = selectedRating,
                    sort = sort,
                    limit = 200
                )
                loading = false
            } catch (e: Exception) {
                errorMessage = "Error: ${e.message}"
                loading = false
            }
        }
    }

    LaunchedEffect(selectedRating, city, sort) {
        loadListings()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Dimensions.screenPadding)
                .verticalScroll(rememberScrollState())
        ) {
            ScreenHeader(eyebrow = "MARKET", title = "Listings", subtitle = "${listings.size} properties")

            // Rating filters
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = Dimensions.spacingMd),
                horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
            ) {
                listOf("All" to null, "Good" to "good", "Fair" to "fair", "Overpriced" to "overpriced").forEach { (label, value) ->
                    FilterChip(
                        selected = selectedRating == value,
                        onClick = { selectedRating = value },
                        label = { Text(label, style = MaterialTheme.typography.labelSmall) },
                        modifier = Modifier.height(Dimensions.chipHeight)
                    )
                }
            }

            // Filters row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = Dimensions.spacingMd),
                horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
            ) {
                // City search
                OutlinedTextField(
                    value = city,
                    onValueChange = { city = it },
                    label = { Text("City") },
                    modifier = Modifier
                        .weight(1f)
                        .height(Dimensions.inputHeight),
                    textStyle = MaterialTheme.typography.bodySmall,
                    singleLine = true
                )

                // Sort dropdown
                var expandedSort by remember { mutableStateOf(false) }
                Box(modifier = Modifier.weight(1f)) {
                    OutlinedButton(
                        onClick = { expandedSort = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(Dimensions.inputHeight),
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(
                            when (sort) {
                                "undervaluation" -> "Deal"
                                "price_per_m2" -> "€/m²"
                                "price" -> "Price"
                                "yield" -> "Yield"
                                else -> sort
                            },
                            style = MaterialTheme.typography.bodySmall
                        )
                        Icon(
                            Icons.Default.ExpandMore,
                            contentDescription = null,
                            modifier = Modifier
                                .size(Dimensions.iconSizeSm)
                                .padding(start = Dimensions.spacingXs)
                        )
                    }
                    DropdownMenu(
                        expanded = expandedSort,
                        onDismissRequest = { expandedSort = false },
                        modifier = Modifier.width(Dimensions.dropdownWidth)
                    ) {
                        listOf(
                            "undervaluation" to "Best Deal",
                            "price_per_m2" to "Price/m²",
                            "price" to "Price",
                            "yield" to "Yield"
                        ).forEach { (value, label) ->
                            DropdownMenuItem(
                                text = { Text(label, style = MaterialTheme.typography.bodySmall) },
                                onClick = { sort = value; expandedSort = false }
                            )
                        }
                    }
                }
            }

            if (errorMessage != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                ) {
                    Text(
                        errorMessage!!,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(Dimensions.spacingSm)
                    )
                }
            }
        }

        // Listings
        if (loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (listings.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
                Text("No listings found", style = MaterialTheme.typography.bodyMedium)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .padding(horizontal = Dimensions.screenPadding)
                    .padding(bottom = Dimensions.screenPadding),
                verticalArrangement = Arrangement.spacedBy(Dimensions.spacingMd)
            ) {
                items(listings) { listing ->
                    ListingItem(listing) { selectedListingUrl = listing.url }
                }
            }
        }
    }

    if (selectedListingUrl != null) {
        WebViewModal(url = selectedListingUrl!!, onDismiss = { selectedListingUrl = null })
    }
}

@Composable
fun ListingItem(listing: Listing, onClick: () -> Unit = {}) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(modifier = Modifier.padding(Dimensions.cardPadding)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    "${listing.city}${listing.postal_code?.let { " • $it" } ?: ""}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                DealBadge(listing.deal_rating)
            }
            Text(
                "€${String.format("%,d", listing.price.toInt())}",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(vertical = Dimensions.dealBadgePaddingV)
            )
            Text(
                "${listing.living_area_m2?.toInt()}m² • €${listing.price_per_m2.toInt()}/m²${listing.undervaluation?.let { " • ${String.format("%+.0f%%", it * 100)}" } ?: ""}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun WebViewModal(url: String, onDismiss: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(Dimensions.cardPaddingSmall),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                Text("Property Details", style = MaterialTheme.typography.titleMedium)
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Filled.Close, contentDescription = "Close")
                }
            }
            AndroidView(
                factory = { context ->
                    WebView(context).apply {
                        webViewClient = WebViewClient()
                        settings.apply {
                            domStorageEnabled = true
                            databaseEnabled = true
                            javaScriptEnabled = true
                        }
                        loadUrl(url)
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}

@Composable
fun DealBadge(rating: String) {
    val (color, text) = when (rating) {
        "good" -> MaterialTheme.colorScheme.primary to "Good"
        "fair" -> MaterialTheme.colorScheme.tertiary to "Fair"
        "overpriced" -> MaterialTheme.colorScheme.error to "Over"
        else -> MaterialTheme.colorScheme.surfaceVariant to "?"
    }
    Surface(
        color = color,
        shape = MaterialTheme.shapes.small,
        modifier = Modifier.padding(0.dp)
    ) {
        Text(
            text,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.padding(horizontal = Dimensions.dealBadgePaddingH, vertical = Dimensions.dealBadgePaddingV)
        )
    }
}
