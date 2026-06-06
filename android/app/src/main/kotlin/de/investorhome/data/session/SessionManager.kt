package de.investorhome.data.session

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.firstOrNull

private val Context.dataStore by preferencesDataStore(name = "session")

class SessionManager(private val context: Context) {
    private val IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
    private val EMAIL = stringPreferencesKey("email")
    private val NAME = stringPreferencesKey("name")
    private val TOKEN = stringPreferencesKey("token")

    suspend fun isLoggedIn(): Boolean {
        return context.dataStore.data.firstOrNull()?.get(IS_LOGGED_IN) ?: false
    }

    suspend fun login(email: String, name: String = "", token: String = "") {
        context.dataStore.edit { preferences ->
            preferences[IS_LOGGED_IN] = true
            preferences[EMAIL] = email
            preferences[NAME] = name
            preferences[TOKEN] = token
        }
    }

    suspend fun logout() {
        context.dataStore.edit { preferences ->
            preferences[IS_LOGGED_IN] = false
            preferences.remove(EMAIL)
            preferences.remove(NAME)
            preferences.remove(TOKEN)
        }
    }

    suspend fun getToken(): String? {
        return context.dataStore.data.firstOrNull()?.get(TOKEN)
    }

    suspend fun getSession(): UserSession? {
        val prefs = context.dataStore.data.firstOrNull()
        val loggedIn = prefs?.get(IS_LOGGED_IN) ?: return null
        if (!loggedIn) return null

        return UserSession(
            email = prefs[EMAIL] ?: "",
            name = prefs[NAME] ?: "",
        )
    }
}

data class UserSession(
    val email: String,
    val name: String,
)
