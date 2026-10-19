# Как устроено приложение

## Это уже нативное приложение
Expo собирает настоящее Android-приложение (APK) и iPhone-приложение. Переносить («портировать») ничего не нужно.
- Кнопки, списки и поля — стандартные элементы Android и iOS: https://reactnative.dev/docs/intro-react-native-components
- Код на JavaScript при сборке переводится в байткод движка Hermes (в Android-сборке проекта это файл `.hbc`): https://engineering.fb.com/2019/07/12/android/hermes/
- База данных — SQLite, она написана на C: https://sqlite.org/about.html

## Два вида сборки для Android
| | Отладочная `pnpm android` | Готовая `pnpm android:release` |
|---|---|---|
| Откуда берёт код | С компьютера, пока он запущен | Код внутри APK |
| Нужен ли компьютер | Да | Нет |
| Для чего | Разработка: изменения видны сразу | Пользоваться каждый день |

Release-APK подписан отладочным ключом: так настроен шаблон Expo SDK 57 (`expo-template-bare-minimum` 57.0.32, `android/app/build.gradle`). Для своего телефона подходит, для Google Play нужен свой ключ.
Ещё вариант — облачная сборка EAS Build с `"buildType": "apk"`: https://docs.expo.dev/build-reference/apk/

### Сборка APK в облачной среде Claude (2026-10-17)
Работает: 2026-10-17 release APK собран из ветки `feature/health-connect` и отправлен пользователю файлом.
- `assembleRelease` — 11 мин 49 с по выводу Gradle (1045 задач, 4 ядра); C++ собирала CMake 3.22.1 из `/opt/android-sdk`.
- APK — 65 746 830 байт (62,7 МБ): `arm64-v8a` и `armeabi-v7a`, minSdk 26, targetSdk 36 (`aapt2 dump badging`).
- Подпись — отладочный ключ шаблона, схема v2, SHA-1 сертификата `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` (`apksigner verify --print-certs`).
- JS внутри — байткод Hermes (файл начинается с магического числа Hermes `c6 1f bc 03 c1 03 19 1f`), 1633 модуля; строки интерфейса на месте. Экранов expo-dev-client в манифесте нет: в release он не подключается (`node_modules/expo-dev-launcher/android/build.gradle`, свойство `expo.devlauncher.configureInRelease`).
- На телефоне не запускался: в облаке это проверить нечем.

Обязательное условие — домен `dl.google.com` в разрешённых доменах окружения (Network access → Allowed domains): https://code.claude.com/docs/en/cloud-environments#network-access . Там Android Gradle Plugin, Android SDK и NDK; пользователь разрешил его 2026-10-17.

Остальное ставится заново в каждой новой сессии:
1. Java 17: `apt-get install -y openjdk-17-jdk-headless`, `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`. Плагину React Native нужна 17, в среде 21, а сам Gradle скачать её не может (`api.foojay.io` отвечает 403).
2. Android SDK в `/opt/android-sdk`: command-line tools с `dl.google.com`, затем `sdkmanager "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006" "cmake;3.22.1"`. Версии платформы, build-tools и NDK — из `node_modules/react-native/gradle/libs.versions.toml`.
3. Maven Central отвечает 429 (слишком много запросов) — и напрямую, и когда Gradle Plugin Portal переадресует туда (ответ 303). Повторы не помогли. Обход — init-скрипт Gradle `~/.gradle/init.d/maven-central-mirror.gradle` (текст ниже): Maven Central читается через зеркало Google.
4. `cd apps/mobile && CI=1 npx expo prebuild --platform android --no-install`, затем файл `android/local.properties` со строкой `sdk.dir=/opt/android-sdk`.
5. `cd android && NODE_ENV=production ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a`. Только ARM: x86 нужен эмуляторам, без него сборка короче и файл меньше.

Эмулятор Android в облаке не запустить: нет `/dev/kvm` (аппаратного ускорения). `www.jitpack.io` закрыт, но сборке не понадобился.

Проверка в браузере в облаке: dev-сервер, запущенный с `CI=1`, не следит за файлами — в его журнале «Metro is running in CI mode, reloads are disabled. Remove CI=true to enable watch mode.» После правки кода сервер нужно перезапустить (`--clear`).

```groovy
// ~/.gradle/init.d/maven-central-mirror.gradle
def mirror = "https://maven-central.storage-download.googleapis.com/maven2/"
def centralHosts = ["repo.maven.apache.org", "repo1.maven.org"]
def redirect = { RepositoryHandler repos ->
  repos.withType(MavenArtifactRepository).configureEach { repo ->
    if (repo.url?.host in centralHosts) repo.url = mirror
  }
}
beforeSettings { settings ->
  settings.pluginManagement.repositories {
    maven { name = "MavenCentralMirror"; url = mirror }
    google()
    gradlePluginPortal()
  }
  redirect(settings.buildscript.repositories)
  redirect(settings.pluginManagement.repositories)
  redirect(settings.dependencyResolutionManagement.repositories)
}
allprojects { project ->
  redirect(project.buildscript.repositories)
  redirect(project.repositories)
}
```

## Модули
Каждая функция — отдельный модуль. Это нужно для разработки: функцию можно менять в своей ветке Git, не трогая остальные.
Выключателей модулей в приложении нет: их убрали 2026-10-17, пользователю они не нужны.
- Описание модуля: `packages/core/src/types.ts` (id, название, иконка; `prepare` — данные, нужные экранам, приложение ждёт её до показа экранов; `onReady` — фоновые задачи после запуска).
- Как читать код и куда что положено: [[guide]].
- Список модулей: `apps/mobile/modules.ts`.
- Экраны модуля: `apps/mobile/app/(tabs)/<id модуля>/`.

Если внутри модуля ошибка, вместо его экранов появляется «В модуле произошла ошибка» с кнопкой «Перезапустить модуль». Остальные вкладки работают. Механизм — `ErrorBoundary` в Expo Router.
Проверено 2026-10-17 в браузере (временно вставленная ошибка в экран «Финансов»). На Android и iPhone ещё не проверялось.

## Правка модуля без остановки приложения
- В отладочной сборке изменения кода видны сразу (Fast Refresh): https://reactnative.dev/docs/fast-refresh
- В готовом APK есть два пути:
  1. Собрать и поставить новый APK. Приложение при этом перезапускается, данные сохраняются.
  2. Позже можно подключить EAS Update: новый JS-код скачивается в уже установленное приложение и применяется при перезапуске. Работает только для изменений в JS-коде; новые нативные библиотеки требуют нового APK: https://docs.expo.dev/eas-update/runtime-versions.md
