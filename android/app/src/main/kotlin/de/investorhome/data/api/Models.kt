package de.investorhome.data.api

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String
)

data class TokenResponse(
    val access_token: String,
    val token_type: String,
    val email: String,
    val name: String
)

data class AuthError(
    val detail: String
)

data class ForgotPasswordRequest(
    val email: String
)

data class MessageResponse(
    val message: String
)

data class Listing(
    val id: Int,
    val portal: String,
    val url: String,
    val title: String,
    val listing_kind: String,
    val property_type: String,
    val city: String,
    val postal_code: String?,
    val price: Double,
    val living_area_m2: Double?,
    val rooms: Double?,
    val price_per_m2: Double,
    val area_median_ppm2: Double?,
    val undervaluation: Double?,
    val deal_rating: String,
    val gross_yield: Double?,
    val last_seen_at: String,
    val currency: String,
    val country: String,
    val latitude: Double?,
    val longitude: Double?,
)

data class AreaSummary(
    val area_key: String,
    val sale_median_ppm2: Double,
    val rent_median_ppm2: Double,
    val sale_samples: Int,
    val rent_samples: Int,
)

data class SavedSearch(
    val id: Int,
    val created_at: String,
    val name: String,
    val city: String,
    val postal_code: String?,
    val country: String,
    val listing_kind: String,
    val property_type: String,
    val price_min: Double?,
    val price_max: Double?,
    val size_min: Double?,
    val size_max: Double?,
    val rooms_min: Double?,
    val rooms_max: Double?,
    val active: Boolean,
)

data class IndexPoint(
    val period: String,
    val median_price_per_m2: Double?,
    val index: Double?,
    val sample_count: Int,
)

data class AreaTrend(
    val area_key: String,
    val sale_current: Double?,
    val sale_previous: Double?,
    val sale_trend_pct: Double?,
    val rent_current: Double?,
    val rent_samples: Int,
    val p25_ppm2: Double?,
    val p75_ppm2: Double?,
)

data class ScrapeResult(
    val scraped: Int,
    val kept: Int,
    val per_portal: Map<String, Int>,
)

data class SavedSearchInput(
    val name: String,
    val city: String,
    val postal_code: String?,
    val country: String,
    val listing_kind: String,
    val property_type: String,
    val price_min: Double?,
    val price_max: Double?,
    val size_min: Double?,
    val size_max: Double?,
    val rooms_min: Double?,
    val rooms_max: Double?,
    val active: Boolean = true,
)

data class BulkGermanyRequest(
    val listing_kind: String,
    val property_type: String,
    val price_max: Double?,
)

data class BulkGermanyResult(
    val created: Int,
    val skipped: Int,
)
