module.exports = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['accessibility'],
    formFactor: 'mobile',
    screenEmulation: { mobile: true },
    emulatedMedia: { prefersColorScheme: 'dark' }
  }
};
