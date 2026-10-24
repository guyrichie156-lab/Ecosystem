> Отчёт агента-архитектора от 2026-10-22: как «Хате» вырасти в супер-приложение. Мнения помечены «Мнение», непроверенное — «Я не могу это подтвердить». Решения ждут пользователя — см. [[decisions]], 2026-10-24.

# «Хата»: как вырасти в супер-приложение — план архитектора

Дата: 2026-10-22. Код читал из ветки `feature/brand` (коммит `c133b52`), заметки — из `max/jolly-feynman-ykq4yw`, цены — из записки [[pricing]]. Репозиторий только читался.

**Как читать.** Ссылка без пометки: страницу или файл я открыл сам (raw.githubusercontent.com, registry.npmjs.org, developer.android.com). «(по выдержке поиска)»: видел только краткий пересказ страницы в поиске. «Мнение» — моё предложение, не факт. Курсы: $1 = 2,9713 BYN на 22.10.2026 (из `pricing.md`); €1 ≈ 3,386 BYN на 04.10.2026 ([myfin.by](https://myfin.by/bank/kursy_valjut_nbrb/eur/04-10-2026), по выдержке поиска; курс на 22.10 не нашёл).

## Коротко
- **Модульная система остаётся.** Каждый сервис по-прежнему отдельный пакет с `AppModule`. Добавляются: место показа (вкладка или плитка «Сервисы»), «нужен вход», обработчик пушей, вход и выход. Общий код — аккаунт, ключи, пуши — живёт в `packages/core`.
- **Офлайн-режим остаётся основным.** «Финансы», «Здоровье», «Еда» и будущий «Сейф» работают без сети и без аккаунта. Сервер хранит только зашифрованные копии. Без сервера не обойтись только «Мове» и платежам.
- **«Мова» — Мнение: на Matrix.** Сервер Synapse, клиент — Rust SDK Matrix через обвязку для React Native. Сквозное шифрование, несколько устройств, резервная копия ключей, пуши и файлы в Matrix уже есть. Главный технический риск — обвязка: её проверяли на RN 0.76.9, а у нас 0.86.2.
- **Вход — Мнение:** сначала e-mail через Matrix Authentication Service (MAS), позже passkeys. Без SMS: одно SMS в Беларусь у Twilio стоит ≈ $0,25.
- **Платежи — только через партнёров** (агрегатор ЕРИП, банк). Деньги через приложение не идут. Для договора с агрегатором нужны ИП или юрлицо (Мнение) и консультация юриста по Закону № 164-З.
- **Первая версия сервера** (до 100 человек): одна VPS на 4 ГБ, домен, FCM (бесплатно), почта. **≈ 18–23 BYN в месяц в ЕС или ≈ 42–60 BYN в Беларуси** (расчёт в разделе 5).
- **Многое можно сделать до сервера:** свой ключ подписи, зашифрованную копию данных, подготовку базы к синхронизации, новую навигацию, «Сейф», клиент «Мовы» на публичном сервере Matrix (раздел 6, фаза 0).

---

## 1. Целевая архитектура

### 1.1 Что есть сейчас (факты из кода)
- `AppModule` = `id`, `title`, `icon`, `prepare`, `onReady` (`packages/core/src/types.ts`). Модулей три: `financeModule`, `healthModule`, `foodModule` (`apps/mobile/modules.ts`).
- Каждый модуль — вкладка: `app/(tabs)/_layout.tsx` строит `Tabs.Screen` по списку `appModules`.
- Одна база SQLite `ecosystem.db` через drizzle, открыта без ключа (`packages/db/src/client.ts`). Ключи строк — целые числа с автоувеличением (`packages/db/src/schema.ts`).
- `app.json`: имя «Хата», пакет `com.ecosystem.mobile`, схема ссылок `ecosystem`. Нет `expo-secure-store`, `googleServicesFile` и Firebase.
- Сервера, токенов и ключей API нет (`notes/research/auth-secrets.md`). APK подписан публичным отладочным ключом шаблона (там же).

### 1.2 Схема (Мнение)
```
 Телефон: «Хата»                                    Сервер (одна VPS, фаза 1)
┌─────────────────────────────────────┐   HTTPS    ┌───────────────────────────────────┐
│ Вкладки: Мова · Сервисы · Я          │◄──────────►│ Caddy — HTTPS-сертификаты          │
│ Сервисы-модули: Финансы, Здоровье,   │            │ MAS — аккаунты и вход (OIDC)       │
│   Еда, Сейф, Платежи…                │            │ Synapse + Postgres — «Мова»        │
│ packages/core: аккаунт, ключи        │            │ Sygnal — пуши в FCM                │
│   (SecureStore), пуши, ссылки        │            │ sync-api — шифроблоки (фаза 2)     │
│ ecosystem.db — данные на телефоне    │            │ webhook платежей (фаза 3)          │
│ кэш Matrix SDK — своя база           │            └───────────────┬───────────────────┘
└───────────────▲─────────────────────┘                            │
                │ FCM (Google): «есть новое», без текста            ▼
                └────────────────────────────────  партнёр: агрегатор ЕРИП / банк
```

### 1.3 Как подключаются сервисы
Мнение: `AppModule` расширить так (старые модули менять не нужно, все новые поля необязательные):
```ts
export type AppModule = {
  id: string; title: string; icon: string;
  placement?: "tab" | "services";      // своя вкладка или плитка на экране «Сервисы»
  requiresAccount?: boolean;            // «Мова», «Платежи» — да; «Финансы» — нет
  prepare?: () => Promise<void>;        // как сейчас: быстро, до первого экрана
  onReady?: () => void | Promise<void>; // как сейчас: фон (подключение к Matrix, синхронизация)
  onPush?: (data: Record<string, string>) => Promise<void>; // пуш с data.module === id
  onSignIn?: (session: Session) => Promise<void>;
  onSignOut?: () => Promise<void>;      // стереть свои данные, привязанные к аккаунту
};
```
Правила:
- **Вкладок 3–5.** Android советует навигационную панель для «Three to five destinations of equal importance» ([developer.android.com](https://developer.android.com/develop/ui/compose/components/navigation-bar)). Мнение: «Мова», «Сервисы», «Я»; «Финансы» можно оставить четвёртой. Остальные сервисы — плитки. Их экраны остаются в `app/(tabs)/<id>/`, вкладка скрыта через `href: null`, как `index` сейчас.
- **Модули не импортируют друг друга** (правило `CLAUDE.md`). Связь между сервисами — через ссылки: в Expo Router у каждого экрана есть адрес ([Expo Router](https://raw.githubusercontent.com/expo/expo/main/docs/pages/router/introduction.mdx)). Пример (Мнение): в «Мове» сообщение «перевёл 20 BYN» с кнопкой «Записать в Финансы» открывает `ecosystem://finance/add-transaction?amount=2000`. Так у WeChat открываются мини-программы, только у нас они встроены в APK.
- **Новое в `packages/core`:** `account` (сессия, токены), `secure` (ключи в SecureStore, шифрование AES-GCM), `push` (регистрация токена, раздача пушей модулям), `api` (HTTP-клиент). Matrix SDK подключается только в `packages/messenger`.
- **Код сервера — в отдельном приватном репозитории** (Мнение): репозиторий приложения публичный, а у сервера есть ключи и пароли.

### 1.4 Что остаётся на телефоне, что синхронизируется
| Сервис | Где данные | Синхронизация | Без сети |
|---|---|---|---|
| Финансы | `ecosystem.db` | фаза 2, по желанию, только зашифрованно | всё работает |
| Здоровье, Еда | `ecosystem.db`; Health Connect читается на телефоне | фаза 2, зашифрованно. Open Food Facts — прямой запрос, как сейчас | всё, кроме поиска по штрих-коду |
| Сейф (новый: документы, пароли, заметки) | на телефоне, зашифрованно | только зашифрованная копия | всё |
| Мова | сервер + кэш SDK на телефоне | всегда, сквозное шифрование | чтение кэша, очередь отправки |
| Платежи | у партнёра | статус приходит с сервера | нет |

Правило (Мнение): сервер не видит открытого текста личных данных, только шифротекст, размеры и время. Схема ключей уже описана: ключ данных в SecureStore плюс ключ восстановления (`notes/research/auth-secrets.md`, раздел 4).

**Подготовка базы (можно сейчас).** В таблицы, которые будут синхронизироваться, добавить `uid TEXT` (уникальный на всех устройствах), `updated_at` и `deleted_at` (мягкое удаление). Генератор — `randomUUID()` из expo-crypto ([Crypto.ts, sdk-57](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-crypto/src/Crypto.ts)), версия `~57.0.1` (`node_modules/expo/bundledNativeModules.json`). Целые `id` остаются для связей внутри телефона. Миграция — `npx drizzle-kit generate` в `packages/db`.

---

## 2. Мессенджер «Мова»

### 2.1 Варианты
| Вариант | Шифрование | Клиент в нашем React Native | Сервер | Итог (Мнение) |
|---|---|---|---|---|
| **Matrix** | Olm/Megolm. Реализация на Rust — vodozemac, один аудит Least Authority «with no significant findings» ([README](https://raw.githubusercontent.com/matrix-org/vodozemac/main/README.md)) | `matrix-js-sdk` 44.0.0 от 13.10.2026 ([npm](https://registry.npmjs.org/matrix-js-sdk)) шифрует только через WebAssembly-сборку Rust-криптографии ([README](https://raw.githubusercontent.com/matrix-org/matrix-js-sdk/develop/README.md)). Работает ли WebAssembly в Hermes — признаков нет ([issue #395](https://github.com/facebook/hermes/issues/395), по выдержке поиска), **Я не могу это подтвердить**. Второй путь — `@unomed/react-native-matrix-sdk` 0.10.2 от 30.09.2026, Apache-2.0: обвязка Rust SDK Matrix как TurboModule ([npm](https://registry.npmjs.org/@unomed/react-native-matrix-sdk), [README](https://raw.githubusercontent.com/unomed-dev/react-native-matrix-sdk/main/README.md)) | Synapse, Rust-серверы (ниже) | **Рекомендую.** Всё нужное уже есть. Риск — обвязка |
| XMPP | OMEMO (XEP-0384) | `xmpp.js` работает в React Native, но OMEMO для него не нашлось ([xmpp.org](https://xmpp.org/software/xmpp-js), по выдержке поиска) | ejabberd, Prosody | Шифрование пришлось бы писать самим |
| Свой сервер + Signal Protocol | Double Ratchet | libsignal: «Use outside of Signal is unsupported», AGPL-3.0 ([README](https://raw.githubusercontent.com/signalapp/libsignal/main/README.md), [npm](https://registry.npmjs.org/@signalapp/libsignal-client)). TypeScript-версия — дополнение для Node, а не для React Native (README) | Signal-Server требует FoundationDB, «We cannot provide direct technical support» ([README](https://raw.githubusercontent.com/signalapp/Signal-Server/main/README.md)) | Больше всего работы и риска для одного человека |
| Готовый сервис (Stream, Sendbird) | Встроенного нет. У Stream — пример «сделай сам», у Sendbird — через Virgil E3Kit ([Stream](https://getstream.io/chat/docs/sdk/flutter/guides/end-to-end-chat-encryption/), [Sendbird](https://sendbird.com/developer/tutorials/chat-message-encryption-virgil-security), по выдержке поиска) | готовые SDK | у провайдера. Stream: бесплатно при < 5 человек в команде и < $10k выручки в месяц, платно от $399 в месяц; Sendbird: от $349–399 в месяц ([getstream.io](https://getstream.io/pricing), [eesel.ai](https://www.eesel.ai/blog/sendbird-ai-pricing), по выдержке поиска) | Быстро, но переписку видит провайдер. Работают ли они с клиентами из Беларуси — **Я не могу это подтвердить** |

### 2.2 Серверы Matrix
- **Synapse** — основной сервер от Element, лицензия AGPL или коммерческая ([README](https://raw.githubusercontent.com/element-hq/synapse/develop/README.rst)). Последний выпуск — 1.164.0rc1 от 20.10.2026 ([CHANGES.md](https://raw.githubusercontent.com/element-hq/synapse/develop/CHANGES.md)). Требования: Python 3.10–3.13, не меньше 1 ГБ свободной памяти для больших публичных комнат, рекомендуется PostgreSQL ([installation.md](https://raw.githubusercontent.com/element-hq/synapse/develop/docs/setup/installation.md)).
- **ESS Community** — сборка Element: Synapse, MAS, сервер звонков, Element Web, админка. Минимум 2 ядра и 2 ГБ памяти (на K3s). Предназначена для «non-commercial community use cases with up to 100 users» ([README](https://raw.githubusercontent.com/element-hq/ess-helm/main/README.md)).
- **Dendrite** — «in maintenance mode», выходят только исправления безопасности ([README](https://raw.githubusercontent.com/element-hq/dendrite/main/README.md)).
- **Rust-серверы:** continuwuity — продолжение conduwuit силами сообщества ([continuwuity.org](https://continuwuity.org/introduction), по выдержке поиска); Tuwunel ([README](https://raw.githubusercontent.com/matrix-construct/tuwunel/main/README.md)). Они легче, но поддерживают ли они всё, что нужно Rust SDK, — **Я не могу это подтвердить**.
- **Закрытый сервер.** Федерацию (переписку с чужими серверами) можно выключить: `federation_domain_whitelist: []`. Регистрацию — пускать только по приглашению: `registration_requires_token` ([config](https://raw.githubusercontent.com/element-hq/synapse/develop/docs/usage/configuration/config_documentation.md)).

### 2.3 Пуши на Android (FCM)
- FCM входит в бесплатные продукты Firebase на любом тарифе ([Firebase](https://firebase.google.cn/docs/projects/billing/firebase-pricing-plans?hl=en), по выдержке поиска).
- **Что нужно:** проект Firebase; файл `google-services.json` и поле `android.googleServicesFile` в `app.json`. Этот файл можно коммитить: в нём только публичные идентификаторы. На сервере нужен закрытый JSON-ключ сервисного аккаунта, его в Git класть нельзя ([Expo FCM](https://raw.githubusercontent.com/expo/expo/main/docs/pages/push-notifications/fcm-credentials.mdx)). Токен устройства — `getDevicePushTokenAsync()` ([Expo](https://raw.githubusercontent.com/expo/expo/main/docs/pages/push-notifications/sending-notifications-custom.mdx)). `expo-notifications ~57.0.9` уже стоит (`apps/mobile/package.json`).
- **Как идёт пуш:** Synapse → Sygnal (Apache-2.0, FCM v1: `api_version: v1`, `project_id`, `service_account_file`; [README](https://raw.githubusercontent.com/matrix-org/sygnal/main/README.md)) → FCM → телефон.
- **Чтобы Google не видел текст:** формат `event_id_only` — в пуше только `event_id`, `room_id`, счётчики и устройства ([спецификация](https://raw.githubusercontent.com/matrix-org/matrix-spec/main/content/push-gateway-api.md)). Приложение просыпается без экрана: пуш только с `data` плюс `expo-task-manager` ([expo-notifications](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/unversioned/sdk/notifications.mdx)). Потом оно скачивает и расшифровывает сообщение и само показывает уведомление. **Мнение: это самая трудная часть «Мовы».**
- **Без сервисов Google:** UnifiedPush через ntfy, Element Android это поддерживает ([etke.cc](https://etke.cc/help/extras/ntfy/), по выдержке поиска). Мнение: отложить.

### 2.4 Файлы и фото
- В зашифрованной комнате клиент шифрует файл одноразовым 256-битным ключом AES-CTR, сервер хранит только шифротекст ([спецификация](https://raw.githubusercontent.com/matrix-org/matrix-spec/main/content/client-server-api/modules/end_to_end_encryption.md)).
- Synapse: каталог `media_store_path`, лимит `max_upload_size` (по умолчанию 50M), автоочистка `media_retention` ([config](https://raw.githubusercontent.com/element-hq/synapse/develop/docs/usage/configuration/config_documentation.md)).
- Мнение: со временем больше всего места занимают файлы. Нужно сразу задать лимит и следить за диском.

### 2.5 Рекомендация (Мнение)
1. **Matrix + Synapse.** Пока пользователей до 100 и нет коммерции, можно ставить ESS Community. Федерация выключена, вход по приглашениям.
2. **Сначала проба на 1–2 дня:** поставить `@unomed/react-native-matrix-sdk` в отдельную ветку и проверить на RN 0.86.2 вход, отправку и расшифровку. В `package.json` обвязки разработка идёт на `react-native 0.76.9` ([package.json](https://raw.githubusercontent.com/unomed-dev/react-native-matrix-sdk/main/package.json)). Распакованный пакет весит 253 МБ ([npm](https://registry.npmjs.org/@unomed/react-native-matrix-sdk/0.10.2)); на сколько вырастет APK — **Я не могу это подтвердить**.
3. **Если проба не пройдёт:** (а) свой нативный модуль Expo поверх Kotlin-обвязки Rust SDK, на нём построен Element X ([README](https://raw.githubusercontent.com/element-hq/element-x-android/develop/README.md)); (б) «Мова» отдельным приложением — ответвлением Element X (AGPL), связанным с «Хатой» ссылками.
4. **Почему не остальные:** шифрование, несколько устройств, резервная копия ключей, пуши и файлы в Matrix уже сделаны и проверены. Стандарт открытый, ИИ-помощник хорошо его знает. Свой протокол — годы работы.

---

## 3. Аккаунты и вход

| Способ | Что нужно | Цена | Мнение |
|---|---|---|---|
| E-mail + пароль | Почтовый сервис по SMTP. MAS умеет пароли и письма через SMTP ([config](https://raw.githubusercontent.com/element-hq/matrix-authentication-service/main/docs/reference/configuration.md)) | Resend: бесплатно 3000 писем в месяц, не больше 100 в день ([automationatlas](https://automationatlas.io/answers/resend-free-tier-explained-2026/), по выдержке поиска). Amazon SES: $0,10 за 1000 по старой схеме, новые аккаунты с 21.07.2026 — по пакетам ([costbench](https://www.costbench.com/software/email-api/amazon-ses/free-plan/), по выдержке поиска) | **Начать с этого** |
| Телефон + SMS | Поставщик SMS, для местных — зарегистрированное альфа-имя ([vc.ru](https://vc.ru/top-raiting/2332522-top-10-onlajn-servisov-otpravki-sms), по выдержке поиска) | Twilio в Беларусь: $0,2521 (≈ 0,75 BYN) за сегмент ([twilio.com](https://www.twilio.com/sms/pricing/by), по выдержке поиска). Местный тариф 0,048 BYN — из обзора, к какому поставщику он относится, неясно (vc.ru). Telegram Gateway: $0,01 за доставленный код, но нужен Telegram ([core.telegram.org](https://core.telegram.org/gateway), по выдержке поиска) | Не сейчас: дорого |
| Passkeys | Android 9+ и Credential Manager. Обязательное условие — Digital Asset Links ([create passkeys](https://developer.android.com/identity/passkeys/create-passkeys)): домен подтверждает ключ подписи приложения, поэтому сначала нужен свой ключ | бесплатно | Второй шаг. В справочнике конфигурации MAS раздела о passkeys нет: поддерживает ли их MAS — **Я не могу это подтвердить** |
| Вход через Google | Credential Manager (`notes/research/auth-secrets.md`, раздел 4) | бесплатно | По желанию, через «внешний вход» MAS |

**Как устроить (Мнение).** Один аккаунт «Хаты» — это аккаунт в MAS. MAS выдаёт токены по стандарту OAuth 2.0 / OIDC ([README](https://raw.githubusercontent.com/element-hq/matrix-authentication-service/main/README.md)).
- `packages/core/account` открывает вход в браузере через `expo-auth-session`. В версии `57.0.16` PKCE `S256` включён по умолчанию (`auth-secrets.md`, раздел 4).
- Токены хранятся в SecureStore. «Мова» берёт сессию у core, а наш sync-api проверяет тот же токен.

**Восстановление.**
- Пароль восстанавливается письмом на e-mail.
- Для зашифрованных данных нужен **ключ восстановления**. В Matrix это secret storage, `bootstrapSecretStorage` ([README js-sdk](https://raw.githubusercontent.com/matrix-org/matrix-js-sdk/develop/README.md)). Для данных сервисов — та же схема, ключ данных плюс ключ восстановления (`auth-secrets.md`).
- Если потерять и телефон, и ключ, данные пропадут. Так устроено сквозное шифрование, это не ошибка.

**Несколько устройств.**
- В Matrix — перекрёстная подпись устройств (cross-signing) и вход по QR-коду, MSC4108 (модуль `rendezvous` в js-sdk, тот же README).
- Каждое устройство — отдельная сессия. Её можно закрыть удалённо.

**Перенос локальных данных в аккаунт (Мнение).**
1. Сейчас: миграция `uid` / `updated_at` / `deleted_at` (раздел 1.4).
2. При входе ключ данных создаётся на телефоне, пользователь сохраняет ключ восстановления. Открытым текстом ничего не уходит.
3. Первая выгрузка — зашифрованный снимок записей. Дальше уходят только изменения из очереди `sync_outbox`.
4. Второй телефон: вход, затем ключ восстановления или подтверждение с первого телефона. Данные скачиваются, расшифровываются и сливаются в его `ecosystem.db`. При конфликте побеждает последняя правка по `updated_at`.
5. Без аккаунта приложение работает как сейчас: аккаунт нужен только «Мове» и «Платежам».

---

## 4. Платежи

**Факты (Беларусь).**
- Закон № 164-З «О платёжных системах и платёжных услугах». Нацбанк ведёт реестр поставщиков платёжных услуг (Постановление № 902/28). Без реестра большинство платёжных услуг оказывать нельзя. Источники — в `pricing.md`, раздел 6 ([REVERA](https://belarus.revera.legal/news-and-analytical-materials/reest-postavshhikov-platezhnyx-uslug-vozmozhnosti-trebovaniya-i-preimushhestva/), по выдержке поиска).
- В законе есть вид «информационные платёжные услуги», ст. 19 ([ilex.by](https://ilex.by/news/platezhnye-uslugi-i-uchastniki-platezhnoj-sistemy-v-novom-zakone/), по выдержке поиска). Что в него входит и касается ли это показа чужих счетов в приложении — **Я не могу это подтвердить**.
- ЕРИП через агрегатор. bePaid сам готовит документы, клиент присылает реквизиты и подписывает договор, получает ID магазина и секретный ключ ([myfin.by](https://myfin.by/article/events/5595-podklyuchitsya-k-sisteme-erip-stalo-znachitelno-proshhe), [Bitrix24](https://helpdesk.bitrix24.ru/open/16341066/), по выдержке поиска). Запросы к API bePaid идут с HTTP Basic: ID магазина и секретный ключ ([docs.bepaid.by](https://docs.bepaid.by/en/integration/apm_api/), по выдержке поиска).
- Комиссия ЕРИП и «Экспресс Платежей» вместе — 1,2 % (карточка в [Bitrix24](https://www.bitrix24.ru/apps/app/triincom.ekspress_platezhi_crm_v2_erip_e_pos_qr/), по выдержке поиска).
- Чтобы заплатить по счёту ЕРИП, нужна карта белорусского банка или наличные в Беларуси ([dev.by](https://devby.io/news/erip-vs-internet-ekvayring-chto-vybrat-biznesu), по выдержке поиска). Сайт для приёма оплаты картой регистрируют в БелГИЭ ([neg.by](https://neg.by/novosti/otkrytj/prinimaem-platezhi-cherez-internet-kak-nachat), по выдержке поиска).
- **«КРОК»** — QR-платежи Нацбанка со счёта, без карты. С 1.07.2026 он есть в приложениях пяти банков, у клиентов остальных — с 1.12.2026 ([primepress.by](https://primepress.by/news/finansi/natsbank_belarusi_s_1_iyulya_zapuskaet_servis_platezhey_po_qr_kodu_krok-55289/), [BelTA](https://belta.by/economics/view/natsbank-prezentoval-natsionalnyj-servis-mgnovennyh-qr-platezhej-krok-788702-2026/), по выдержке поиска). Потолок комиссии для бизнеса 0,8 % ([select.by](https://select.by/news/konec-ery-plastika-novaya-platezhnaya-sistema-krok-24900), по выдержке поиска, в документах Нацбанка не проверял).
- Открытого доступа сторонних приложений к операциям частных клиентов белорусских банков поиск не нашёл (`notes/decisions.md`, 2026-10-19).
- В Google Play пользователи из Беларуси не могут платить. RuStore принимает BYN с 17.08.2026, но платежи там подключают только ИП и юрлица (`pricing.md`, раздел 3).

**Что приложение может без лицензии (Мнение; перед запуском проверить у юриста).**
| Можно | Как |
|---|---|
| Учёт, бюджеты, напоминания «оплатить до 25-го» | уже есть, только на телефоне |
| Импорт выписки банка | файл из интернет-банка → правила «магазин → категория» |
| «Как оплатить»: путь в ЕРИП, кнопка «Открыть приложение банка» | ссылка; деньги через нас не идут |
| «Запросить деньги» в «Мове» | сообщение с реквизитами или номером услуги ЕРИП; платят банк → банк |
| Продавать свои услуги (Premium, партнёрские) | агрегатор, договор на ИП или юрлицо; карта вводится на странице партнёра, её данные приложение не видит |
| **Не делать** | хранить чужие деньги, свой «кошелёк», переводы между пользователями через свой счёт, хранить данные карт |

Мнение: у WeChat платят продавцы, комиссия около 0,6 % (`pricing.md`, раздел 6). Для нас доход от платежей реален только при большом числе пользователей. Поэтому платежи — фаза 3, после «Мовы».

---

## 5. Хостинг и деньги в месяц

### 5.1 Где может жить сервер
| Где | Пример и цена | Плюсы | Вопросы |
|---|---|---|---|
| Беларусь | domain.by «vps-start» — 39,10 BYN, mhost.by «VPS 2x2» — 55 BYN в месяц ([whtop](https://www.whtop.com/plans/domain.by/150964), [whtop](https://www.whtop.com/plans/mhost.by/133489), агрегатор, дата не указана, по выдержке поиска) | Нет вопроса о передаче данных за границу; подходит под Указ № 60 (ниже) | Характеристики и актуальность цен не проверял: сайты закрыты прокси |
| ЕС (Hetzner, Германия) | CX23 (4 ГБ): €3,99 + €0,50 за IPv4 с 1.04.2026; 15.06.2026 — ещё повышение примерно в 1,3–1,4 раза; на странице стояло «Currently not available» ([findstack](https://findstack.com/resources/hetzner-price-increase-2026), [northflank](https://northflank.com/blog/hetzner-cloud-server-price-increases), по выдержке поиска) | Дёшево | Примет ли Hetzner клиента и карту из Беларуси — **Я не могу это подтвердить** (найдены только сообщения о России). Нужна ли Германия в перечне стран для передачи данных — ниже |
| Свой компьютер | 0, кроме электричества | Для опытов | Мнение: не для живых пользователей. Компьютер должен работать круглосуточно, нужен белый IP и открытые порты, а за безопасность отвечает сам владелец |

### 5.2 Первая версия, до 100 человек (Мнение по составу, цены — по ссылкам выше)
| Строка | ЕС | Беларусь |
|---|---|---|
| VPS, 2 ядра, 4 ГБ (ESS требует от 2 ядер и 2 ГБ) | €4,5–6 ≈ 15–20 BYN | ≈ 39–57 BYN |
| Домен `.by`: от 33 BYN в год ≈ 2,75 BYN в месяц ([habr](https://habr.com/en/articles/891494), без даты, по выдержке поиска) | 2,75 BYN | 2,75 BYN |
| FCM | 0 | 0 |
| Почта (Resend, до 3000 писем) | 0 | 0 |
| SMS | 0 (не используем) | 0 |
| Резервные копии на другой диск или в хранилище | цену не проверял | цену не проверял |
| **Итого без копий** | **≈ 18–23 BYN** | **≈ 42–60 BYN** |

Расчёт: €4,5 × 3,386 = 15,2 BYN; €6 × 3,386 = 20,3 BYN; плюс 2,75 BYN за домен. 39,10 + 2,75 = 41,85; 56,85 + 2,75 = 59,6 (56,85 BYN — тариф «Cloud VPS admin-1» из той же выдачи whtop, в нём всего 10 ГБ диска).
Мнение: самая дорогая строка — время. Обновления, копии и безопасность сервера займут несколько часов в месяц.

### 5.3 Данные и законы (до запуска для посторонних проверить у юриста)
- Как только на сервере появятся данные других людей, у владельца появятся обязанности оператора по Закону № 99-З: ответственный, политика обработки (`pricing.md`, раздел 6). Исключение для «личного, семейного, домашнего» использования (`decisions.md`, 2026-10-19), Мнение, действует, только пока пользователи — сам владелец и семья.
- Передавать данные за границу можно в страны из перечня НЦЗПД: приказ № 14 от 15.11.2021, приказ № 114 от 26.12.2022 добавил страны ЕАЭС. Без надлежащего уровня защиты — например, с согласия человека, которому объяснили риски ([neg.by](https://neg.by/novosti/otkrytj/transgranichnaya-peredacha-personalnykh-dannykh/), по выдержке поиска). Есть ли в перечне Германия — **Я не могу это подтвердить**.
- Указ № 60: ИП и юрлица, которые продают товары и услуги через интернет в Беларуси, используют ресурсы, размещённые в Беларуси и зарегистрированные ([dev.by](https://devby.io/news/kakim-dolzhen-byt-domen-u-belorusskogo-internet-magazina), разборы 2010–2015 годов, по выдержке поиска). Действует ли так сейчас и касается ли это приложения — **Я не могу это подтвердить**.
- Нужна ли лицензия ОАЦ на криптографическую защиту для мессенджера со сквозным шифрованием — **Я не могу это подтвердить**: поиск нашёл только новости об отзыве таких лицензий у компаний ([dev.by](https://devby.io/news/oats-lishil-litsenzii-krupnogo-sistemnogo-integratora), по выдержке поиска).
- С 1.12.2018 владельцы интернет-ресурсов идентифицируют авторов по номеру телефона ([forbes.kz](https://forbes.kz/news/newsid_187201), по выдержке поиска). Касается ли это мессенджера — **Я не могу это подтвердить**.
- Google Cloud в 2022 году новых клиентов из России не принимал, а в Беларуси работал как обычно ([habr](https://habr.com/ru/post/655321), по выдержке поиска). Как сейчас — **Я не могу это подтвердить**.

---

## 6. План по фазам

### Фаза 0. Без сервера (можно начинать сейчас)
- **Свой ключ подписи.** Пользователь решил так 2026-10-19: после экспорта и импорта. Без своего ключа не будет passkeys (Digital Asset Links) и Google Play. Ограничивать ключ API Firebase по SHA-1 ([Expo FCM](https://raw.githubusercontent.com/expo/expo/main/docs/pages/push-notifications/fcm-credentials.mdx)) публичного ключа бессмысленно (Мнение).
- **Зашифрованная копия в файл** и импорт (П6 из `auth-secrets.md`).
- **Подготовка базы к синхронизации:** `uid`, `updated_at`, `deleted_at` (раздел 1.4). Пользователь этого не видит.
- **Новая навигация** «Мова · Сервисы · Я» и поля `placement` и `requiresAccount` в `AppModule`. Сделать замер запуска до и после: скорость — приоритет пользователя.
- **«Сейф»** — новый модуль: секреты в SecureStore (`expo-secure-store ~57.0.1`). К нему — блокировка отпечатком (`expo-local-authentication ~57.0.2`) и SQLCipher. Пользователь отложил это 2026-10-19 «до банка или синхронизации», а хранение секретов — именно такой случай.
- **Клиент «Мовы» в ветке `feature/mova`:** проба обвязки (раздел 2.5). Разработка на тестовом аккаунте любого публичного сервера Matrix, свой сервер пока не нужен (Мнение).
- **«Счета к оплате»** в «Финансах»: напоминания и путь в ЕРИП.
- **Решить:** вкладки; нужен ли «Сейф» и что в нём хранить; где хранить ключ подписи.

### Фаза 1. «Мова» для своих (первый сервер)
- VPS и домен; Caddy, Postgres, Synapse, MAS, Sygnal (или ESS Community); Firebase и FCM.
- Регистрация по приглашениям, федерация выключена, вход по e-mail.
- Пуши в формате `event_id_only`, расшифровка на телефоне. Ежедневная копия базы и файлов на другой диск.
- **Решить:** страна сервера, домен, кто может зарегистрироваться, включать ли федерацию.

### Фаза 2. Синхронизация и несколько устройств
- Небольшой `sync-api`: принимает зашифрованные изменения по токену MAS. Ключ восстановления, вход на втором телефоне по QR.
- Мнение: другой путь — хранить зашифрованные записи в личной комнате Matrix и обойтись без второго сервиса. Matrix для этого не задуман, сначала нужен замер на данных одного года.
- **Решить:** какие сервисы синхронизировать (финансы? здоровье?); согласен ли пользователь, что без ключа восстановления данные не вернуть.

### Фаза 3. Платежи через партнёра
- ИП или юрлицо, договор с агрегатором (bePaid, «Экспресс Платежи») или банком, webhook на сервере.
- Первая платная вещь — Premium или партнёрская услуга. Ссылки на «КРОК» и ЕРИП.
- Консультация юриста: ст. 19 Закона № 164-З, Указ № 60, лицензия ОАЦ, Закон № 99-З.
- **Решить:** форма бизнеса, партнёр, что продавать.

### Фаза 4. Публичный запуск
- RuStore и (или) Google Play, политика конфиденциальности (`pricing.md`, раздел 3).
- Модерация и защита от спама, масштабирование Synapse, партнёрские мини-сервисы (Мнение: страницы в WebView со входом через MAS).
- **Решить:** бесплатно или Premium; лицензия ESS Community рассчитана на некоммерческое использование и до 100 человек — при росте нужен обычный Synapse или ESS Pro.

---

## 7. Риски и главные решения

### Риски
| Риск | Почему (факты) | Что делать (Мнение) |
|---|---|---|
| Публичный ключ подписи | Посторонний может собрать APK с той же подписью, и Android примет его как обновление (`auth-secrets.md`) | Свой ключ — до аккаунтов и «Сейфа» |
| Обвязка Matrix для React Native | Её делают сторонние разработчики (unomed), проверяли на RN 0.76.9 | Проба в фазе 0; запасные пути из раздела 2.5 |
| Пуши с расшифровкой в фоне | Нужны пуши только с `data` и фоновая задача (раздел 2.3) | Сначала простое «Новое сообщение», расшифровка — потом |
| Законы Беларуси | Многое выше помечено «Я не могу это подтвердить» | Юрист до появления посторонних пользователей и денег |
| Оплата зарубежных сервисов из Беларуси | Google Play: выплаты неясны, Hetzner и Supabase — не проверено | Начать с белорусской VPS или проверить оплату заранее |
| Сервер на одном человеке | Обновления, копии, взлом | Минимум компонентов, автообновления, ежедневная копия |
| Слишком большой размах | У Signal расходы ≈ $50 млн в год (`pricing.md`) | Начать с «Мовы» для семьи и друзей |
| AGPL (Synapse, MAS, Element X) | Изменённый сервер нужно отдавать в исходниках ([Synapse](https://raw.githubusercontent.com/element-hq/synapse/develop/README.rst)) | Не менять сервер; если менять, публиковать изменения |

### Пять главных решений для пользователя
1. **Для кого «Хата»:** для себя, семьи и друзей (до 100 человек, без денег) или для всех? От этого зависят ИП или юрлицо, страна сервера, ESS Community или Synapse и юрист.
2. **Протокол «Мовы»:** Matrix (рекомендую) или другой. Включать ли позже федерацию, чтобы писать пользователям Element.
3. **Чем входить:** e-mail (дёшево) или телефон (SMS ≈ 0,75 BYN за код). Согласие с правилом «нет ключа восстановления — нет зашифрованных данных».
4. **Где сервер:** Беларусь (≈ 42–60 BYN в месяц), ЕС (≈ 18–23 BYN, но есть вопросы об оплате и передаче данных) или свой компьютер для опытов. Кто и чем платит.
5. **Деньги в приложении:** оставаться без денежных операций (учёт, напоминания, ссылки) или оформить ИП/юрлицо и подключить агрегатор ЕРИП или банк.
