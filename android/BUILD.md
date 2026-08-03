# PriceHound Android release build

This is a minimal Android WebView wrapper for the published PriceHound PWA. It uses application ID `com.pricehound.app`, app name `PriceHound`, and loads the live site URL in `MainActivity`.

## Requirements
- JDK 17 (`java -version`)
- Android SDK command-line tools, with `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) set
- SDK packages: `platforms;android-35`, `build-tools;35.0.0`
- Gradle 8.7+ (or generate/use a Gradle wrapper with `gradle wrapper --gradle-version 8.7`)

## Build debug APK/AAB
```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
cd /path/to/android
# If gradle is installed:
gradle --no-daemon --max-workers=2 assembleDebug
# output: app/build/outputs/apk/debug/app-debug.apk
gradle --no-daemon --max-workers=2 bundleRelease
# output: app/build/outputs/bundle/release/app-release.aab
```

This environment did not have Java or an Android SDK, so no APK/AAB was built here. Install those prerequisites before running the commands above. For a release build, create a private upload keystore and never commit it:
```bash
keytool -genkeypair -v -keystore pricehound-upload.jks -alias pricehound -keyalg RSA -keysize 2048 -validity 10000
```
Configure Gradle signing using environment variables or `~/.gradle/gradle.properties` (not source control), then build the signed AAB. Google Play requires Play App Signing enrollment, an upload key, an Android App Bundle, and a unique package name. Test the signed bundle/APK on physical devices, verify HTTPS/network behavior, and upload only through the owner's Play Console account.

The wrapper intentionally has no card/payment access; Stripe checkout remains hosted in the browser. Update the URL in `MainActivity.java` only if the published origin changes.
