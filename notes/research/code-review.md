# Ревью кода Ecosystem

> Отчёт агента-ревьюера о коде на коммите `88726de` (ветка `feature/finance-redesign`), то есть **до чистки**. Строки в ссылках вида `файл:строка` относятся к тому коммиту. Что исправлено, а что нет — в [[decisions]], запись 2026-10-19 «ревью кода и чистка»; исправления — в ветке `feature/code-cleanup`.

Ветка `feature/finance-redesign` (коммит `88726de`), 2026-10-19. Проверено всё: `apps/mobile`, `packages/*`, `notes/`, история Git. Это примерно 4,8 тыс. строк TS/JS, из них 390 строк — тесты.
Запущено: `pnpm test` — 39 тестов, все прошли (core 3, finance 18, health 18). `pnpm typecheck` — без ошибок в обоих вариантах (обычном и Android). В проекте ничего не менялось.

Пометки: «Мнение» — моя оценка, а не правило из документации. «проверить» — подтвердить замером или на телефоне.

## 1. Итог в 5 строках

1. **Это не спагетти.** Слои понятные: маршрут → экран из пакета → функции `lib/` → база `packages/db`. Модули друг друга не импортируют (проверено поиском). Самый длинный файл — 273 строки (`TransactionFormScreen.tsx`).
2. **Сильные стороны.** Деньги хранятся целыми копейками. Расчёты вынесены в чистые функции и покрыты тестами. Комментарии объясняют «почему». Нет ни одного `any` и `@ts-ignore`.
3. **Одна настоящая ошибка.** В кольцевой диаграмме шестая категория рисуется без цвета (проверено запуском кода). Стандартных категорий расходов как раз шесть.
4. **Главные слабости.**
   - Ошибки базы данных пользователь не видит: экран бесконечно «грузится» или «ничего не произошло».
   - Три экрана «Финансов» ходят в базу напрямую и берут старые копии хуков.
   - Одинаковые кнопки и «чипы» скопированы по файлам.
5. **Счёт и прочее.** Важность: высокая — 1, средняя — 8, низкая — 14. Сообщения коммитов хорошие, но ветки идут «стопкой», `main` давно не обновлялась, часть заметок отстала от кода.

## 2. Карта проекта простыми словами

```
apps/mobile/                  оболочка приложения
  index.js, app-entry.js      вход; app-entry регистрирует Android-виджет «Баланс»
  modules.ts                  список модулей = вкладки внизу
  app/_layout.tsx             миграции базы → prepare модулей → экраны; потом onReady
  app/(tabs)/_layout.tsx      вкладки строятся по modules.ts
  app/(tabs)/finance/*.tsx    маршруты «Финансов»: 1–3 строки, отдают экран из пакета
  app/(tabs)/health/*.tsx     то же для «Здоровья»
packages/core/                общее: тип AppModule, тема, TextField, SegmentedControl,
                              useAsyncData / useRefreshOnFocus, экран «ошибка в модуле», niceTicks
packages/db/                  таблицы (src/schema.ts), подключение (src/client.ts), миграции (drizzle/)
packages/finance/src/
  screens/                    экраны: главный, форма записи, счета, бюджеты
  components/                 вкладки Записи / Графики / Отчёты, диаграммы, календарь
  lib/                        деньги, даты, запросы к базе, расчёты, уведомления
  widget/                     Android-виджет
packages/health/src/          так же: screens, components, lib (замеры, подсказки, Health Connect)
notes/                        память проекта (Obsidian)
```

**С чего начать чтение:**
1. `apps/mobile/modules.ts`.
2. `packages/finance/src/module.ts`.
3. `packages/finance/src/screens/FinanceScreen.tsx`.

Проще всего читаются чистые функции: `lib/records.ts`, `lib/chartData.ts`, `lib/period.ts`, `lib/money.ts`. Рядом лежат тесты — это готовые примеры, как ими пользоваться.

**Словарик для чтения кода**
- **Модуль** — пакет с одной функцией приложения («Финансы», «Здоровье») и своей вкладкой. Описывается типом `AppModule` (`packages/core/src/types.ts:7-19`).
- **Маршрут** — файл в `apps/mobile/app/`. Путь к файлу и есть адрес экрана (так работает expo-router).
- **Компонент** — функция, которая возвращает кусок интерфейса (например, `RecordsTab`).
- **Хук** — функция React с именем `use…`. Она хранит состояние или запускает действия внутри компонента (`useState`, `useAsyncData`).
- **Эффект** (`useEffect`) — код, который выполняется после отрисовки, например загрузка из базы. Возвращаемая им функция «уборки» отменяет начатое, если экран закрыли.
- **Чистая функция** — результат зависит только от входных данных, без базы и без экрана. Такие функции легче всего тестировать.
- **drizzle** — библиотека, через которую код пишет запросы к SQLite на TypeScript.
- **Миграция** — SQL-файл, который меняет устройство базы при обновлении приложения и не теряет данные (`packages/db/drizzle/*.sql`).
- **ErrorBoundary** — «предохранитель»: если экран упал при отрисовке, вместо него показывается запасной экран, а не падает всё приложение.
- **Минимальные единицы** — суммы хранятся целыми копейками: 12,50 BYN = 1250.

**Запуск приложения**
1. `apps/mobile/index.js` вызывает `app-entry.js:1-4`. Тот загружает expo-router и регистрирует обработчик виджета.
2. `apps/mobile/app/_layout.tsx:44`: `useMigrations` применяет миграции из `packages/db/drizzle/`.
3. `_layout.tsx:50-52`: приложение ждёт `prepare` всех модулей. «Финансы» в этот момент создают стандартные категории (`packages/finance/src/seed.ts:15-19`).
4. Затем в фоне идёт `onReady`: запрос разрешения на уведомления и импорт из Health Connect.
5. `app/(tabs)/_layout.tsx` строит вкладки по `modules.ts`.
6. У каждого модуля свой `_layout.tsx` с `ErrorBoundary`. Если модуль упал при отрисовке, остальные вкладки продолжают работать.

**Что происходит при нажатии «Сохранить» (новая запись в «Финансах»)**
1. Кнопка «+» — `packages/finance/src/screens/FinanceScreen.tsx:49`. Это ссылка на `/finance/add-transaction`.
2. Маршрут `apps/mobile/app/(tabs)/finance/add-transaction.tsx` просто отдаёт `AddTransactionScreen`. Он ведёт в `TransactionFormScreen.tsx:32`, а оттуда в общую форму `TransactionForm` (`:40`).
3. Форма загружает счета и категории (`:44-51`). То, что ввёл пользователь, лежит в `useState`.
4. Нажатие «Сохранить» вызывает `handleSave` (`:94`):
   - текст «12,50» превращается в 1250 копеек (`lib/money.ts:25-33`, вызов на `:96`);
   - проверяются сумма, счёт и получатель перевода;
   - по выбранному дню вычисляется время записи (`lib/period.ts:39-43`, вызов на `:122`).
5. `addTransaction` (`lib/transactions.ts:51-53`) через drizzle добавляет строку в таблицу `transactions` (`packages/db/src/schema.ts:26`). Таблица лежит в файле `ecosystem.db` (`packages/db/src/client.ts:7-11`).
6. `runAfterTransactionChange` (`lib/notifications.ts:80-85`) делает две вещи параллельно:
   - обновляет виджет (`widget/updateWidget.tsx:8-15`);
   - проверяет бюджет и баланс (`notifications.ts:45-74`).
   
   Если здесь что-то сломается, это только запишется в лог и не помешает сохранению.
7. `router.back()` (`TransactionFormScreen.tsx:136`) закрывает форму.
8. Вкладка «Записи» снова получает фокус. `useRefreshOnFocus` (`RecordsTab.tsx:55`, код в `packages/core/src/useAsyncData.ts:34-45`) вызывает `refresh`.
9. Заново выполняется `getTransactionsBetween` (`lib/transactions.ts:22-42`). Результат проходит через `summarize` и `groupByDay` (`RecordsTab.tsx:58-59`), и `SectionList` (`:64`) показывает новую строку.

**Тот же путь в «Здоровье» — для сравнения.** Схема та же, поэтому, разобрав одну, легко читать другую.
1. «+ Новый замер» (`packages/health/src/screens/HealthHomeScreen.tsx:79`) открывает `AddMeasurementScreen`.
2. `handleSave` (`packages/health/src/screens/AddMeasurementScreen.tsx:15`) разбирает каждое поле через `parseMeasurement` (`:21`): «82,5 кг» превращается в 82500 граммов, а значения вне допустимого диапазона отсекаются.
3. `addCheckIn` (`:33`, код в `packages/health/src/lib/measurements.ts:5-13`) пишет строки в таблицу `body_measurements` (`packages/db/src/schema.ts:69`).
4. `router.back()` (`:34`) возвращает на главный экран «Здоровья».
5. `useRefreshOnFocus` (`HealthHomeScreen.tsx:47`) перечитывает последние замеры (`getLatestMeasurements`, `measurements.ts:26`) и заново считает подсказки (`getHealthTips`, `packages/health/src/lib/tips.ts:146`, вызов на `HealthHomeScreen.tsx:45`).

## 3. Находки

Пути ниже без `packages/finance/src/`, если файл из «Финансов»; остальные пути указаны полностью или с именем пакета.

| № | Важность | Файл:строка | Что не так | Почему это плохо (просто) | Как исправить |
|---|---|---|---|---|---|
| 1 | высокая | `lib/chartData.ts:14`; `components/CategoryDonut.tsx:19-20`; `packages/core/src/theme.ts:68, 97` | `foldCategories` оставляет до 6 категорий без свёртки, а цветов в палитре 5. Шестая категория получает цвет `undefined`. Я проверил: запустил `foldCategories` на 6 стандартных категориях из `seed.ts:5-11`. | Если в месяце были траты во всех шести категориях (обычный случай), в кольце будет пустой разрыв, а у строки в списке не будет цветной метки и полоски. Тест `chartData.test.ts:7` закрепляет «до 6 без свёртки», но цвета не проверяет. | Сворачивать, как только категорий больше, чем цветов (5 цветов + серые «Остальные»). Другой вариант — добавить 6-й проверенный цвет в обе темы. И добавить тест: у каждого сегмента, кроме «Остальных», индекс меньше числа цветов. |
| 2 | средняя | `hooks/useAsyncData.ts:1-27`, `hooks/useRefreshOnFocus.ts:1-20` — копии `packages/core/src/useAsyncData.ts:5-45`. Копии используют `screens/AccountsScreen.tsx:5-6`, `BudgetsScreen.tsx:6`, `TransactionFormScreen.tsx:6`. Заметка `notes/decisions.md:67` | Есть два одинаковых набора хуков. Новые вкладки берут их из `core`, три старых экрана — из локальной копии. В заметке записано «объединить после слияния веток»: ветки слиты, а объединение так и не сделано. | Исправление в одной копии не попадёт в другую (например, обработка ошибок из п. 3). Новичку непонятно, какой хук «настоящий». | Перевести три экрана на `@ecosystem/core`, удалить `packages/finance/src/hooks/`, отметить это в `decisions.md`. |
| 3 | средняя | `packages/core/src/useAsyncData.ts:12-18` | У `fetcher().then(...)` нет `.catch`. Если запрос упал, `loading` навсегда остаётся `true`, а ошибка пропадает. Кроме того, `loading` включается при каждом возврате на экран (`:12` вместе с `useRefreshOnFocus`), поэтому каждый раз крутится индикатор обновления. Это заметили и в дизайн-заметках базовой ветки (`notes/research/design.md:388`). | При сбое базы экран бесконечно «грузится» и ничего не объясняет. `ErrorBoundary` модуля такую ошибку не поймает: по документации React границы ошибок не ловят асинхронный код и обработчики событий. | Хук должен возвращать `error`; ловить ошибку через `.catch` и показывать её текст. Разделить первую загрузку (`loading`) и фоновое обновление (`refreshing`). |
| 4 | средняя | `TransactionFormScreen.tsx:125-139, 149-157`; `AccountsScreen.tsx:46-59`; `BudgetsScreen.tsx:46-59`; `packages/health/src/screens/AddMeasurementScreen.tsx:31-37`; `packages/health/src/screens/MeasurementDetailScreen.tsx:54-58`; `packages/health/src/components/HealthConnectCard.tsx:35-45` | Сохранение и удаление обёрнуты в `try { … } finally { … }` без `catch`. В `MeasurementDetailScreen` нет и `try`. | Если запись в базу не удалась, кнопка просто снова станет активной. Пользователь не узнает, сохранилась ли запись: может ввести её дважды или решить, что она есть. | Добавить `catch` с сообщением под формой: поле `error` в формах уже есть. Правильный образец — `HealthConnectCard.tsx:27-28`. |
| 5 | средняя | `TransactionFormScreen.tsx:5, 46-47`; `AccountsScreen.tsx:4, 23, 48-53`; `BudgetsScreen.tsx:4-5, 21, 48-53` | Эти экраны сами пишут запросы drizzle (`db.select`, `db.insert`). Для остальных данных есть функции в `lib/` (`lib/transactions.ts`, `lib/balance.ts`). | Правила работы с данными (какие счета показывать, что записывать) расползаются по экранам. Чтобы понять, что пишется в базу, приходится читать код интерфейса. «Мнение»: экран должен только вызывать функции. | Завести `lib/accounts.ts`, `lib/budgets.ts`, `lib/categories.ts` с функциями вроде `getAccounts` и `createAccount`; экраны будут вызывать их. |
| 6 | средняя | Фильтр «счёт не в архиве» есть в `lib/balance.ts:10, 44, 55, 61, 75` и `lib/stats.ts:20, 40, 51`. Его нет в `lib/transactions.ts:22-42`, `lib/balance.ts:89-110`, `AccountsScreen.tsx:23`, `TransactionFormScreen.tsx:46` | Правило «архивные счета не считаются» вручную написано в 8 местах SQL и пропущено ещё в 4. Пока счёт в приложении архивировать нельзя, поэтому ошибки сейчас нет. | Когда появится архив, итоги «Записей» разойдутся с «Графиками» и «Отчётами». Бюджеты начнут учитывать траты архивных счетов, а форма — предлагать архивный счёт. | Одна функция или один SQL-фрагмент «активные счета» в `lib/`. Для каждого запроса явно решить, нужен ли фильтр, и покрыть это тестом. |
| 7 | средняя | `TransactionFormScreen.tsx:94-123`; `AccountsScreen.tsx:34-45`; `BudgetsScreen.tsx:31-45`; `packages/health/src/lib/kinds.ts:59-68` | Проверки ввода живут внутри экранов и не покрыты тестами: сумма больше нуля, перевод не на тот же счёт, один бюджет на категорию. Функция `parseMeasurement` чистая, но тестов у неё тоже нет. | Половина ошибок, найденных полной проверкой, была именно в обработке ввода форм: № 1, 2, 3 и 5 из 8 (`notes/qa.md`, таблица «Найденные ошибки»). Без тестов их легко вернуть при следующей правке. | Вынести проверки в чистые функции, например `validateTransaction(...)`: на выходе текст ошибки или готовые данные. Написать тесты, как для `records.ts`. |
| 8 | средняя | `components/Chip.tsx:1-42`, а такие же «чипы» сделаны вручную в `packages/health/src/screens/HealthProfileScreen.tsx:51-59, 76-86`. Стиль главной кнопки повторён в 7 местах: `AccountsScreen.tsx:119`, `BudgetsScreen.tsx:133`, `TransactionFormScreen.tsx:255`, `AddMeasurementScreen.tsx:75`, `HealthProfileScreen.tsx:88`, `HealthHomeScreen.tsx:119`, `packages/core/src/ModuleErrorFallback.tsx:35` | Одинаковые элементы интерфейса скопированы. «Здоровье» не может взять `Chip` из «Финансов» (модули не импортируют друг друга), поэтому скопировало стили. | Впереди переделка дизайна: одну кнопку придётся менять в 7 файлах, и что-нибудь обязательно забудется. По правилу проекта общее лежит в `packages/core` (`CLAUDE.md:20`). | Перенести `Chip` в `packages/core`, добавить туда `PrimaryButton` и заменить ими копии. |
| 9 | средняя | `packages/core/src/useAsyncData.ts:22`, `hooks/useAsyncData.ts:21`; файла настроек ESLint в репозитории нет | В коде есть `// eslint-disable-next-line react-hooks/exhaustive-deps`, но линтер (программа автоматической проверки кода) в проекте не настроен и не запускается. | Линтер сам ловит ошибки хуков: забытые зависимости, хуки внутри условий. Для владельца, который пока не читает код, это бесплатный рецензент. React советует считать ошибку линтера зависимостей ошибкой компиляции и не отключать её. | Выполнить `pnpm expo lint` в `apps/mobile`: команда создаст `eslint.config.js` на основе `eslint-config-expo`. Запускать её вместе с `pnpm typecheck`. |
| 10 | низкая | `AccountsScreen.tsx:47-56`; комментарий `widget/updateWidget.tsx:7` | Новый счёт с начальным балансом меняет общий баланс, но виджет не обновляется. А комментарий к `updateBalanceWidget` прямо говорит вызывать его после изменения счёта. | Виджет показывает старый баланс до следующей записи или до планового обновления раз в 30 минут (`app.json:47`). | После создания счёта вызывать `updateBalanceWidget()` — через ту же общую функцию «после изменения», что и для записей. |
| 11 | низкая | `lib/notifications.ts:5, 7-15, 80-85` | Файл «уведомления» делает три дела: настраивает уведомления прямо при импорте (побочный эффект), проверяет бюджеты и обновляет виджет. Из-за этого `lib` зависит от `widget/`. | По имени файла не догадаться, что там обновляется виджет. Побочный эффект срабатывает при любом импорте пакета, даже в фоновой задаче виджета. | Вынести `runAfterTransactionChange` в `lib/afterChange.ts`, а `setNotificationHandler` вызывать в `financeModule.onReady`. |
| 12 | низкая | Помощники для дат: `lib/balance.ts:4-7`, `lib/stats.ts:6`, `BudgetsScreen.tsx:11-14`, хотя рядом есть `lib/period.ts`. `const DAY` объявлена трижды: `components/DateField.tsx:10`, `packages/health/src/lib/tips.ts:53`, `packages/health/src/lib/healthConnectMapping.ts:5`. Одинаковые `Intl.DateTimeFormat`: `ReportsTab.tsx:11` и `MonthlyBars.tsx:20`; `MonthSwitcher.tsx:6`, `MonthlyBars.tsx:21`, `DateField.tsx:8`. Число 110 в `paddingBottom: 110` с пояснением только в `RecordsTab.tsx:122`, а в `ChartsTab.tsx:59` и `ReportsTab.tsx:104` без него. Валюта «BYN» строкой в `ReportsTab.tsx:75` | Мелкие помощники и константы повторены вместо того, чтобы лежать в одном месте. | Если поменять размер кнопки «+» или валюту, придётся искать все копии. Число 110 без пояснения непонятно. | Границы месяцев считать только через `period.ts`. `DAY` и форматтеры вынести в общий файл. Отступ 110 сделать именованной константой рядом с кнопкой. Вместо «BYN» писать `APP_CURRENCY`. |
| 13 | низкая, «проверить замером» | `lib/balance.ts:102-109` — по запросу на каждый бюджет; `ReportsTab.tsx:23` и `AccountsScreen.tsx:24` — по запросу на каждый счёт. Одинаковый `CASE` в `lib/balance.ts:15-36` и `:42-64` | Запросы в цикле (так называемая проблема «N+1») и дважды написанный SQL подсчёта баланса. | Сейчас счетов и бюджетов мало, поэтому это быстро. Но копия формулы — риск исправить её только в одном месте. По правилу проекта сначала нужен замер (`CLAUDE.md:28`). | Сделать один общий SQL-фрагмент «движение по счёту». Один запрос с `GROUP BY` — только если замер покажет медленность. |
| 14 | низкая | `packages/health/src/lib/kinds.ts:2` и `packages/health/src/lib/healthConnectMapping.ts:3` импортируют `@ecosystem/db/src/schema`; `index.ts:1-14` (пакет «Финансы»); `apps/mobile/app-entry.js:2` | «Здоровье» обращается к внутреннему файлу пакета `db` (причина объяснена в комментарии: корень пакета открывает базу, а тесты так не умеют). `index.ts` «Финансов» экспортирует всё подряд (lib, widget, seed), хотя приложению нужно только 7 имён. `app-entry.js` подключает весь пакет «Финансов» ради одной функции виджета. | Внутренний путь сломается, если файл переместить. Широкий экспорт приглашает другие пакеты пользоваться внутренностями «Финансов». При старте загружаются все экраны «Финансов»; влияет ли это на скорость — «проверить замером». | В `packages/db/package.json` добавить поле `exports` с отдельным путём `./schema`. В `index.ts` «Финансов» оставить только то, что нужно приложению. «Мнение»: добавить в `AppModule` необязательный `registerHeadless`. |
| 15 | низкая | `packages/health/src/screens/MeasurementDetailScreen.tsx:50-52` | Выбранная точка графика выставляется эффектом уже после отрисовки: `useEffect(() => setSelected(points.length - 1), …)`. | Получается лишняя отрисовка с пустым выбором. Документация React прямо советует не подстраивать состояние под входные данные внутри эффекта. | Хранить `selectedId` (`null` означает «последняя») и вычислять индекс при отрисовке. |
| 16 | низкая | `packages/health/src/screens/HealthProfileScreen.tsx:16` | `getHealthProfile()` (синхронное чтение из SQLite) выполняется при каждой отрисовке — то есть на каждую введённую букву роста. | Лишняя работа: значение нужно только один раз. | Заменить на `const [initial] = useState(getHealthProfile)` — так значение прочитается только при первой отрисовке. |
| 17 | низкая | `components/DateField.tsx:19` | `startOfDay(today - DAY / 2)` — хитрый способ получить «вчера», который не ломается при переводе часов. Комментария нет. | Читатель решит, что это опечатка («почему половина дня?»), и «исправит» на `today - DAY`. | Добавить однострочный комментарий: «полдня назад — всегда вчера, даже в день перевода часов». |
| 18 | низкая | `TransactionFormScreen.tsx:134` (проверка на `:105`), `packages/health/src/lib/measurements.ts:9`, `packages/health/src/components/TipCard.tsx:22` (проверка на `:21`) | Три восклицательных знака `!` («точно не пусто»). Сейчас они безопасны: значения проверены выше. | `!` отключает проверку TypeScript. Если кто-то поменяет проверку выше, ошибку увидит уже пользователь: по справочнику TypeScript `!` никак не меняет поведение программы во время работы. | В форме брать `input.counterpartAccountId`; в `addCheckIn` отфильтровать `undefined`; в `TipCard` написать `const source = tip.source` и проверять его. |
| 19 | низкая | `apps/mobile/app/(tabs)/health/[kind].tsx:11` | У текста «Неизвестная зона замера» нет цвета из темы. | В тёмной теме это чёрный текст на почти чёрном фоне — прочитать нельзя. | Задать `color` из `useTheme().text`. |
| 20 | низкая | `packages/db/src/client.ts:8`; `lib/money.ts:16`; `components/CategoryDonut.tsx:19` и `lib/stats.ts:8`; `BudgetsScreen.tsx:52`; `apps/mobile/package.json:15, 18, 22` и `app.json:53-64` | Остатки, которые ничего не делают:<br>• `enableChangeListener` включён, но на изменения никто не подписан;<br>• ветка «RUB → ₽» в `money.ts`: после миграции 0004 таких строк нет;<br>• экспорт `segmentColor` и псевдоним `CategoryTotal` никто снаружи не использует;<br>• поле `start_month` бюджета записывается, но нигде не читается;<br>• `expo-file-system` и `expo-sharing` не используются в коде;<br>• `expo-widgets` — iOS-виджет без кода. | Читатель тратит время, чтобы понять, зачем это нужно, а лишние нативные библиотеки увеличивают APK. `expo-sharing` и `expo-file-system` предложено использовать для резервной копии (`notes/research/auth-secrets.md:57` в базовой ветке) — если план в силе, их стоит оставить. | Удалить или подписать комментарием, зачем оставлено. |
| 21 | низкая, «проверить» | `packages/db/src/schema.ts:30, 35-36, 48` | `.references()` описывают связи между таблицами (внешние ключи). Но SQLite проверяет их, только если включить `PRAGMA foreign_keys = ON`, а в проекте этого нет. В сборке expo-sqlite нет флага `SQLITE_DEFAULT_FOREIGN_KEYS` (`node_modules/expo-sqlite/android/build.gradle:27-34`; условие в `node_modules/expo-sqlite/vendor/sqlite3/sqlite3.c:186042`). Документацию SQLite открыть не удалось (ответ 403): вывод сделан по исходникам. | Пока счета и категории нельзя удалить, вреда нет. Когда удаление появится, база молча оставит записи, которые ссылаются на несуществующий счёт. | Проверить на телефоне, что возвращает `PRAGMA foreign_keys`. Если 0 — включать проверку сразу после открытия базы в `client.ts`. |
| 22 | низкая | Скрипты `test` во всех `packages/*/package.json` (`tsx --test`); `apps/mobile/tsconfig.json` | Файлы тестов не проходят проверку типов. `pnpm typecheck` их не включает (проверено командой `tsc --listFilesOnly`: тестов в списке 0). А `tsx` спокойно запускает файл с ошибкой типов (проверено). | Ошибка типов в тесте останется незамеченной, и тест может проверять не то, что задумано. | Сделать отдельный `tsconfig` для тестов с `@types/node` и добавить `tsc --noEmit` в скрипт `test`. |
| 23 | низкая | `notes/roadmap.md:61`, `CLAUDE.md:36`, `notes/architecture.md:66`, `notes/qa.md:60`, `notes/health-module.md:58`, `README.md:3, 60` | Заметки и README отстали от кода:<br>• `roadmap.md:61` и `CLAUDE.md:36` — «тесты только на подсказки», а их уже 39 в трёх пакетах;<br>• `architecture.md:66` — не упомянут шаг `prepare`;<br>• `qa.md:60` — «дата всегда момент сохранения», но теперь есть календарь;<br>• `health-module.md:58` — «20 автотестов», сейчас их 18;<br>• `README.md:3` — «здоровье (в планах)», а модуль уже есть;<br>• `README.md:60` — у `core` перечислены только описание модуля и изоляция ошибок. | Заметки — память проекта. И владелец, и следующий агент начнут работу с неверной картиной. | Обновить эти строки, а в `qa.md` пометить, что это отчёт на 2026-10-17. |

**Как могут выглядеть исправления (наброски для планировщика)**

П. 1 — сворачивать, когда категорий больше, чем цветов. Существующий тест с 7 категориями продолжит проходить: 5 категорий + «Остальные (2)».
```ts
// lib/chartData.ts. Было: if (positive.length <= maxSegments) — 6 категорий проходили без свёртки, а цветов 5.
export function foldCategories(rows: CategorySpend[], colours = 5 /* = theme.chart.slots.length */): DonutSegment[] {
  const positive = rows.filter((r) => r.amount > 0);
  if (positive.length <= colours) return positive.map((r) => ({ ...r, other: false }));
  const kept = positive.slice(0, colours).map((r) => ({ ...r, other: false }));
  const tail = positive.slice(colours);
  const rest = tail.reduce((sum, r) => sum + r.amount, 0);
  return [...kept, { categoryId: null, name: `Остальные (${tail.length})`, amount: rest, other: true }];
}
```

П. 3 — хук запоминает ошибку и перестаёт «грузиться».
```ts
// packages/core/src/useAsyncData.ts (фрагмент эффекта)
const [error, setError] = useState<Error | null>(null);
fetcher()
  .then((result) => { if (!cancelled) { setData(result); setError(null); } })
  .catch((e) => { if (!cancelled) setError(e instanceof Error ? e : new Error(String(e))); })
  .finally(() => { if (!cancelled) setLoading(false); });
// … return { data, error, loading, refresh };
```

П. 4 — пользователь узнаёт, что сохранение не удалось.
```ts
setSaving(true);
try {
  await addTransaction(input);
  await runAfterTransactionChange(scope);
  router.back();
} catch (e) {
  console.error("Saving a transaction failed", e);
  setError("Не удалось сохранить запись. Попробуйте ещё раз.");
} finally {
  setSaving(false);
}
```

П. 18 — вместо `!` сохранить значение в переменную, тогда TypeScript сам видит проверку.
```tsx
const source = tip.source;
{source && <Pressable onPress={() => Linking.openURL(source.url)}>…</Pressable>}
```

**Тесты: что покрыто и что нет.**

`pnpm test` — 39 тестов, все прошли.

Покрыто:
- разбор и вывод сумм — `money.test.ts`;
- итоги месяца, группировка по дням, отчёт по месяцам и календарь — `records.test.ts`. Там же лежат тесты `period.ts`; «Мнение»: лучше вынести их в отдельный `period.test.ts`;
- данные для диаграмм — `chartData.test.ts`;
- шкалы осей — `packages/core/src/ticks.test.ts`;
- правила подсказок — `packages/health/src/lib/tips.test.ts`;
- преобразование записей Health Connect — `packages/health/src/lib/healthConnectMapping.test.ts`.

Не покрыто:
- все SQL-запросы: `lib/balance.ts`, `lib/stats.ts`, `lib/transactions.ts`, запрос с оконными функциями в `packages/health/src/lib/measurements.ts:26-58`, импорт с защитой от дублей в `packages/health/src/lib/healthConnectSync.ts:40-71`;
- проверки форм (п. 7);
- пороги уведомлений 90 % и 100 % (`lib/notifications.ts:45-61`);
- разбор замеров (`packages/health/src/lib/kinds.ts:59-68`);
- цвета диаграммы (п. 1).

«Мнение»: запросы к базе можно проверять в Node на базе в памяти. Какой драйвер для этого подойдёт к drizzle — «проверить».

Какие тесты стоит добавить в первую очередь (все без базы):
- `foldCategories`: у каждой доли, кроме «Остальных», есть цвет (6 и 7 категорий);
- `validateTransaction` после выноса из формы: пустая сумма, «0», «12,345», перевод без получателя, перевод на тот же счёт;
- `parseMeasurement`:
  - «82,5» → 82500 (граммы);
  - «825» → ошибка «от 20 до 400 кг»;
  - «82,55» → ошибка формата;
- пороги уведомлений после выноса расчёта в чистую функцию: 89 % — ничего, 90 % — «почти исчерпан», 100 % — «превышен».

## 4. История коммитов

**Оценка:** сообщения хорошие; размер некоторых коммитов и схема веток — слабее.

- **Объём.** Всего 61 коммит во всех ветках: 44 обычных и 17 слияний. Из слияний 7 обратные: «Merge branch 'max/jolly-feynman-ykq4yw' into feature/…».
- **Сообщения — сильная сторона.** Заголовок говорит, что сделано; текст ниже — почему и что было раньше. Примеры:
  - `9bad6f8` «Wait for module data before showing screens» — описана ошибка на свежей установке и её решение через `prepare`;
  - `b3aef8d` — почему минус U+2212 (для ru-RU `Intl` ставит дефис);
  - `81e9aae` — зачем нужен `expo-system-ui`;
  - `87f4a55` — почему суммы в тестах выдуманные.
  
  У коммитов с заметками единый префикс `notes:`. Иногда заметка обновлена в том же коммите, что и код (`1150ec6`) — это хорошо.
- **Длина заголовков.** Документация git советует заголовок до 50 знаков и пустую строку перед описанием. Здесь до 50 знаков — 18 заголовков из 44, 51–72 — 22, длиннее 72 — 4 (например, `bfa4e34`, `4215d37`). Это мелочь.
- **Размер коммитов («Мнение»).** Большинство коммитов посвящены одному делу (`b3aef8d`, `87f4a55`, `491ca00`, `5790dba`). Слишком крупные:
  - `66259d0` — 28 файлов, +1330/−322. В одном коммите новые вкладки, календарь, миграция 0005, `SegmentedControl` в core и удаление старых экранов;
  - `7231a2f` — 7 разных исправлений;
  - `bfa4e34` — три разные починки сборки.
  
  Такой коммит трудно проверить, и его нельзя откатить по частям.
- **Ветки против правила `CLAUDE.md:24`** («каждая функция — в своей ветке, слияние после проверки»):
  - ветки `feature/<имя>` есть и названы по правилу;
  - но они растут «стопкой». `feature/finance-redesign` выросла из `feature/theme`, та — из сборочной `verify/phone-2`, где уже слиты `feature/finance-charts`, `feature/currency-byn`, `feature/text-field` и `feature/health-mvp`. Сейчас эта ветка на 18 коммитов впереди базовой. При её слиянии в основную разом придут несколько функций, не проверенных на телефоне, — как раз то, от чего защищает правило;
  - фактическая основная ветка — `max/jolly-feynman-ykq4yw` (имя сессии, придуманное автоматически). А `main` не обновлялась с 9 августа и отстаёт на 34 коммита. Новичка это сбивает с толку. «Мнение»: перенести основную линию в `main`;
  - заметки коммитятся в базовую ветку, а код — в feature-ветки. Поэтому в этой ветке папка `notes/` отстаёт на 3 коммита (`02af89c`, `b622887`, `7c38163`);
  - 7 обратных слияний базы в feature-ветки (в `feature/finance-history` их три) засоряют историю.
- **Приватность.** В `af678e4` (заметки) и `66259d0` (тест) попали суммы пользователя. Из файлов их убрали (`647c365`, `87f4a55`), но в истории публичного репозитория они остались. Это уже записано в заметках базовой ветки (`02af89c`), переписывать ли историю — решает владелец. Сами суммы в этот отчёт я не переношу.

## 5. Что сделано хорошо (стоит перенять)

1. **Границы модулей соблюдены.**
   - «Финансы» и «Здоровье» не импортируют друг друга, а `core` и `db` ничего не знают о модулях. Поиск `@ecosystem/finance` и `@ecosystem/health` внутри пакетов ничего не нашёл.
   - Падение модуля изолировано через `ErrorBoundary` (`apps/mobile/app/(tabs)/finance/_layout.tsx:5-7`), как это описано в документации Expo Router.
2. **Деньги и замеры хранятся целыми числами.**
   - Деньги — в копейках (`packages/db/src/schema.ts:11-12, 32-33`).
   - Замеры — в граммах, миллиметрах и десятых долях процента (`schema.ts:74-76`).
   
   Числа в JavaScript — двоичные дроби IEEE 754 с ограниченной точностью (MDN, Number), поэтому целые копейки — правильный выбор.
3. **Расчёты отделены от базы и экранов.** `records.ts`, `chartData.ts`, `period.ts`, `money.ts`, `tips.ts`, `healthConnectMapping.ts` — чистые функции с тестами. Хороший пример — проценты, которые в сумме дают ровно 100 (`lib/chartData.ts:21-38`).
4. **Комментарии объясняют «почему», и выборочно проверенные — верны.**
   - `apps/mobile/index.js:1-16` — зачем веб-версия перезагружается через `/index`;
   - `packages/core/src/ticks.ts:14` — почему используются индексы, а не `v += step`;
   - `packages/core/src/TextField.tsx:5-9` — откуда берётся бирюзовый цвет;
   - `packages/db/drizzle/0004_currency_byn.sql:1`;
   - `lib/transactions.ts:55` («дата меняется, только если передана»). Это верно: drizzle 0.45.2 пропускает `undefined` в `.set()` (`node_modules/drizzle-orm/utils.js:84`).
5. **Загрузка данных в эффекте с отменой.** `packages/core/src/useAsyncData.ts:10-23` повторяет шаблон с флагом `ignore` из документации React. Подписка с отпиской сделана правильно в `packages/health/src/screens/HealthHomeScreen.tsx:48`.
6. **Код только для Android вынесен в отдельный файл.** Это `healthConnect.android.ts` с заглушкой `healthConnect.ts` — приём из документации React Native (platform-specific extensions). Типы проверяются для обеих версий (`apps/mobile/tsconfig.android.json`).
7. **Длинные списки сделаны правильно.** `SectionList` и `FlatList` (`components/RecordsTab.tsx:64`, `packages/health/src/screens/HealthHomeScreen.tsx:64`) рисуют только видимые строки (React Native, Using List Views).
8. **Время везде одинаковое.** Везде используется часовой пояс телефона и одни и те же функции (`lib/period.ts`). Запись задним числом ставится на полдень (`period.ts:39-43`), и это покрыто тестом (`records.test.ts:67-71`).
9. **Строгий TypeScript.** Нет `any` и `@ts-ignore`, проверка типов проходит для обеих платформ.
10. **Ошибки ввода показываются под формой, а не в `Alert`**, который в веб-версии пустой. Решение записано и в коде (`TransactionFormScreen.tsx:95`), и в заметках.

## 6. Топ-10 исправлений по порядку

1. Кольцевая диаграмма: исправить шестую категорию без цвета и добавить тест (п. 1).
2. `useAsyncData`: возвращать `error`, ловить ошибки через `.catch`, разделить `loading` и `refreshing` (п. 3). Затем перевести три экрана на `core` и удалить копии хуков (п. 2).
3. Во всех сохранениях и удалениях добавить `catch` с понятным сообщением (п. 4).
4. Убрать запросы из экранов «Финансов» в `lib/` и завести одно правило «активные счета» (п. 5, 6).
5. Вынести проверки форм в чистые функции с тестами; написать тесты на `parseMeasurement` (п. 7).
6. Подключить линтер: `pnpm expo lint` (п. 9).
7. До переделки дизайна перенести `Chip` и `PrimaryButton` в `packages/core` (п. 8).
8. Обновлять виджет после создания счёта; перенести `runAfterTransactionChange` из `notifications.ts` в отдельный файл (п. 10, 11).
9. Обновить устаревшие строки в заметках, README и `CLAUDE.md` (п. 23); после шага 2 отметить `decisions.md:67` как выполненное.
10. Мелочи одним коммитом:
    - общие помощники для дат, форматтеры, `DAY` и отступ под «+» (п. 12);
    - комментарий в `DateField` (п. 17);
    - выбор точки графика без эффекта (п. 15);
    - однократное чтение профиля (п. 16);
    - цвет текста в `[kind].tsx` (п. 19);
    - удаление остатков (п. 20).
    
    Затем проверка типов для тестов (п. 22) и проверка внешних ключей на телефоне (п. 21).

## 7. Источники

Открытые документы (через raw.githubusercontent.com):
- React, Component — «Error boundaries do not catch errors for: Event handlers … Asynchronous code»: https://react.dev/reference/react/Component (raw: https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/reference/react/Component.md)
- React, Synchronizing with Effects — пример загрузки с флагом `ignore`: https://react.dev/learn/synchronizing-with-effects (raw: https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/learn/synchronizing-with-effects.md)
- React, You Might Not Need an Effect — «Adjusting some state when a prop changes»: https://react.dev/learn/you-might-not-need-an-effect (raw: https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/learn/you-might-not-need-an-effect.md)
- React, Removing Effect Dependencies — «treating the dependency lint error as a compilation error»: https://react.dev/learn/removing-effect-dependencies (raw: https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/learn/removing-effect-dependencies.md)
- Expo, Using ESLint — команда `npx expo lint`, `eslint-config-expo`: https://docs.expo.dev/guides/using-eslint/ (raw: https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/using-eslint.mdx)
- Expo Router, Error handling — экспорт `ErrorBoundary` из маршрута: https://docs.expo.dev/router/error-handling/ (raw: https://raw.githubusercontent.com/expo/expo/main/docs/pages/router/error-handling.mdx)
- TypeScript Handbook, Everyday Types — «Non-null Assertion Operator»: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html (raw: https://raw.githubusercontent.com/microsoft/TypeScript-Website/v2/packages/documentation/copy/en/handbook-v2/Everyday%20Types.md)
- React Native, Platform-specific code — «Platform-specific extensions»: https://reactnative.dev/docs/platform-specific-code (raw: https://raw.githubusercontent.com/facebook/react-native-website/main/docs/platform-specific-code.md)
- React Native, Using List Views — «FlatList only renders elements that are currently showing»: https://reactnative.dev/docs/using-a-listview (raw: https://raw.githubusercontent.com/facebook/react-native-website/main/docs/using-a-listview.md)
- MDN, Number — «double-precision 64-bit binary format IEEE 754»: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number (raw: https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/javascript/reference/global_objects/number/index.md)
- git-commit, раздел DISCUSSION — короткий заголовок до 50 знаков: https://git-scm.com/docs/git-commit (raw: https://raw.githubusercontent.com/git/git/master/Documentation/git-commit.adoc)
- SQLite, Foreign Key Support (https://www.sqlite.org/foreignkeys.html) — сайт ответил 403. Я не могу подтвердить это по документации SQLite, поэтому п. 21 опирается на исходники ниже.

Исходники установленных пакетов:
- `node_modules/drizzle-orm/utils.js:84` (`mapUpdateSet` пропускает `undefined`, drizzle-orm 0.45.2);
- `node_modules/expo-sqlite/build/NativeDatabase.d.ts:30-34` (`enableChangeListener`);
- `node_modules/expo-sqlite/android/build.gradle:27-34` и `node_modules/expo-sqlite/vendor/sqlite3/sqlite3.c:186042` (внешние ключи по умолчанию).

Проверки, которые я запускал сам (проект не менялся):
- `pnpm test` — 39 из 39;
- `pnpm typecheck` — без ошибок;
- `tsc --listFilesOnly` — тесты не входят в проверку типов;
- скрипты в `временную папку облачной сессии (не сохранилась)`:
  - `fold6.ts` — 6 категорий дают 6 сегментов, у шестого цвет `undefined`;
  - `foldorig/` и `foldfix/` — новый тест «у каждой доли есть цвет»: на текущем коде падает («6 categories, slice 5»), на наброске исправления из раздела 3 проходят все 7 тестов `chartData`;
  - `typeerr.ts` — `tsx` запускает файл с ошибкой типов.
