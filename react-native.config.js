module.exports = {
  // Simple configuration to prevent Codegen issues
  dependencies: {
    '@rnmapbox/maps': {
      platforms: {
        android: {
          sourceDir: '../node_modules/@rnmapbox/maps/android/rctmgl',
          packageImportPath: 'import io.homage.RCTMGLPackage;',
        },
      },
    },
  },
};
