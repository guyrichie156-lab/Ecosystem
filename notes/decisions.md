# Журнал решений

## 2026-10-14 (iPhone)
- iOS-версия на iPhone не проверялась. Код и app.json рассчитаны на iOS (bundleIdentifier, плагин expo-widgets), но кода iOS-виджета нет.
- Сборка для iPhone: на Mac (`pnpm ios`) или в облаке EAS Build без Mac; для установки на телефон нужен аккаунт Apple Developer: https://docs.expo.dev/build/internal-distribution/
- Данные о здоровье на iPhone — через HealthKit, а не Health Connect.

## 2026-10-14
- Приложение можно запускать в браузере на localhost (`cd apps/mobile && pnpm web`). Добавлены react-native-web, react-dom, @expo/metro-runtime.
- Для SQLite в браузере: заголовки COOP/COEP и поддержка wasm в `apps/mobile/metro.config.js` (по официальной инструкции Expo для expo-sqlite).
- Перед стартом веб-версии прогревается воркер SQLite (`apps/mobile/index.js`), иначе синхронное открытие базы падает по таймауту.
- Патч `patches/expo-sqlite@57.0.1.patch`: ошибка expo-sqlite в вебе — ответы базы длиннее 255 байт обрезались. Исправлено в expo-sqlite 58.0.12 ([expo/expo#51330](https://github.com/expo/expo/pull/51330)). Удалить патч при переходе на SDK 58.
- Android-виджет вызывается только на Android.
- Память проекта ведётся в `notes/` (эта папка), правила — в корневом `CLAUDE.md`.

## 2026-10-04
- Модуль «Здоровье» делаем отдельным пакетом `packages/health`. Сначала замеры и графики, 3D-модель — вторым шагом.
- Данные с часов и колец на Android читаем через Health Connect, а не через API каждого устройства.
