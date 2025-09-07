# Devansh Veggie – Prepackaged for Android Studio (Capacitor 7)

This package includes your **full UI** and scripts to generate the `/android` native project locally.

## 1) Run once to generate the Android Studio project
```bash
npm install
npm run android:prebuild    # builds web + generates /android + sync
npm run android:open        # opens Android Studio directly
```
> After `android:prebuild`, the folder `android/` will exist. **Open that folder in Android Studio** if you prefer: `android/`.

## 2) Build debug APK in Android Studio
- Android Studio → **Build → Build APK(s)** → path shown in a toast (usually `android/app/build/outputs/apk/debug/app-debug.apk`).
- Or click **Run ▶** to install on a device/emulator.

## 3) What to push to GitHub
Push the **project root** (this entire folder). The GitHub Actions workflow will build a **debug APK** artifact.
  - File: `.github/workflows/apk.yml`
  - Artifact: `app-debug.apk`

## 4) Rebuilding after code changes
```bash
npm run build
npm run android:copy        # copies fresh dist/ into the native app
# or:
npm run android:sync        # copies + updates plugins
```

## Requirements
- Node LTS
- Java 17 (Temurin 17). Android Studio can manage this.
- Android SDK/Build-Tools (via Android Studio).
