package de.investorhome.ui.screens.main

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.draw.scale
import androidx.compose.ui.text.input.KeyboardType
import de.investorhome.data.api.RetrofitClient
import de.investorhome.data.api.SavedSearch
import de.investorhome.data.api.SavedSearchInput
import de.investorhome.ui.components.ScreenHeader
import de.investorhome.ui.theme.Dimensions
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun SearchesScreen() {
    val scope = rememberCoroutineScope()
    var searches by remember { mutableStateOf<List<SavedSearch>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var showCreateDialog by remember { mutableStateOf(false) }
    var toastMessage by remember { mutableStateOf<String?>(null) }

    fun refreshSearches() {
        scope.launch {
            try {
                searches = RetrofitClient.searchesService.getSearches()
            } catch (e: Exception) {
                toastMessage = "Failed to load searches"
            }
        }
    }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                searches = RetrofitClient.searchesService.getSearches()
                loading = false
            } catch (e: Exception) {
                loading = false
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Dimensions.screenPadding),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                ScreenHeader(eyebrow = "TOOLS", title = "Saved Searches", subtitle = "Manage search criteria")
            }
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                modifier = Modifier.align(androidx.compose.ui.Alignment.Bottom)
            ) {
                Icon(Icons.Filled.Add, "Create search")
            }
        }

        if (loading) {
            CircularProgressIndicator(modifier = Modifier.padding(top = Dimensions.progressPaddingTop))
        } else if (searches.isEmpty()) {
            Text(
                "No searches saved yet",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(Dimensions.screenPadding)
            )
        } else {
            LazyColumn(
                modifier = Modifier.padding(horizontal = Dimensions.screenPadding),
                verticalArrangement = Arrangement.spacedBy(Dimensions.spacingMd)
            ) {
                items(searches) { search ->
                    SearchItem(
                        search,
                        onDelete = {
                            scope.launch {
                                try {
                                    RetrofitClient.searchesService.deleteSearch(search.id)
                                    refreshSearches()
                                    toastMessage = "Search deleted"
                                } catch (e: Exception) {
                                    toastMessage = "Failed to delete"
                                }
                            }
                        },
                        onToggle = {
                            scope.launch {
                                try {
                                    RetrofitClient.searchesService.updateSearch(
                                        search.id,
                                        SavedSearchInput(
                                            name = search.name,
                                            city = search.city,
                                            postal_code = search.postal_code,
                                            country = search.country,
                                            listing_kind = search.listing_kind,
                                            property_type = search.property_type,
                                            price_min = search.price_min,
                                            price_max = search.price_max,
                                            size_min = search.size_min,
                                            size_max = search.size_max,
                                            rooms_min = search.rooms_min,
                                            rooms_max = search.rooms_max,
                                            active = !search.active
                                        )
                                    )
                                    refreshSearches()
                                } catch (e: Exception) {
                                    toastMessage = "Failed to update"
                                }
                            }
                        },
                        onScrape = {
                            scope.launch {
                                try {
                                    val result = RetrofitClient.searchesService.scrapeSearch(search.id)
                                    toastMessage = "Scraped: ${result.kept} kept"
                                } catch (e: Exception) {
                                    toastMessage = "Scrape failed"
                                }
                            }
                        }
                    )
                }
            }
        }
    }

    if (showCreateDialog) {
        CreateSearchDialog(
            onDismiss = { showCreateDialog = false },
            onCreate = { input ->
                scope.launch {
                    try {
                        RetrofitClient.searchesService.createSearch(input)
                        refreshSearches()
                        toastMessage = "Search created"
                        showCreateDialog = false
                    } catch (e: Exception) {
                        toastMessage = "Failed to create"
                    }
                }
            }
        )
    }

    if (toastMessage != null) {
        LaunchedEffect(toastMessage) {
            delay(2000)
            toastMessage = null
        }
    }
}

@Composable
fun SearchItem(
    search: SavedSearch,
    onDelete: () -> Unit = {},
    onToggle: () -> Unit = {},
    onScrape: () -> Unit = {}
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(modifier = Modifier.padding(Dimensions.cardPadding)) {
            // Header with title and actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        search.name,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        "${search.city} • ${search.country.uppercase()}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = onScrape, modifier = Modifier.size(40.dp)) {
                        Icon(Icons.Filled.PlayArrow, "Scrape", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(40.dp)) {
                        Icon(Icons.Filled.Delete, "Delete", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(20.dp))
                    }
                }
            }

            // Criteria row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = Dimensions.spacingMd),
                horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
            ) {
                if (search.property_type.isNotEmpty()) {
                    FilterTag(search.property_type)
                }
                if (search.listing_kind.isNotEmpty()) {
                    FilterTag(search.listing_kind)
                }
                if (search.price_max != null) {
                    FilterTag("€${search.price_max.toInt()}")
                }
            }

            // Toggle row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = Dimensions.spacingMd),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                ) {
                    Switch(
                        checked = search.active,
                        onCheckedChange = { onToggle() },
                        modifier = Modifier.scale(0.8f)
                    )
                    Text(
                        if (search.active) "Active" else "Inactive",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(start = 4.dp)
                    )
                }
                Text(
                    search.created_at.take(10),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun FilterTag(label: String) {
    Surface(
        color = MaterialTheme.colorScheme.secondaryContainer,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSecondaryContainer,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
fun CreateSearchDialog(onDismiss: () -> Unit, onCreate: (SavedSearchInput) -> Unit) {
    var name by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var postalCode by remember { mutableStateOf("") }
    var country by remember { mutableStateOf("de") }
    var listingKind by remember { mutableStateOf("sale") }
    var propertyType by remember { mutableStateOf("apartment") }
    var priceMin by remember { mutableStateOf("") }
    var priceMax by remember { mutableStateOf("") }
    var sizeMin by remember { mutableStateOf("") }
    var sizeMax by remember { mutableStateOf("") }
    var roomsMin by remember { mutableStateOf("") }
    var roomsMax by remember { mutableStateOf("") }

    var countryExpanded by remember { mutableStateOf(false) }
    var listingExpanded by remember { mutableStateOf(false) }
    var propertyExpanded by remember { mutableStateOf(false) }

    val countries = listOf("de", "at", "ch", "nl", "be", "fr")
    val listingTypes = listOf("sale", "rent")
    val propertyTypes = listOf("apartment", "house", "land", "other")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Search", style = MaterialTheme.typography.titleMedium) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Basic info
                OutlinedTextField(name, { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(city, { city = it }, label = { Text("City") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(postalCode, { postalCode = it }, label = { Text("Postal Code (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)

                // Filters with dropdowns
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)) {
                    Box(modifier = Modifier.weight(0.5f)) {
                        OutlinedButton(
                            onClick = { countryExpanded = true },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(country.uppercase())
                            Icon(Icons.Filled.ExpandMore, null, modifier = Modifier.size(18.dp))
                        }
                        DropdownMenu(expanded = countryExpanded, onDismissRequest = { countryExpanded = false }) {
                            countries.forEach { c ->
                                DropdownMenuItem(
                                    text = { Text(c.uppercase()) },
                                    onClick = { country = c; countryExpanded = false }
                                )
                            }
                        }
                    }
                    Box(modifier = Modifier.weight(0.5f)) {
                        OutlinedButton(
                            onClick = { listingExpanded = true },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(listingKind.capitalize())
                            Icon(Icons.Filled.ExpandMore, null, modifier = Modifier.size(18.dp))
                        }
                        DropdownMenu(expanded = listingExpanded, onDismissRequest = { listingExpanded = false }) {
                            listingTypes.forEach { type ->
                                DropdownMenuItem(
                                    text = { Text(type.capitalize()) },
                                    onClick = { listingKind = type; listingExpanded = false }
                                )
                            }
                        }
                    }
                }

                Box {
                    OutlinedButton(
                        onClick = { propertyExpanded = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(propertyType.capitalize())
                        Icon(Icons.Filled.ExpandMore, null, modifier = Modifier.size(18.dp))
                    }
                    DropdownMenu(expanded = propertyExpanded, onDismissRequest = { propertyExpanded = false }) {
                        propertyTypes.forEach { type ->
                            DropdownMenuItem(
                                text = { Text(type.capitalize()) },
                                onClick = { propertyType = type; propertyExpanded = false }
                            )
                        }
                    }
                }

                // Price range
                Text("Price Range", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)) {
                    OutlinedTextField(
                        priceMin, { priceMin = it },
                        label = { Text("Min €") },
                        modifier = Modifier.weight(0.5f),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                    OutlinedTextField(
                        priceMax, { priceMax = it },
                        label = { Text("Max €") },
                        modifier = Modifier.weight(0.5f),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                }

                // Size range
                Text("Size (m²)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)) {
                    OutlinedTextField(
                        sizeMin, { sizeMin = it },
                        label = { Text("Min") },
                        modifier = Modifier.weight(0.5f),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                    OutlinedTextField(
                        sizeMax, { sizeMax = it },
                        label = { Text("Max") },
                        modifier = Modifier.weight(0.5f),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                }

                // Rooms range
                Text("Rooms", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)) {
                    OutlinedTextField(
                        roomsMin, { roomsMin = it },
                        label = { Text("Min") },
                        modifier = Modifier.weight(0.5f),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                    OutlinedTextField(
                        roomsMax, { roomsMax = it },
                        label = { Text("Max") },
                        modifier = Modifier.weight(0.5f),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotEmpty() && city.isNotEmpty()) {
                        onCreate(
                            SavedSearchInput(
                                name = name,
                                city = city,
                                postal_code = postalCode.takeIf { it.isNotEmpty() },
                                country = country,
                                listing_kind = listingKind,
                                property_type = propertyType,
                                price_min = priceMin.toDoubleOrNull(),
                                price_max = priceMax.toDoubleOrNull(),
                                size_min = sizeMin.toDoubleOrNull(),
                                size_max = sizeMax.toDoubleOrNull(),
                                rooms_min = roomsMin.toDoubleOrNull(),
                                rooms_max = roomsMax.toDoubleOrNull(),
                                active = true
                            )
                        )
                    }
                }
            ) {
                Text("Create")
            }
        },
        dismissButton = {
            Button(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
