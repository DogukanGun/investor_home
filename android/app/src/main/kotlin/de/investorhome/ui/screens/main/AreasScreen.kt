package de.investorhome.ui.screens.main

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.foundation.Canvas
import androidx.compose.ui.unit.dp
import de.investorhome.data.api.RetrofitClient
import de.investorhome.data.api.AreaSummary
import de.investorhome.data.api.IndexPoint
import de.investorhome.ui.components.ScreenHeader
import de.investorhome.ui.theme.Dimensions
import kotlinx.coroutines.launch

@Composable
fun AreasScreen() {
    val scope = rememberCoroutineScope()
    var areas by remember { mutableStateOf<List<AreaSummary>>(emptyList()) }
    var selectedArea by remember { mutableStateOf<String?>(null) }
    var indexData by remember { mutableStateOf<List<IndexPoint>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                areas = RetrofitClient.areasService.getAreas()
                if (areas.isNotEmpty()) {
                    selectedArea = areas[0].area_key
                    indexData = RetrofitClient.areasService.getAreaIndex(areas[0].area_key, "sale")
                }
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
        Column(modifier = Modifier.padding(Dimensions.screenPadding)) {
            ScreenHeader(eyebrow = "MARKET DATA", title = "Price Indices", subtitle = "Area medians and trends")
        }

        if (loading) {
            CircularProgressIndicator(modifier = Modifier.padding(top = Dimensions.progressPaddingTop))
        } else {
            LazyColumn(
                modifier = Modifier.padding(horizontal = Dimensions.screenPadding),
                verticalArrangement = Arrangement.spacedBy(Dimensions.spacingMd)
            ) {
                items(areas.take(10)) { area ->
                    val isSelected = selectedArea == area.area_key
                    AreaItem(
                        area = area,
                        isSelected = isSelected,
                        onClick = {
                            selectedArea = area.area_key
                            scope.launch {
                                try {
                                    indexData = RetrofitClient.areasService.getAreaIndex(area.area_key, "sale")
                                } catch (e: Exception) {
                                    indexData = emptyList()
                                }
                            }
                        }
                    )
                    if (isSelected && indexData.isNotEmpty()) {
                        AreaIndexPreview(indexData)
                    }
                }
            }
        }
    }
}

@Composable
fun AreaItem(area: AreaSummary, isSelected: Boolean = false, onClick: () -> Unit = {}) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(modifier = Modifier.padding(Dimensions.cardPadding)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                Text(
                    area.area_key,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Surface(
                    color = MaterialTheme.colorScheme.primary,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        "€${area.sale_median_ppm2.toInt()}/m²",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimary,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            Text(
                "Rent: €${String.format("%.0f", area.rent_median_ppm2)}/m²",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.secondary
            )
        }
    }
}

@Composable
fun AreaIndexPreview(indexData: List<IndexPoint>) {
    if (indexData.isEmpty()) return
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = MaterialTheme.shapes.medium
    ) {
        Column(modifier = Modifier.padding(Dimensions.cardPadding)) {
            Text(
                "Price History",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            val prices = indexData.mapNotNull { it.median_price_per_m2 }.takeIf { it.isNotEmpty() }
            if (prices != null && prices.size > 1) {
                val minPrice = prices.minOrNull() ?: 0.0
                val maxPrice = prices.maxOrNull() ?: 1.0
                val priceRange = maxPrice - minPrice
                val lineColor = MaterialTheme.colorScheme.primary

                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(60.dp)
                        .padding(vertical = 8.dp)
                ) {
                    val width = size.width
                    val height = size.height
                    val pointSpacing = width / (prices.size - 1)

                    for (i in 0 until prices.size - 1) {
                        val y1 = if (priceRange > 0) height - ((prices[i] - minPrice) / priceRange) * height else height / 2
                        val y2 = if (priceRange > 0) height - ((prices[i + 1] - minPrice) / priceRange) * height else height / 2
                        val x1 = i * pointSpacing
                        val x2 = (i + 1) * pointSpacing

                        drawLine(
                            color = lineColor,
                            start = androidx.compose.ui.geometry.Offset(x1.toFloat(), y1.toFloat()),
                            end = androidx.compose.ui.geometry.Offset(x2.toFloat(), y2.toFloat()),
                            strokeWidth = 2f,
                            cap = StrokeCap.Round
                        )
                    }

                    for (i in prices.indices) {
                        val y = if (priceRange > 0) height - ((prices[i] - minPrice) / priceRange) * height else height / 2
                        val x = i * pointSpacing
                        drawCircle(
                            color = lineColor,
                            radius = 3f,
                            center = androidx.compose.ui.geometry.Offset(x.toFloat(), y.toFloat())
                        )
                    }
                }

                val firstPoint = indexData.firstOrNull()
                val lastPoint = indexData.lastOrNull()
                if (firstPoint != null && lastPoint != null) {
                    val change = ((lastPoint.median_price_per_m2 ?: 0.0) - (firstPoint.median_price_per_m2 ?: 0.0))
                    val changePct = if (firstPoint.median_price_per_m2 != null && firstPoint.median_price_per_m2 != 0.0) {
                        (change / firstPoint.median_price_per_m2) * 100
                    } else 0.0
                    val changeColor = if (changePct >= 0) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.tertiary
                    Text(
                        "${String.format("%+.1f%%", changePct)} (€${String.format("%+d", change.toInt())})",
                        style = MaterialTheme.typography.bodyLarge,
                        color = changeColor,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        }
    }
}
