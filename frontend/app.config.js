/** @type {import('@expo/config').ExpoConfig} */
const appJson = require("./app.json");

module.exports = {
  ...appJson.expo,
  plugins: [...appJson.expo.plugins, "./plugins/withEnglishLocale"],
  ios: {
    ...appJson.expo.ios,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY,
    },
  },
  android: {
    ...appJson.expo.android,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY,
      },
    },
  },
};
