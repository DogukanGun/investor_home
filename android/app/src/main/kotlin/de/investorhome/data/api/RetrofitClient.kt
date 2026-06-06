package de.investorhome.data.api

import com.google.gson.GsonBuilder
import de.investorhome.data.session.SessionManager
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClientManager {
    private var sessionManager: SessionManager? = null
    private var retrofit: Retrofit? = null

    fun initialize(sessionManager: SessionManager) {
        this.sessionManager = sessionManager
        buildRetrofit(sessionManager)
    }

    private fun buildRetrofit(sessionManager: SessionManager) {
        val authInterceptor = okhttp3.Interceptor { chain ->
            val originalRequest = chain.request()
            val token = runBlocking { sessionManager.getToken() }

            val newRequest = originalRequest.newBuilder()
                .addHeader("X-Mobile-Client", "investorhome-android")

            if (token != null) {
                newRequest.addHeader("Authorization", "Bearer $token")
            }

            chain.proceed(newRequest.build())
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()

        val gson = GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
            .create()

        retrofit = Retrofit.Builder()
            .baseUrl("http://10.0.2.2:8000/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    fun getRetrofit(): Retrofit =
        retrofit ?: throw IllegalStateException("RetrofitClientManager not initialized")

    val authService: AuthService
        get() = getRetrofit().create(AuthService::class.java)
    val listingsService: ListingsService
        get() = getRetrofit().create(ListingsService::class.java)
    val areasService: AreasService
        get() = getRetrofit().create(AreasService::class.java)
    val searchesService: SearchesService
        get() = getRetrofit().create(SearchesService::class.java)
}

// Alias for backward compatibility
typealias RetrofitClient = RetrofitClientManager
