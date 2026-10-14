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

Виджет «Баланс» и уведомления работают только в Android-версии.

## Структура

- `apps/mobile` — приложение (Expo SDK 57, expo-router)
- `packages/finance` — счета, транзакции, бюджеты, Android-виджет
- `packages/db` — схема и миграции SQLite (drizzle)
- `patches/` — временный патч expo-sqlite для веба (исправлено в expo-sqlite 58.0.12, удалить при переходе на SDK 58)
- `notes/` — заметки и решения проекта (можно открыть как хранилище Obsidian)
