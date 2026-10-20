const { withAndroidManifest, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAutoAccept = (config) => {
  // 1. Injeta os serviços no AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest.application || !androidManifest.application[0]) {
      return config;
    }

    const application = androidManifest.application[0];
    application.service = application.service || [];

    // Adiciona AutoAcceptAccessibilityService
    const hasAccessibilityService = application.service.some(
      (s) => s.$['android:name'] === '.AutoAcceptAccessibilityService' ||
             s.$['android:name'] === 'com.tresletras.move.AutoAcceptAccessibilityService'
    );

    if (!hasAccessibilityService) {
      application.service.push({
        $: {
          'android:name': 'com.tresletras.move.AutoAcceptAccessibilityService',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.accessibilityservice.AccessibilityService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/accessibility_service_config',
            },
          },
        ],
      });
    }

    // Adiciona FloatingOverlayService
    const hasOverlayService = application.service.some(
      (s) => s.$['android:name'] === 'com.tresletras.move.FloatingOverlayService'
    );

    if (!hasOverlayService) {
      application.service.push({
        $: {
          'android:name': 'com.tresletras.move.FloatingOverlayService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
      });
    }

    return config;
  });

  // 2. Conecta o AutoAcceptPackage no MainApplication (Kotlin ou Java)
  config = withMainApplication(config, async (config) => {
    const mainApp = config.modResults;
    let contents = mainApp.contents;

    // Adiciona import
    if (!contents.includes('import com.tresletras.move.AutoAcceptPackage')) {
      contents = 'import com.tresletras.move.AutoAcceptPackage\n' + contents;
    }

    // Adiciona o pacote na lista de pacotes do React Native
    if (!contents.includes('AutoAcceptPackage()')) {
      if (contents.includes('PackageList(this).packages.apply {')) {
        contents = contents.replace(
          'PackageList(this).packages.apply {',
          'PackageList(this).packages.apply {\n              add(AutoAcceptPackage())'
        );
      } else if (contents.includes('PackageList(this).packages')) {
        contents = contents.replace(
          'PackageList(this).packages',
          'PackageList(this).packages.toMutableList().apply { add(AutoAcceptPackage()) }'
        );
      }
    }

    mainApp.contents = contents;
    return config;
  });

  // 3. Cria os arquivos nativos de recurso e copia o código fonte
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resXmlDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      fs.mkdirSync(resXmlDir, { recursive: true });

      const accessibilityConfigXml = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/app_name"
    android:accessibilityEventTypes="typeWindowContentChanged|typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="10"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows|flagReportViewIds"
    android:canRetrieveWindowContent="true"
    android:canPerformGestures="true" />
`;
      fs.writeFileSync(
        path.join(resXmlDir, 'accessibility_service_config.xml'),
        accessibilityConfigXml
      );

      const targetJavaDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'tresletras',
        'move'
      );
      fs.mkdirSync(targetJavaDir, { recursive: true });

      const nativeSourceDir = path.join(projectRoot, 'native_src');
      if (fs.existsSync(nativeSourceDir)) {
        copyFolderSync(nativeSourceDir, targetJavaDir);
      }

      return config;
    },
  ]);

  return config;
};

function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach((element) => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

module.exports = withAutoAccept;
