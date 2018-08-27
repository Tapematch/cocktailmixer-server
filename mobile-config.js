App.info({
    id: 'app.cocktailmixer.taubsi',
    name: 'CocktailMixer',
    description: 'Mix Cocktails automatically and create your own.',
    author: 'Phil Taubert',
    email: 'philtaubert95@gmail.com',
    website: 'https://cocktailmixer.app',
    version: "0.2.0"
});

App.icons({
    'android_mdpi': 'res/icons/android/drawable-mdpi-icon.png',
    'android_hdpi': 'res/icons/android/drawable-hdpi-icon.png',
    'android_xhdpi': 'res/icons/android/drawable-xhdpi-icon.png',
    'android_xxhdpi': 'res/icons/android/drawable-xxhdpi-icon.png',
    'android_xxxhdpi': 'res/icons/android/drawable-xxxhdpi-icon.png',
});

App.launchScreens({
    'android_mdpi_portrait': 'res/screens/android/drawable-port-mdpi-screen.png',
    'android_mdpi_landscape': 'res/screens/android/drawable-land-mdpi-screen.png',
    'android_hdpi_portrait': 'res/screens/android/drawable-port-hdpi-screen.png',
    'android_hdpi_landscape': 'res/screens/android/drawable-land-hdpi-screen.png',
    'android_xhdpi_portrait': 'res/screens/android/drawable-port-xhdpi-screen.png',
    'android_xhdpi_landscape': 'res/screens/android/drawable-land-xhdpi-screen.png',
    'android_xxhdpi_portrait': 'res/screens/android/drawable-port-xxhdpi-screen.png',
    'android_xxhdpi_landscape': 'res/screens/android/drawable-land-xxhdpi-screen.png',
    'android_xxxhdpi_portrait': 'res/screens/android/drawable-port-xxxhdpi-screen.png',
    'android_xxxhdpi_landscape': 'res/screens/android/drawable-land-xxxhdpi-screen.png',
});

App.configurePlugin('phonegap-plugin-push', {
    SENDER_ID: 826570568798
});

App.configurePlugin('cordova-plugin-customurlscheme', {
    URL_SCHEME: 'cocktailmixer'
});

App.appendToConfig(
    '<universal-links>\n' +
    '    <host name="cocktailmixer.app" scheme="https" />\n' +
    '</universal-links>'
);

App.setPreference('StatusBarBackgroundColor', '#1866a0');
App.setPreference('StatusBarStyle', 'lightcontent');
App.setPreference('AndroidLaunchMode', 'singleInstance');

App.accessRule('https://cocktailmixer.app/*');
App.accessRule('https://fonts.googleapis.com/*');
App.accessRule('https://*.imgur.com/*');
App.accessRule('whatsapp:*', { type: 'intent' });
App.accessRule('https://telegram.me/share/*', { type: 'intent' });