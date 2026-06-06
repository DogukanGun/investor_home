# InvestorHome Android App - Setup & Testing Guide

## Prerequisites

- Android Studio 2024.1+ (download from [developer.android.com](https://developer.android.com/studio))
- JDK 17+ (comes with Android Studio)
- Android SDK (API 28+)
- An Android emulator or physical device connected via USB

## Quick Start

### 1. Open the Project in Android Studio

```bash
cd /Users/dogukangundogan/Desktop/Dev/investor_home
# Open the 'android' folder as an Android Studio project
open -a "Android Studio" android/
```

### 2. Sync Gradle

In Android Studio:
- Wait for Gradle sync to complete (may take 2-3 minutes on first run)
- If prompted, download missing SDK components
- Accept any Android SDK license agreements

### 3. Start the Backend

In a separate terminal:

```bash
cd /Users/dogukangundogan/Desktop/Dev/investor_home/backend
source venv/bin/activate  # or your Python venv
INVESTORHOME_CORS_ORIGINS='["*"]' uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Note:** The `INVESTORHOME_CORS_ORIGINS=["*"]` environment variable is critical for the mobile app to access the backend.

### 4. Configure the Emulator

In Android Studio, open **Device Manager** (left sidebar → Devices):
- Create or select an Android 9+ (API 28+) emulator
- Launch it

### 5. Run the App

In Android Studio:
1. Select your emulator/device from the device dropdown (top toolbar)
2. Click **Run** (green play button) or press `Ctrl+R`
3. App will build and deploy (3-5 minutes on first build)

---

## Network Configuration

The app connects to the backend via the following URLs:

| Device Type | Base URL | Notes |
|---|---|---|
| Android Emulator | `http://10.0.2.2:8000` | Special emulator loopback; configured in `RetrofitClient.kt` |
| Physical Device | `http://192.168.x.x:8000` | Replace `x.x` with your development machine's local IP |

**For Physical Device:**
1. Find your machine's local IP: `ifconfig \| grep inet` (look for `192.168.x.x`)
2. Update `RetrofitClient.kt` line 14 with your IP:
   ```kotlin
   private const val BASE_URL = "http://192.168.1.100:8000"  // Replace with your IP
   ```

---

## Testing the App

### Golden Path

1. **Launch the app** → lands on Login screen
2. **Enter any email and password** → tap "Sign In"
3. **You're logged in** → Dashboard appears with "Active Listings" and "Good Deals" KPI tiles
4. **Browse tab** → see filtered listings by deal rating (Good/Fair/Overpriced)
5. **Areas tab** → see market price indices
6. **Searches tab** → see saved search criteria
7. **Map tab** → placeholder for MapLibre integration (not yet implemented)

### What Each Screen Shows

| Screen | Data | Feature |
|---|---|---|
| **Dashboard** | Listings from backend | KPI cards + listing count |
| **Browse** | Filtered listings | Filter chips (Good/Fair/Overpriced), scrollable list |
| **Areas** | Market data | Area price indices, medians |
| **Searches** | Saved searches | CRUD + active toggle |
| **Map** | Placeholder | Ready for MapLibre integration |

### Debugging

If the app crashes or doesn't show data:

**Check Logcat:**
- Android Studio → View → Tool Windows → Logcat
- Search for "InvestorHome" or "ERROR" to see app logs
- Look for `401 Unauthorized` (missing CORS setup) or `Connection refused` (backend not running)

**Test Backend Connectivity from Emulator:**
```bash
# In a terminal on your machine
adb shell
# Inside emulator shell
curl http://10.0.2.2:8000/api/listings
```

If the curl succeeds, the connection is working.

**Common Issues:**

| Error | Cause | Fix |
|---|---|---|
| `Failed to resolve: ...` | Gradle not synced | Click "Sync Now" in Android Studio |
| Connection refused | Backend not running | Start backend with `uvicorn` (see step 3) |
| `401 Unauthorized` or CORS error | Missing `.env` in backend | Add `INVESTORHOME_CORS_ORIGINS=["*"]` to backend/.env |
| Emulator freezes | Insufficient RAM allocated | Open Device Manager → edit emulator → increase RAM to 2GB+ |

---

## Project Structure

```
android/
├── settings.gradle.kts              # Gradle config
├── build.gradle.kts                 # Project-level build config
│
└── app/
    ├── build.gradle.kts             # App dependencies (Compose, Retrofit, Datastore, etc.)
    ├── src/main/
    │   ├── AndroidManifest.xml      # App metadata + permissions
    │   ├── kotlin/de/investorhome/
    │   │   ├── MainActivity.kt       # Entry point
    │   │   ├── data/
    │   │   │   ├── api/
    │   │   │   │   ├── RetrofitClient.kt
    │   │   │   │   ├── Models.kt
    │   │   │   │   └── Services.kt
    │   │   │   └── session/
    │   │   │       └── SessionManager.kt
    │   │   └── ui/
    │   │       ├── theme/
    │   │       │   ├── Theme.kt (dark Material 3 colors)
    │   │       │   └── Typography.kt
    │   │       ├── navigation/
    │   │       │   └── AppNavigation.kt (NavHost)
    │   │       ├── components/
    │   │       │   └── Components.kt (ScreenHeader)
    │   │       └── screens/
    │   │           ├── auth/
    │   │           │   ├── LoginScreen.kt
    │   │           │   └── RegisterScreen.kt
    │   │           └── main/
    │   │               ├── MainScreen.kt (bottom nav)
    │   │               ├── DashboardScreen.kt
    │   │               ├── BrowseScreen.kt
    │   │               ├── MapScreen.kt
    │   │               ├── AreasScreen.kt
    │   │               └── SearchesScreen.kt
    │   └── res/
    │       └── values/
    │           └── strings.xml
```

---

## Next Steps (Optional Enhancements)

1. **Map Integration**: Replace MapScreen placeholder with MapLibre for interactive property map
2. **Charts**: Add MPAndroidChart for price index visualization in AreasScreen
3. **Deep Linking**: Add support for opening listings from notifications or external links
4. **Offline Support**: Cache listings with Room database for offline browsing

---

## Build Variants

To build for release:

```bash
# In Android Studio Terminal:
./gradlew assembleRelease
```

APK will be in `app/build/outputs/apk/release/`

---

## Support

- **Android Studio Help**: Help → Android Studio Help
- **Compose Docs**: https://developer.android.com/jetpack/compose
- **Retrofit Docs**: https://square.github.io/retrofit/
