# Ecosystem

Личное приложение-экосистема: финансы (готово MVP), здоровье (в планах).
Монорепозиторий на pnpm: `apps/mobile` — Expo-приложение, `packages/*` — модули.

## Запуск на своём компьютере (localhost)

Нужны Node.js 22 и pnpm 10.

```bash
git clone https://github.com/guyrichie156-lab/Ecosystem.git
cd Ecosystem
pnpm install
cd apps/mobile
pnpm web
```

Откройте http://localhost:8081 в Chrome или Edge. Данные в браузере хранятся
отдельно от телефона, в самом браузере.

На Android (нужен Android Studio и подключённый телефон или эмулятор):

```bash
cd apps/mobile
pnpm android
```

Так ставится отладочная версия: она берёт код с компьютера, поэтому компьютер должен быть включён.

Если менялся `app.json` (новые разрешения, плагины), перед сборкой пересоздайте папку `android`:
`npx expo prebuild --platform android --clean`. Сама `pnpm android` создаёт её, только если папки нет.

### APK, который работает сам по себе

```bash
cd apps/mobile
pnpm android:release
```

Готовый файл: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`.
Его можно скопировать на телефон и установить, компьютер больше не нужен.
Он подписан отладочным ключом (так настроен шаблон Expo SDK 57): для своего телефона подходит,
для Google Play нужен свой ключ.

Виджет «Баланс» и уведомления работают только в Android-версии.

На iPhone через Expo Go (компьютер и iPhone в одной Wi-Fi сети):

```bash
npx expo login          # бесплатный аккаунт Expo, тот же вход нужен в Expo Go
cd apps/mobile
npx expo start --go
```

Отсканируйте QR-код камерой iPhone.

## Структура

- `apps/mobile` — приложение (Expo SDK 57, expo-router); `modules.ts` — список модулей
- `packages/core` — каркас модулей: описание модуля, изоляция ошибок
- `packages/finance` — модуль «Финансы»: счета, транзакции, бюджеты, Android-виджет
- `packages/health` — модуль «Здоровье»: замеры тела, графики, подсказки, импорт из Health Connect (Android)
- `packages/db` — схема и миграции SQLite (drizzle)
- `patches/` — временный патч expo-sqlite для веба (исправлено в expo-sqlite 58.0.12, удалить при переходе на SDK 58)
- `notes/` — заметки и решения проекта (можно открыть как хранилище Obsidian)
