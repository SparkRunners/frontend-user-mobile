This repository hosts the SparkRunner user app built with React Native CLI. It is the local entry point for testing the mobile UI while connecting to the orchestrator repo (auth-server-service + scooter mock via Docker Compose).

# Requirements

- Node.js >= 20 (nvm recommended for version switching).
- npm (or Yarn) and Watchman (optional on macOS).
- Xcode 15+ with iOS simulators plus CocoaPods.
- Android Studio / Android SDK if you plan to test on Android.
- Access to both backend repos so you can copy `.env` values and spin up the mock APIs.

# Initial Setup

1. Copy the env template and fill in real secrets from the two backend repos:
	```bash
	cp .env.example .env
	```
2. Install JavaScript dependencies:
	```bash
	npm install
	```
3. Install CocoaPods (first run or whenever native deps change):
	```bash
	cd ios
	# Ensure the Ruby gems defined in ios/Gemfile are installed
	bundle install        # run `gem install bundler` first if the command is missing
	# Use the bundled CocoaPods version so everyone links the same native deps
	bundle exec pod install --repo-update
	cd ..
	```
4. (Optional) Start the mock services:
	- Scooter mock: `npm install && npm start` (default `http://localhost:3000/api/v1`).
	- auth-server-service: `npm install && npm run dev` (default `http://localhost:3000`; change `PORT` if it clashes with the mock).

# Running the App

## Working with the docker-compose stack

When you use the orchestrator repository to start the backend/web microservices, keep the mobile client outside Docker and run it on your host machine:

1. In the orchestrator repo root, run `docker-compose up -d` (or the project-specific alias) to boot `server-auth`, `server-user`, and the web frontends. Wait until all containers report healthy.
2. Confirm your `.env` in this repo points to the host ports exposed by those containers (for example `AUTH_API_URL=http://localhost:3001`). Edit the values before launching Metro if needed.
3. Back in this repo, follow the sections below (`npm start`, `npm run ios`, etc.). Metro/Expo will talk to the services through the published localhost ports.

> Why not add the mobile app to docker-compose? React Native requires local emulators, the Android/iOS toolchains, Watchman, and device bridge ports (8081/19000+) that are hard to bundle reliably inside a container. Hosting Metro directly on your machine keeps the workflow simple and satisfies “one command” requirements when paired with the orchestrator stack.

## Metro bundler

```bash
npm start
```

Metro listens on port `8081`. If it is taken, run `npm start -- --port=<port>`.

## iOS (preferred path)

```bash
npm run ios -- --simulator="iPhone 15 Pro"
```

- If `xcodebuild` exits with 65/70, open `ios/FrontendUserMobile.xcworkspace` in Xcode, pick a valid simulator (for example iOS 17.4), perform a build once, then retry.
- Missing `.xcconfig`/`.xcfilelist` errors mean Pods were not installed - repeat the CocoaPods step above.

## Android

```bash
npm run android
```

- Ensure an emulator is running or a device is attached.
- Run Gradle sync/install the required SDK platforms inside Android Studio before the first build.

# Debugging & Tips

- Dev Menu: iOS `Cmd + D` (or Device > Shake), Android `Cmd/Ctrl + M` or shake the device.
- Fast Refresh happens on every file save; use `Cmd + R` (iOS) or double-tap `R` (Android) for a full reload.
- Logs: `npx react-native log-ios` / `npx react-native log-android`.
- Health check: `npx react-native doctor` highlights missing dependencies.
- Metro already running on 8081? Kill the old process via `lsof -i :8081`.
- Config warnings such as `[config] Environment variable ... is missing` mean the corresponding key is missing in `.env`.
- Installing new native dependencies or seeing native module errors usually means the iOS/Android build cache needs a cleanup. Use this checklist:
	1. Stop Metro and close the running app in the simulator/device.
	2. iOS cleanup & rebuild (from repo root): `cd ios && bundle install && bundle exec pod install --repo-update && xcodebuild clean && cd ..`, then `npx react-native run-ios`. If `xcodebuild clean` refuses to delete `ios/build`, remove the folder manually (`rm -rf ios/build`) and rerun the command.
	3. Android cleanup & rebuild: `cd android && ./gradlew clean && cd ..`, then `npx react-native run-android`.
	4. Metro cache reset (optional): `npx react-native start --reset-cache`.

### Thorough debug clean

Run these when a debug build behaves inconsistently even after the checklist above:

1. `npx react-native clean` from the repo root (wipes cached Gradle/Xcode artifacts maintained by the CLI).
2. `cd android && ./gradlew clean && cd ..` to guarantee the debug variant rebuilds all Java/Kotlin outputs.
3. `cd ios && xcodebuild -workspace FrontendUserMobile.xcworkspace -scheme FrontendUserMobile -configuration Debug clean && cd ..` so the Xcode-derived data for the debug configuration is regenerated on the next run.
4. Reinstall Pods if native deps recently changed (`cd ios && bundle install && bundle exec pod install && cd ..`).
5. Relaunch Metro with a cache reset: `npx react-native start --reset-cache`.

Afterwards rerun `npx react-native run-android --variant=debug` or `npx react-native run-ios --configuration Debug` to rebuild from the freshly cleaned state.

# Next Steps

- Implement OAuth, rentals, and other business flows under `src/features`.
- Use the `develop` branch for day-to-day work and open PRs back to `main` once a slice is ready.
- Keep UI consistent by reusing the tokens in `src/theme` (see `docs/design-tokens.md`) before adding new components.

For additional React Native details, see https://reactnative.dev/docs
