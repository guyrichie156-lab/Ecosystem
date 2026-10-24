> Отчёт агента «Безопасность и юрист» от 2026-10-22. Не юридическая консультация: правовые пункты до запуска для посторонних проверяет юрист. Решения ждут пользователя — см. [[decisions]], 2026-10-24.

# «Хата»: безопасность и право — план на сейчас и на будущее супер-приложения

Дата: 2026-10-22. Агент: безопасность и право (команда 2). Отчёт продолжает [[research/auth-secrets]], [[research/fact-check-2]], [[proposals]] и [[pricing]] и не повторяет их: там, где тема уже разобрана, стоит ссылка на раздел.

**Как читать.** Ссылка без пометки — страницу или файл я открыл сам (curl к raw.githubusercontent.com и developer.android.com, файлы репозитория и `node_modules` — только чтение). «(по выдержке поиска)» — видел только сводку поисковика: сайты pravo.by, etalonline.by, cpd.by, ncip.by, wipo.int и support.google.com из облака закрыты (curl → 403, WebFetch → нет DNS). «Мнение» — моя оценка, а не факт. «Я не могу это подтвердить» — проверить не удалось. Трудоёмкость (Мнение): S — до полудня, M — 1–2 дня, L — от 3 дней.

> **Это не юридическая консультация.** Правовые пункты — ориентир, что спросить у юриста. Тексты законов я целиком не видел.

## Коротко
1. **Ключ подписи можно держать только на Windows-компьютере, ничего не собирая на нём.** Облако собирает APK как сейчас, а владелец переподписывает файл одной командой `apksigner`. Проверено на APK от 22.10 с пробным ключом: старая подпись снята, схемы v2 и v3, выравнивание 16 КБ в порядке, 1,7 с (раздел 1.1).
2. **Перед переходом обязателен экспорт данных, и Google-копия не поможет.** Android восстанавливает копию только при совпадении подписи (код AOSP, раздел 1.2). Кнопка «Экспорт» должна выйти **последней версией со старым ключом**, иначе старому приложению нечем выгрузить данные.
3. **SQLCipher в expo-sqlite SDK 57 есть** (подтвердил 22.10). Новая находка: `expo-sqlite/kv-store` открывает свою базу без ключа, поэтому рост, пол и год рождения останутся незашифрованными (раздел 1.3).
4. **Закон № 99-З:** пока данные только на телефоне, обязанностей оператора у разработчика, скорее всего, нет (Мнение). С появлением сервера нужны политика, ответственный, согласие (отдельное — на данные о здоровье), страна хостинга из перечня НЦЗПД и, возможно, запись в «Реестр операторов персональных данных» (раздел 4.1).
5. **Указ № 60 действует.** По выдержкам поиска, он касается юрлиц и ИП, которые продают через интернет. Бесплатное приложение физлица под него, скорее всего, не попадает (Мнение). Продажи и платежи — вопрос к юристу (раздел 4.2).
6. **Логотип выполнен в цветах флага** (`#D22730`, `#009739`, ромб). Сам флаг не воспроизведён, но до подачи на товарный знак логотип стоит показать патентному поверенному (раздел 4.3).
7. **Мессенджер «Мова»** — только на готовом проверенном протоколе. Push-уведомления без текста. Сначала нужен ответ юриста, какие обязанности в Беларуси несёт мессенджер (раздел 3).

## 1. Сейчас, до любого сервера

### 1.1 Свой ключ подписи на Windows — пошагово
Решение владельца (`decisions.md`, 19.10): ключ лежит и подписывает на его компьютере; переход — после экспорта и импорта. Почему отладочный ключ опасен — [[research/auth-secrets]], раздел 1 и угроза 7.

**Новое: подписывать можно без сборки на Windows.**
- `apksigner sign` «signs the provided APK, stripping out any pre-existing signatures». По умолчанию он заново выравнивает файл: нативные библиотеки — по 16384 байта, остальное — по 4 (`apksigner sign --help`, build-tools 36.0.0).
- Проверка (я сделал): `ecosystem-2026-10-22.apk` из ветки `apk` переподписан пробным ключом PKCS12. Результат `apksigner verify`: v2 — true, v3 — true, signers — 1; `zipalign -c -P 16 4` — OK. Пробный ключ удалён.
- Пароль по умолчанию запрашивается с клавиатуры (`stdin` — «the default behavior for --ks-pass», [apksigner](https://developer.android.com/tools/apksigner)). Он не попадает ни в файлы, ни в историю команд.

**Шаги (один раз).**
1. **Инструменты.** `keytool` входит в JDK. Если стоит Android Studio, подойдёт её `jbr` («JetBrains Runtime… Recommended», [JDKs](https://developer.android.com/build/jdks)). `apksigner` входит в build-tools: `sdkmanager "build-tools;36.0.0"` ([sdkmanager](https://developer.android.com/tools/sdkmanager)). SDK на Windows по умолчанию лежит в `%USERPROFILE%\AppData\Local\Android\SDK` ([Studio config](https://developer.android.com/studio/intro/studio-config)). Файл называется `apksigner.bat`.
2. **Папка.** Создать её **вне папки репозитория**, например `C:\Users\<имя>\hata-keys\`. Тогда `git add .` ключ не захватит. Мнение: проверить, что папка не синхронизируется с OneDrive.
3. **Создать ключ** (PowerShell, в этой папке; команда из [RN signed APK](https://raw.githubusercontent.com/facebook/react-native-website/main/docs/signed-apk-android.md)):
   ```
   keytool -genkeypair -v -storetype PKCS12 -keystore hata-release.p12 -alias hata -keyalg RSA -keysize 2048 -validity 10000
   ```
   - 10000 дней ≈ 27 лет. Android рекомендует от 25 лет, Google Play требует срок после 22.10.2033 ([auth-secrets], раздел 3.1).
   - У PKCS12 один пароль на всё. keytool пишет «Different store and key passwords not supported for PKCS12 KeyStores» (проверено на пробном ключе).
   - Пароль: длинный, из генератора менеджера паролей. В чат с Claude его не вставлять.
   - **Имя в сертификате (CN, O, L) видит любой, у кого есть APK**: `apksigner verify --print-certs` печатает DN (`notes/architecture.md`). Мнение: писать «CN=Hata», без ФИО, адреса и почты.
4. **Отпечаток.** `keytool -list -v -keystore hata-release.p12` → строку SHA-256 записать в `notes/` — это публичные данные. По ней проверяются будущие APK.
5. **Три копии + пароль отдельно** (Мнение):
   - (а) папка на ПК;
   - (б) вложение в менеджере паролей с зашифрованной базой (например, KeePassXC или Bitwarden);
   - (в) флешка с шифрованием, которая хранится дома.

   Пароль — в менеджере паролей и на бумаге в надёжном месте, но **не рядом с файлом**. Раз в полгода проверять копию командой `keytool -list` с этой копии.
6. **Цена ошибки.** Ключ потерян — обновить приложение поверх нельзя, только переустановка с экспортом. Ключ утёк — посторонний может выпускать «обновления» ([App signing](https://developer.android.com/studio/publish/app-signing)); тогда нужна ротация ([auth-secrets], П1).
7. **Никогда в Git.** Дополнить `.gitignore` (`*.p12`, `*.jks`, `*.keystore`, `keystore.properties` — полный список в [auth-secrets], раздел 6). Пароль не класть в `gradle.properties` проекта.

**Каждый выпуск.**
1. Скачать APK, собранный облаком.
2. Сверить хеш: `Get-FileHash .\hata-new.apk`. По умолчанию это SHA-256 ([Get-FileHash](https://raw.githubusercontent.com/MicrosoftDocs/PowerShell-Docs/main/reference/5.1/Microsoft.PowerShell.Utility/Get-FileHash.md)). Хеш должен совпасть с тем, что написал Claude. Чужой файл не подписывать.
3. Подписать:
   ```
   apksigner sign --ks C:\Users\<имя>\hata-keys\hata-release.p12 --ks-key-alias hata --out hata-2026-11-01.apk hata-new.apk
   apksigner verify -v --print-certs hata-2026-11-01.apk
   ```
   SHA-256 сертификата должен совпасть с записанным в шаге 4.
4. Поставить на телефон: кабель, Telegram «Избранное» или Диск.

Мнение: в ветке `apk` после перехода хранить только переподписанные файлы. Неподписанные облачные сборки не встанут поверх, но запутают.

**Альтернатива — подписывать в Gradle.** Блок `signingConfigs.release` плюс пароли в `%USERPROFILE%\.gradle\gradle.properties` ([RN](https://raw.githubusercontent.com/facebook/react-native-website/main/docs/signed-apk-android.md), [Expo local production](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/local-app-production.mdx)). Но папку `android/` стирает `prebuild --clean`, поэтому понадобится config plugin. Для сборки на Windows нужны JDK, SDK, NDK и CMake; в облаке одна сборка шла 11 мин 49 с (`notes/architecture.md`). Мнение: путь через `apksigner` проще, пока собирает облако.

### 1.2 Переход без потери данных
**Факты.**
- С другим ключом поверх не поставить, старую версию придётся удалить вместе с данными ([App signing](https://developer.android.com/studio/publish/app-signing)).
- **Копия Google не спасёт.** Восстановление запускается при установке («Data is restored whenever the app is installed… or by running adb install», [Auto Backup](https://developer.android.com/identity/data/autobackup)). Но AOSP перед этим сверяет подписи: `signaturesMatch()` → `isDataRestoreSafe()` ([BackupEligibilityRules.java](https://raw.githubusercontent.com/aosp-mirror/platform_frameworks_base/main/services/backup/java/com/android/server/backup/utils/BackupEligibilityRules.java)). Вывод из кода: копию, сделанную старой версией, в версию с новым ключом без ротации система не восстановит. На прошивке конкретного производителя — Я не могу это подтвердить.
- Ротация v3.1 сохраняет данные без переустановки ([auth-secrets], П1, раздел 3.1). Мнение: переустановка проще и понятнее, а экспорт всё равно нужен как резервная копия.

**Решение до перехода (владельцу).** Менять ли имя пакета `com.ecosystem.mobile` под «Хату»? Новое имя — тоже новое приложение, тоже переустановка. Мнение: поменять одновременно с ключом, тогда переносить данные придётся один раз. Имя пакета закрепляется за ключом при проверке разработчиков Google ([auth-secrets], раздел 5).

**План.**
1. Ветка `feature/backup`: «Экспорт» и «Импорт».
   - Копировать **обе** базы: `ecosystem.db` (счета, операции, замеры, тренировки, еда) и `ecosystem-settings.db` (профиль: рост, пол, год рождения; норма).
   - Согласованную копию даёт `backupDatabaseAsync` из expo-sqlite 57.0.1 (SQLite Online Backup API; `node_modules/expo-sqlite/src/SQLiteDatabase.ts`).
   - Файл шифруется AES-256-GCM (expo-crypto), ключ восстановления показывается один раз ([auth-secrets], П6 и раздел 4).
   - В файл записываются версия схемы и версия приложения; более новый файл импорт отклоняет.
2. Проверить на телефоне. Экспорт из рабочей версии → импорт в отдельную dev-установку `com.ecosystem.mobile.dev` (П1б) → сравнить число счетов, операций, замеров, продуктов и итоги месяца.
3. **Выпустить экспорт последней версией со старым ключом** — она встанет поверх, как обычно.
4. На телефоне: «Экспорт» → сохранить файл вне приложения (Загрузки, Диск, Telegram) → записать ключ восстановления → убедиться, что файл есть и не пустой.
5. Удалить старое приложение → поставить подписанное → «Импорт» → сверить цифры. Заново: разрешения Health Connect, виджет, разрешение на уведомления (Мнение: система их не перенесёт).
6. Мнение: файл экспорта держать неделю, затем удалить из облачных мест.

После перехода `pnpm android` с отладочным ключом поверх не встанет — нужен отдельный пакет `.dev` ([auth-secrets], П1б).

### 1.3 Данные в покое: SQLCipher
- **Поддерживается.** Параметр плагина `useSQLCipher` (по умолчанию `false`); «supports SQLCipher for Android, iOS, and macOS»; в Expo Go не работает; «Right after you open a database… `PRAGMA key`» ([sqlite.mdx v57](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/sqlite.mdx), открыт 22.10).
- **Новое.** `SQLiteStorage` (kv-store, expo-sqlite 57.0.1, `src/Storage.ts`) сам вызывает `openDatabaseSync(this.databaseName)`, и места для `PRAGMA key` там нет. Без ключа SQLCipher работает как обычный SQLite ([README](https://raw.githubusercontent.com/sqlcipher/sqlcipher/master/README.md)). Вывод: `ecosystem-settings.db` с ростом, полом и годом рождения останется открытым. Варианты: перенести профиль в основную базу или написать свой kv поверх зашифрованной базы.
- Ключ: 32 случайных байта в SecureStore без `requireAuthentication`, миграция через `sqlcipher_export` ([auth-secrets], раздел 3.5).
- Мнение: SQLCipher не защищает от подменённого APK с тем же ключом. Пока ключ публичный, польза от SQLCipher невелика; после своего ключа она заметнее. Поэтому сначала ключ, потом SQLCipher.

### 1.4 Резервное копирование Android (allowBackup)
Подробно — [auth-secrets], раздел 3.4. Варианты для приложения с деньгами и здоровьем:

| Вариант | Что происходит | Мнение |
|---|---|---|
| А. `allowBackup="false"` | В Google ничего не уходит. При потере телефона данные пропадут без ручного экспорта. На Android 12+ у части производителей перенос с телефона на телефон всё равно работает ([Auto Backup](https://developer.android.com/identity/data/autobackup)) | Слишком строго, пока нет экспорта |
| Б. `true` + `data_extraction_rules` с `disableIfNoEncryptionCapabilities="true"` | Копия уходит в облако, только если её можно зашифровать блокировкой экрана (Android 9+, сквозное шифрование PIN-кодом или паролем, лимит 25 МБ) | **Сейчас** (П5) |
| В. После SQLCipher | Базу исключить из облачной копии: ключ из Keystore не восстанавливается. Копия — только ручной зашифрованный экспорт | Когда включим SQLCipher |

### 1.5 Что нужно сейчас, а что позже
| Приоритет | Что | Почему |
|---|---|---|
| Сейчас | Свой ключ, экспорт и импорт, `.gitignore` | Закрывают главный риск (угрозы 2, 6, 7) и не дают потерять данные |
| Сейчас | Уведомления без сумм (П4), журнал без данных (П8; в `_layout.tsx` уже `describeError`) | Дёшево |
| Сейчас | Правила копирования (Б) | Конфигурация, S |
| До публикации | Политика конфиденциальности: экран для Health Connect (П9) и публичная страница (раздел 5) | Требование Play и Health Connect |
| Позже | SQLCipher, блокировка, скрытие в «Недавних» | Отложены владельцем 19.10. Мнение: обязательны, когда появятся «Сейф», «Мова» или платежи |

## 2. «Сейф» — хранение секретов в приложении
**Что понадобится** (Мнение, на фактах из [auth-secrets], раздел 3.2):
- **Отдельный ключ сейфа.** 256 бит из `getRandomBytes` (SecureRandom), хранится в SecureStore с `requireAuthentication: true`.
  - Факт: тогда нужна биометрия Class 3, в окне только «Отмена», без PIN-кода.
  - Факт: при смене отпечатков ключ становится недоступен.
  - Значит, восстановление обязательно (см. ниже).
- **Двойное шифрование записей.** Каждая запись шифруется AES-256-GCM (в expo-crypto 57 есть), поверх шифрования базы. В списке видны только названия; значение расшифровывается по нажатию.
- **Восстановление — один из двух вариантов:**
  - **ключ восстановления**: 256 случайных бит, показываются один раз текстом или QR. Он шифрует ключ сейфа. Выработка ключа из пароля (KDF) не нужна;
  - **мастер-пароль**: нужен Argon2id, минимум m=19 MiB, t=2, p=1 ([OWASP Password Storage](https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Password_Storage_Cheat_Sheet.md)). В expo-crypto 57 KDF нет, нужна нативная библиотека — это L.
- **Экран.** Автоблокировка через N секунд в фоне. FLAG_SECURE только на экранах сейфа, остальные скриншоты остаются, как хочет владелец (expo-screen-capture, П3).
- **Буфер обмена.** Android просит помечать секреты флагом `EXTRA_IS_SENSITIVE` («All apps must do this», [copy-paste](https://developer.android.com/develop/ui/views/touch-and-input/copy-paste)). В `ClipboardModule.kt` expo-clipboard sdk-57 слова «sensitive» нет ([исходник](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-clipboard/android/src/main/java/expo/modules/clipboard/ClipboardModule.kt)). Вывод: нужен свой нативный код и очистка буфера через 30–60 с (Мнение).
- **Нигде больше.** Секреты не попадают в виджет, уведомления, журнал, открытый экспорт и веб-версию (SecureStore не работает в вебе).

**Чего не обещать** (Мнение):
- «невзломаемо» и «банковский уровень»;
- «восстановим, если забыли»: без телефона и ключа восстановления данные пропадут, это свойство схемы;
- защиту от вредоноса с root или специальными возможностями и от человека, который знает PIN телефона.

Мнение: пароль от ключа подписи держать не в «Хате», а в отдельном менеджере паролей, чтобы не хранить всё в одном месте. Трудоёмкость «Сейфа»: L.

## 3. Когда появятся мессенджер «Мова» и аккаунты
**Модель угроз простыми словами.**

| Кто | Чего хочет | Что защищает |
|---|---|---|
| Взломщик сервера или нечестный админ | Прочитать переписку | Сквозное шифрование: на сервере только шифротекст |
| Тот, кто перехватывает трафик | То же | TLS плюс сквозное шифрование |
| Google, Apple, Expo (push) | Увидеть текст уведомлений | Push без текста |
| Укравший телефон | Читать чаты | Блокировка, Keystore, SQLCipher |
| Тот, кто подменил ключ собеседника | Читать как «посредник» | Сверка кодов безопасности и предупреждение о смене ключа |
| Спамеры и мошенники | Рассылки, фишинг | Лимиты, жалобы, блокировка отправителя |
| Требование госорганов | Выдать данные | Минимум данных на сервере; правовой статус — вопрос юристу (ниже) |

**Требования к сквозному шифрованию** (Мнение, если не указано иное):
- Только готовый проверенный протокол, своя криптография запрещена. Варианты:

| Библиотека | Протокол | Лицензия | Что важно |
|---|---|---|---|
| [libsignal](https://raw.githubusercontent.com/signalapp/libsignal/main/README.md) | Signal | AGPL-3.0 ([LICENSE](https://raw.githubusercontent.com/signalapp/libsignal/main/LICENSE)) | «Use outside of Signal is unsupported»; есть Java, Swift и TypeScript, для RN нужен свой нативный модуль. Мнение: AGPL требует открывать код, в том числе сервера, — спросить юриста до коммерции |
| [vodozemac](https://raw.githubusercontent.com/matrix-org/vodozemac/main/README.md) | Olm/Megolm (Matrix) | Apache-2.0 ([Cargo.toml](https://raw.githubusercontent.com/matrix-org/vodozemac/main/Cargo.toml)) | Один аудит Least Authority «with no significant findings» |
| [OpenMLS](https://raw.githubusercontent.com/openmls/openmls/main/README.md) | MLS, RFC 9420 | MIT ([Cargo.toml](https://raw.githubusercontent.com/openmls/openmls/main/openmls/Cargo.toml)) | Протокол для групп |

- **Ключи.** Создаются на телефоне, закрытые ключи его не покидают. У каждого устройства свои ключи. Коды безопасности сверяются по QR; о смене ключа собеседника приложение предупреждает.
- **История.** На новом телефоне — только из копии, зашифрованной ключом восстановления (та же схема, что в разделе 2).
- **Минимум данных на сервере:**
  - сообщение хранится до доставки, потом удаляется;
  - контакты не загружаются открыто;
  - метаданных как можно меньше. Пример: Signal прячет от сервера отправителя («sealed sender», [The Hacker News](https://thehackernews.com/2018/10/signal-secure-messaging-metadata.html), по выдержке поиска).
- **Журналы сервера.** Не писать в них токены, ключи, данные о здоровье, карты и пароли ([OWASP Logging](https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Logging_Cheat_Sheet.md)). Текст сообщений не писать никогда. Задать срок хранения; IP-адреса считать персональными данными (Мнение).
- **Push.**
  - Expo не хранит содержимое уведомлений, но «may be seen by Expo staff» при отладке. Сервис Expo не обязателен, можно слать напрямую через FCM ([Expo push FAQ](https://raw.githubusercontent.com/expo/expo/main/docs/pages/push-notifications/faq.mdx)).
  - FCM поддерживает пустой «пинг», после которого приложение само забирает данные ([FCM](https://firebase.google.com/docs/cloud-messaging/concept-options), по выдержке поиска).
  - Мнение: push только «разбудить», текст расшифровывается на телефоне. На экране блокировки по умолчанию «Новое сообщение».
- **Аккаунты.** SMS-коды — самая дорогая статья у Signal ([[pricing]]). Мнение: начать с passkeys или e-mail через готового провайдера ([auth-secrets], раздел 4).
- **Платежи.** Мнение: номер карты не должен проходить через наш сервер — только SDK или страница партнёра. Реестр платёжных поставщиков — в [[pricing]].
- **Дети.** Ресурс с данными людей младше 16 лет попадает в «Реестр операторов» (раздел 4.1). Мнение: возраст 16+.
- **Право.** Обязанности мессенджера в Беларуси (идентификация пользователей, хранение, выдача данных) — **Я не могу это подтвердить**. Поиск нашёл только обязанность поставщиков интернет-услуг идентифицировать устройства по Указу № 60 ([etalonline](https://etalonline.by/document/?regnum=P31000060), по выдержке поиска). Мнение: ответ юриста нужен **до** проектирования: сквозное шифрование может противоречить местным требованиям.

## 4. Право Беларуси (только найденное)

### 4.1 Закон № 99-З «О защите персональных данных»
- **Сфера действия.** По п. 2 ст. 2 закон не применяется к обработке физлицами «исключительно личного, семейного, домашнего и иного подобного» использования, не связанного с профессиональной или предпринимательской деятельностью ([etalonline](https://etalonline.by/document/?regnum=h12100099), по выдержке поиска).
  - Мнение: пока данные других людей лежат только на их телефонах, разработчик их не получает.
  - Исключение — Open Food Facts: туда уходит штрих-код и IP-адрес телефона, напрямую, не через нас.
  - Является ли распространение такого приложения «обработкой» — Я не могу это подтвердить.
- **Редакция.** Действует с изменениями Закона от 16.03.2026 № 134-З (в силе с 21.03.2026). В 2026 году готовится ещё один законопроект ([etalonline](https://etalonline.by/document/?regnum=H12100099), [dazor.by](https://dazor.by/news/otraslevye-novosti/zakon-o-personalnyx-dannyx-v-belarusi-cto-izmenitsia-dlia-biznesa-v-2026-godu), [e-sud.by](https://e-sud.by/useful/blog/ob-izmenenii-zakonov-po-voprosam-zashchity-personalnyh-dannyh), по выдержке поиска). Перед запуском сервера сверить текст.
- **Когда появится сервер: обязательные меры по п. 3 ст. 17** ([cpd.by «Меры по защите»](https://cpd.by/zachita-personalnyh-dannyh/operatoru/mery-po-zashchite/), [постатейный комментарий НЦЗПД](https://cpd.by/pravovaya-osnova/metodologicheskiye-dokumenty-rekomendatsii/postatejnyj-kommentarij-k-zakonu-respubliki-belarus-o-zashhite-personalnyh-dannyh/), по выдержке поиска):
  - назначить лицо, ответственное за внутренний контроль обработки;
  - издать документ о политике обработки и обеспечить к нему неограниченный доступ;
  - знакомить и обучать тех, кто обрабатывает данные.

  Общие обязанности оператора — ст. 16 ([ilex.by](https://ilex.by/zapros-personalnyh-dannyh-tretim-litsom-otkazat-ili-predostavit/), по выдержке поиска). Техническую и криптографическую защиту регулирует Положение ОАЦ (приказ № 66, новая редакция с 01.03.2025 по приказу № 259, [ilex.by](https://ilex.by/news/oats-obnovil-s-1-marta-ryad-dokumentov-v-oblasti-informatsionnoj-bezopasnosti/), по выдержке поиска). Классы систем и что именно нужно физлицу или ИП — Я не могу это подтвердить.
- **Согласие.**
  - Форма — письменная, электронный документ или «иное утвердительное действие в электронной форме».
  - Активное действие; заранее поставленные галочки — нарушение; согласие нельзя связывать с принятием договора ([cpd.by «Согласие»](https://cpd.by/zachita-personalnyh-dannyh/grajdaninu/soglasiye-na-obrabotku-personalnykh-dannykh/), по выдержке поиска).
  - Данные о здоровье — специальные персональные данные ([auth-secrets], раздел 4). Точный текст ст. 8 я не видел. Мнение: отдельное явное согласие на здоровье.
- **Передача за границу (ст. 9).**
  - В перечень стран с надлежащей защитой входят стороны Конвенции Совета Европы о защите персональных данных (приказ директора НЦЗПД от 15.11.2021 № 14, [cpd.by](https://cpd.by/zachita-personalnyh-dannyh/operatoru/transgranichnaya-peredacha/), по выдержке поиска); позже добавлены Казахстан и Кыргызстан ([neg.by](https://neg.by/novosti/otkrytj/dopolneny-pravila-transgranichnoy-peredachi-personalnykh-dannykh/), по выдержке поиска).
  - В другие страны — с информированием о рисках или с разрешением НЦЗПД.
  - Мнение: сервер — в Беларуси или в стране из актуального перечня на cpd.by. Входит ли туда страна выбранного хостинга — проверить на дату выбора.
- **Регистрация.** Общей регистрации всех операторов в найденных материалах нет. С 01.01.2024 работает «Реестр операторов персональных данных» (приказ ОАЦ от 01.06.2022 № 94, [pravo.by](https://pravo.by/novosti/obshchestvenno-politicheskie-i-v-oblasti-prava/2023/october/75676/), [REVERA](https://belarus.revera.legal/news-and-analytical-materials/reestr-operatorov-personalnyx-dannyx-v-belarusi/), [ilex.by](https://ilex.by/news/reestr-operatorov-personalnyh-dannyh-opredelen-perechen-svedenij/), по выдержке поиска).
  - Туда вносят системы, где есть: передача специальных данных в страны без надлежащей защиты; биометрия или генетика; данные людей младше 16 лет; данные более 100 тыс. человек. Источники расходятся в деталях.
  - Срок — 10 рабочих дней после ввода системы в эксплуатацию. Среди сведений — где стоят серверы.

### 4.2 Локализация данных: Указ № 60
- Действует. Есть редакция по состоянию на 14.02.2023 ([continent-online](https://continent-online.com/Document/?doc_id=30561833&show_di=1), по выдержке поиска). В феврале 2026 года организациям начали предъявлять требования Указа о почте на серверах в Беларуси и в доменах .by и .бел ([hb.by](https://hb.by/articles/inostrannaya-pochta-belarus-ukaz-60), по выдержке поиска).
- Суть по выдержкам поиска: юрлица и ИП, которые продают товары, работы и услуги в Беларуси через интернет, используют ресурсы национального сегмента, размещённые в Беларуси и зарегистрированные в установленном порядке. По комментарию юриста, сервер должен физически стоять в Беларуси ([dev.by](https://devby.io/news/kakim-dolzhen-byt-domen-u-belorusskogo-internet-magazina), по выдержке поиска). Штраф — 10–30 базовых величин, ч. 1 ст. 22.16 КоАП ([cloudvps.by](https://client.cloudvps.by/knowledgebase/16/otvetstvennost-za-narushenie-ukaza-60.html), по выдержке поиска).
- Мнение: бесплатное приложение физлица без продаж, скорее всего, не затронуто. Платная версия как ИП (RuStore — только ИП и юрлица, [[pricing]]) или платежи — повод спросить юриста, касается ли требование сервера приложения, а не только сайта магазина.

### 4.3 Имя «Хата», «Мова» и логотип
- **Как искать.** Бесплатная база НЦИС: [search.ncip.by](https://search.ncip.by/database/index.php?pref=tz&lng=ru&page=1), поиск по названию, номеру, классу МКТУ и владельцу. Платный поиск делает сам НЦИС ([ncip.by](https://www.ncip.by/uslugi-i-informaciya/patentno-informacionnye-uslugi/tovarnye-znaki-i-znaki-obsluzhivaniya/)). База — только национальная, международные знаки нужно смотреть отдельно в базе ВОИС ([e-sud.by](https://e-sud.by/useful/blog/reestr-i-baza-tovarnyh-znakov-kak-iskat-svoi-i-chuzhie-brendy), по выдержке поиска).
- **Что проверить** (Мнение):
  - написание: «Хата», «Hata», «Khata», «Chata», «Мова», «Mova»;
  - классы МКТУ: 9 (программы), 38 (связь), 42 (ИТ-услуги), 36 (финансы).
- **Государственные символы.** Ст. 4 Закона № 2181-XII — «Абсолютные основания для отказа»: государственная символика допускается только как неохраняемый элемент с согласия компетентного органа ([kodeksy-bel.com](https://kodeksy-bel.com/zakon_rb_o_tovarnyh_znakah_i_znakah_obsluzhivaniya/4.htm), [ilex.by](https://ilex.by/ispolzovanie-gosudarstvennoj-simvoliki-i-ofitsialnogo-nazvaniya-respubliki-belarus-v-tovarnyh-znakah/), [WIPO Lex](https://www.wipo.int/wipolex/ru/legislation/details/22312), по выдержке поиска). Порядок согласия на герб, флаг и сходные обозначения утвердил Совмин ([etalonline](https://etalonline.by/novosti/korotko-o-vazhnom/sovmin-utverdil-poryadok-ispolzovaniya-oboznacheniy-gerba-i-flaga-v-tovarnykh-znakakh/), по выдержке поиска). Сами символы определяет Закон № 301-З ([WIPO Lex](https://www.wipo.int/wipolex/en/legislation/details/20666), по выдержке поиска).
- **Наш знак** — красный дом `#D22730` с ромбом `#009739`. Цвета взяты из таблицы флага, сам флаг не воспроизведён (коммит `c133b52`, `assets/brand/README.md`). Мнение: риск «сходного обозначения» невелик, но красно-зелёная пара с ромбом-орнаментом может напомнить экспертизе флаг. До подачи заявки — к патентному поверенному. Для «Мовы» («язык») в классе 38 есть риск отказа за отсутствие различительной способности (ст. 4 п. 1.1 — «не имеющих признаков различия», по выдержке поиска). Это Мнение: оценку делает экспертиза.

### 4.4 Google Play и RuStore
- **Health apps declaration** заполняют все опубликованные приложения, даже без функций здоровья. Политика действует с 31.05.2024 ([справка 14738291](https://support.google.com/googleplay/android-developer/answer/14738291), по выдержке поиска).
- **Health Connect** ([publish](https://developer.android.com/health-and-fitness/health-connect/publish), открыт 22.10):
  - заполнить Data safety и форму Health apps;
  - «Request the minimum data types needed»;
  - на странице в Play — «the same privacy policy that is displayed… in Health Connect»;
  - при смене типов данных форма заполняется заново.
- **Financial features declaration** обязательна для всех приложений («Финансы», будущие платежи) ([справка 13849271](https://support.google.com/googleplay/android-developer/answer/13849271?hl=en), по выдержке поиска).
- **Политика конфиденциальности** — по открытому адресу, не PDF ([[pricing]], справка 13996823).
- **RuStore:** по выдержкам из блогов о модерации, политику запрашивают по постоянной ссылке и проверяют обоснованность разрешений ([блог RuStore](https://www.rustore.ru/developer/blog/moderaciya-v-rustore-trebovaniya-sroki-i-etapy-proverki), по выдержке поиска). Официальные правила я не видел — Я не могу это подтвердить.

## 5. Политика конфиденциальности — черновик
> **ЧЕРНОВИК. Должен проверить юрист.** Составлен по коду ветки `feature/brand` (22.10). Поля в [скобках] заполнить.

**Политика конфиденциальности приложения «Хата»**. Действует с [дата]. Разработчик: [имя или псевдоним], связь: [адрес].

1. **Коротко.** «Хата» хранит ваши данные только на вашем телефоне. У приложения нет сервера и аккаунтов. Нет рекламы, аналитики и сбора статистики: в зависимостях нет SDK рекламы, аналитики или отчётов о сбоях (`package.json`).
2. **Что хранится на телефоне:**
   - «Финансы»: счета, операции, категории, бюджеты, заметки;
   - «Здоровье»: вес, замеры тела, рост, пол, год рождения, тренировки;
   - «Еда»: продукты, записи о еде, норма калорий.

   Разработчик эти данные не получает и не видит.
3. **Health Connect.**
   - Только с вашего разрешения приложение **читает** вес и рост, чтобы показать их в «Здоровье».
   - В Health Connect ничего не записывает и никому не передаёт.
   - Разрешение можно отозвать в настройках Health Connect. Уже прочитанные значения остаются в приложении, пока вы их не удалите или не удалите приложение.
4. **Камера.** Нужна только для сканирования штрих-кода. Снимки не сохраняются и не отправляются: используется только распознанный код (`onBarcodeScanned`, `ScanScreen.tsx`).
5. **Open Food Facts.**
   - При сканировании приложение отправляет штрих-код в Open Food Facts (`world.openfoodfacts.org`), чтобы получить состав продукта.
   - Вместе с запросом уходят обычные технические данные любого интернет-запроса: IP-адрес и название приложения.
   - Другие данные не отправляются. У Open Food Facts своя политика: [ссылка]. Без сканера приложение в интернет не ходит. Ссылки на источники открываются в браузере только по вашему нажатию.
6. **Уведомления** создаются на самом телефоне. **Виджет** показывает баланс на главном экране — его видит любой, кто смотрит на экран.
7. **Резервные копии.**
   - Android может копировать данные приложения в ваш Google-аккаунт, если у вас включено резервное копирование. На Android 9+ копия зашифрована блокировкой экрана. [Уточнить после правил копирования.]
   - Файл «Экспорт» создаёте и храните вы сами.
8. **Как удалить данные.** Удалите приложение — данные удалятся с телефона. Файлы экспорта удалите сами. Копию Google — в настройках Google-аккаунта.
9. **Дети.** Приложение не предназначено для детей младше [16] лет.
10. **Изменения.** Новую версию политики публикуем по этому же адресу с датой.
11. **Правовая основа и ваши права** — [заполнить юристу: Закон № 99-З].

Мнение: разместить политику страницей GitHub Pages публичного репозитория (открытый адрес, не PDF), а тот же текст — на экране «Конфиденциальность» для Health Connect (П9).

## 6. Топ-10 действий по порядку
| № | Действие | Труд. | Решение владельца |
|---|---|---|---|
| 1 | Решить имя пакета: оставить `com.ecosystem.mobile` или новое под «Хату» — до перехода на ключ | S | **да** |
| 2 | Ветка `feature/backup`: зашифрованный экспорт и импорт **обеих** баз, ключ восстановления; выпустить последней версией со старым ключом | M–L | **да** (куда сохранять, готов ли хранить ключ восстановления) |
| 3 | Создать ключ на Windows (1.1), три копии, отпечаток SHA-256 — в `notes/` | S | **да** (делает сам) |
| 4 | Переход: экспорт → удаление → установка переподписанного APK → импорт → сверка → Health Connect и виджет заново | S | **да** |
| 5 | `.gitignore` для ключей, баз и экспорта; ключ вне папки репозитория; коммиты с адресом noreply | S | нет (noreply — да) |
| 6 | Правила копирования, вариант Б (1.4) | S | **да** (Google-копия: да или нет) |
| 7 | Политика конфиденциальности: публичная страница и экран для Health Connect (П9) по черновику раздела 5 | M | **да** (имя, контакт) |
| 8 | Уведомления без сумм (П4) и проверка, что в журнал не попадают данные (П8) | S | нет |
| 9 | Проверить «Хата», «Мова» и логотип в search.ncip.by и в базе ВОИС; перед заявкой — патентный поверенный | S / M | **да** |
| 10 | До любого сервера («Мова», синхронизация, платежи) — юрист: 99-З (политика, ответственный, согласие на здоровье, страна хостинга, реестр ОАЦ), Указ № 60, обязанности мессенджера, AGPL | M | **да** |

Дальше (L, по решению владельца): SQLCipher с переносом профиля из kv-store, блокировка, «Сейф» (раздел 2), «Мова» на vodozemac или OpenMLS (раздел 3).

## Источники
Открыты мной 22.10: [sqlite.mdx v57](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/sqlite.mdx), [apksigner](https://developer.android.com/tools/apksigner), [command-line signing](https://developer.android.com/build/building-cmdline), [page sizes](https://developer.android.com/guide/practices/page-sizes), [sdkmanager](https://developer.android.com/tools/sdkmanager), [JDKs](https://developer.android.com/build/jdks), [Studio config](https://developer.android.com/studio/intro/studio-config), [Auto Backup](https://developer.android.com/identity/data/autobackup), [AOSP BackupEligibilityRules](https://raw.githubusercontent.com/aosp-mirror/platform_frameworks_base/main/services/backup/java/com/android/server/backup/utils/BackupEligibilityRules.java), [Health Connect publish](https://developer.android.com/health-and-fitness/health-connect/publish), [copy-paste](https://developer.android.com/develop/ui/views/touch-and-input/copy-paste), [RN signed APK](https://raw.githubusercontent.com/facebook/react-native-website/main/docs/signed-apk-android.md), [Expo local production](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/local-app-production.mdx), [Expo push FAQ](https://raw.githubusercontent.com/expo/expo/main/docs/pages/push-notifications/faq.mdx), [expo-clipboard](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-clipboard/android/src/main/java/expo/modules/clipboard/ClipboardModule.kt), [Get-FileHash](https://raw.githubusercontent.com/MicrosoftDocs/PowerShell-Docs/main/reference/5.1/Microsoft.PowerShell.Utility/Get-FileHash.md), OWASP [Password Storage](https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Password_Storage_Cheat_Sheet.md) и [Logging](https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Logging_Cheat_Sheet.md), libsignal [README](https://raw.githubusercontent.com/signalapp/libsignal/main/README.md) и [LICENSE](https://raw.githubusercontent.com/signalapp/libsignal/main/LICENSE), [vodozemac](https://raw.githubusercontent.com/matrix-org/vodozemac/main/README.md), [OpenMLS](https://raw.githubusercontent.com/openmls/openmls/main/README.md).

Локально (только чтение): `apksigner sign --help` и `zipalign` из build-tools 36.0.0; пробная подпись `ecosystem-2026-10-22.apk`; `keytool` (PKCS12); `node_modules/expo-sqlite` 57.0.1 (`src/Storage.ts`, `src/SQLiteDatabase.ts`); ветка `feature/brand`: `app.json`, `packages/db/src/*`, `packages/food/src/lib/openFoodFacts.ts`, `ScanScreen.tsx`, `package.json`, `assets/brand/*`.

По выдержке поиска: все правовые ссылки раздела 4, справки Google Play и RuStore, FCM, The Hacker News.

Не удалось проверить: полные тексты Закона № 99-З, приказов ОАЦ № 66, 94 и НЦЗПД № 14, Указа № 60, Законов № 2181-XII и № 301-З; политику Open Food Facts; обязанности мессенджеров в Беларуси.
