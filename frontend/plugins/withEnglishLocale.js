const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode");

// Google Maps iOS SDK has no language option — it renders labels in the app's
// preferred language, so the app is pinned to English regardless of device locale.
function withEnglishLocale(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.CFBundleDevelopmentRegion = "en";
    cfg.modResults.CFBundleLocalizations = ["en"];
    return cfg;
  });

  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== "swift") return cfg;
    cfg.modResults.contents = mergeContents({
      tag: "whyp-english-locale",
      src: cfg.modResults.contents,
      newSrc: '    UserDefaults.standard.set(["en"], forKey: "AppleLanguages")',
      anchor: /let delegate = ReactNativeDelegate\(\)/,
      offset: 0,
      comment: "//",
    }).contents;
    return cfg;
  });
}

module.exports = withEnglishLocale;
