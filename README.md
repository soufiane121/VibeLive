This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start

# get ip address like 192.... 
ifconfig
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
# VibeLive

## Firebase Notifications Setup

To enable push notifications in VibeLive, follow these steps:

1. **Firebase Project Setup**
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Create a new project or use your existing one.
   - Add your iOS app to the Firebase project and download the `GoogleService-Info.plist` file.
   - Place `GoogleService-Info.plist` in your Xcode project's root (usually under `ios/`).

2. **Install Dependencies**
   - In your project root, run:
     ```sh
     npm install @react-native-firebase/app @react-native-firebase/messaging
     cd ios && pod install && cd ..
     ```

3. **iOS Permissions & Configuration**
   - Open your Xcode project.
   - Enable Push Notifications and Background Modes (Remote notifications) in your app's capabilities.
   - Make sure your `AppDelegate.m` is configured for Firebase Messaging.
   - Add the following to your `Info.plist`:
     ```xml
     <key>FirebaseAppDelegateProxyEnabled</key>
     <false/>
     <key>UIBackgroundModes</key>
     <array>
       <string>fetch</string>
       <string>remote-notification</string>
     </array>
     ```
   - Request notification permissions in your app code (see below).

4. **Request Permission in App Code**
   - Only iOS permission handling is implemented and tested.
   - Example (in your main App component):
     ```js
     import messaging from '@react-native-firebase/messaging';
     import { Platform } from 'react-native';

     useEffect(() => {
       if (Platform.OS === 'ios') {
         messaging().requestPermission().then(authStatus => {
           // Handle permission status
         });
       }
     }, []);
     ```

5. **Testing**
   - Only iOS notification permissions and delivery have been actively developed and tested.
   - Android support is not guaranteed at this time.

---

**Note:**  
- Make sure your Apple Developer account and APNs certificates are set up for push notifications.
- For more details, see the [React Native Firebase Messaging docs](https://rnfirebase.io/messaging/usage).


- to add postinstall inside script package json add this line
-   // "postinstall": "node scripts/restore-local-libs.js"
- and install react-native-ffmpeg