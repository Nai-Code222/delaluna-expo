const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function composeCompilerOverride(config) {
  return withProjectBuildGradle(config, (cfg) => {
    const stamp = '/* compose-compiler-override injected */';
    if (cfg.modResults.contents.includes(stamp)) return cfg;

    cfg.modResults.contents += `

${stamp}
subprojects { p ->
  [ 'com.android.application', 'com.android.library' ].each { pid ->
    p.plugins.withId(pid) {
      def androidExt = p.extensions.findByName('android')
      if (androidExt && androidExt.hasProperty('composeOptions')) {
        androidExt.composeOptions { kotlinCompilerExtensionVersion = "1.5.15" }
      }
    }
  }
  configurations.all {
    resolutionStrategy.eachDependency { d ->
      if (d.requested.group == "androidx.compose.compiler" && d.requested.name == "compiler") {
        d.useVersion("1.5.15")
      }
    }
  }
}
`;
    return cfg;
  });
};
