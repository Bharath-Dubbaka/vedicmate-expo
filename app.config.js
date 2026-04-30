// app.config.js
module.exports = {
  expo: {
    name: "VedicFind",
    slug: "vedicmatedbk369",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    icon: "./assets/icon.png",
    scheme: "vedicmatedbk369",
    splash: {
      image: "./assets/icon.png",
      resizeMode: "contain",
      backgroundColor: "#0A0B14",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A0B14",
      },
      package: "com.vedicmate.app",
      userInterfaceStyle: "light",
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "com.vedicmate.app",
              host: "oauth2redirect",
              pathPrefix: "/google",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    plugins: [
      ["expo-router", { root: "./app" }],
      "expo-font",
      "@react-native-community/datetimepicker",
      "expo-web-browser",
      "@react-native-google-signin/google-signin", // ← no options needed for Android
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          project: "react-native",
          organization: "vedicfind",
        },
      ],
    ],
    extra: {
      router: { root: "./app" },
      eas: { projectId: "df1c5298-616f-44a5-a8c3-0a47288c195a" },
    },
    owner: "bratthegreat",
  },
};
