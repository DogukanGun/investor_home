package de.investorhome.data.api

import retrofit2.http.*

interface AuthService {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): TokenResponse

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): TokenResponse

    @POST("api/auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): MessageResponse
}

interface ListingsService {
    @GET("api/listings")
    suspend fun getListings(
        @Query("listing_kind") listingKind: String? = null,
        @Query("city") city: String? = null,
        @Query("rating") rating: String? = null,
        @Query("sort") sort: String = "undervaluation",
        @Query("limit") limit: Int = 100,
    ): List<Listing>
}

interface AreasService {
    @GET("api/areas")
    suspend fun getAreas(): List<AreaSummary>

    @GET("api/areas/trends")
    suspend fun getAreaTrends(): List<AreaTrend>

    @GET("api/areas/{areaKey}/index")
    suspend fun getAreaIndex(
        @Path("areaKey") areaKey: String,
        @Query("listing_kind") listingKind: String = "sale",
    ): List<IndexPoint>
}

interface SearchesService {
    @GET("api/searches")
    suspend fun getSearches(): List<SavedSearch>

    @POST("api/searches")
    suspend fun createSearch(@Body search: SavedSearchInput): SavedSearch

    @PATCH("api/searches/{id}")
    suspend fun updateSearch(
        @Path("id") id: Int,
        @Body search: SavedSearchInput,
    ): SavedSearch

    @DELETE("api/searches/{id}")
    suspend fun deleteSearch(@Path("id") id: Int)

    @POST("api/scrape/search/{id}")
    suspend fun scrapeSearch(@Path("id") id: Int): ScrapeResult

    @POST("api/searches/bulk-germany")
    suspend fun bulkGermany(@Body body: BulkGermanyRequest): BulkGermanyResult
}
