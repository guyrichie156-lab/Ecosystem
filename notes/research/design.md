# Дизайн-направление Ecosystem

Дата: 2026-10-18 · Роль: дизайнер мобильных интерфейсов команды планирования · Статус: предложение, решений пользователя по нему пока нет.
Макеты: `design-mockups.html` в этой же папке — 8 экранов, каждый в светлой и тёмной теме.

**Как читать.** Факт всегда со ссылкой рядом: «(страница открыта)» — я загрузил страницу или её исходный файл; «(по выдержке поиска)» — видел только выдержку поисковика. Собственные предложения помечены «Рекомендация», оценки без строгого основания — «Мнение». Контраст посчитан по формуле WCAG 2.2 (раздел 3.1). Код репозитория только читался.

## Коротко

- Структура приложения пользователя остаётся: «Записи / Графики / Отчёты», выбор месяца, записи по дням с суммой дня, плавающий «+». «Здоровье» строится по той же схеме: шапка → карточки → «+».
- Тёмная тема — «тёмный + жёлтый»: выбранное и главные кнопки в тёмной теме жёлтые (сейчас почти белые). Светлая тема почти не меняется.
- Правило цвета: **жёлтый — действие и выбор, синий — данные, красный — перерасход и удаление, зелёный — доход**. Палитра графиков не меняется: проверка её подтвердила.
- Настройки — не вкладка, а ⚙ в шапке модуля; выключателей модулей нет.
- Скорость: никаких спиннеров на коротких ожиданиях, форма закрывается сразу после «Сохранить», «Отменить» вместо «нажмите ещё раз».

## 1. Принципы

| # | Принцип | Откуда (пожелание пользователя) | Опора | Что видно на экране |
|---|---|---|---|---|
| 1 | **Мгновенно** | Скорость прежде всего (CLAUDE.md, раздел Performance; бриф) | Отклик до 0,1 с ощущается мгновенным, до 1 с особая обратная связь не нужна ([NN/g](https://www.nngroup.com/articles/response-times-3-important-limits/), по выдержке поиска); «Show something as soon as possible» ([HIG Loading](https://developer.apple.com/design/human-interface-guidelines/loading), страница открыта) | Данные из SQLite — сразу, без спиннера; после «Сохранить» форма закрывается сразу |
| 2 | **Одно главное действие** | Плавающий «+», как в приложении пользователя (decisions.md, 2026-10-18) | FAB — «a primary action… the most common pathway… anchored to the bottom right» ([Android: FAB](https://developer.android.com/develop/ui/compose/components/fab), страница открыта) | «+» в «Финансах» (запись) и в «Здоровье» (замер); других плавающих кнопок нет |
| 3 | **Как в привычном приложении** | «Финансы» перестроены по образцу приложения пользователя (decisions.md, 2026-10-18) | Панель вкладок остаётся видимой при переходах внутри раздела ([HIG Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), страница открыта) | Один каркас во всех модулях; нижняя панель не прячется |
| 4 | **Минимум на экране** | Минимальный чистый интерфейс (бриф); выключатели не нужны (decisions.md, 2026-10-17) | «Respect system settings. Your app may not need its own settings» ([Android: Settings](https://developer.android.com/design/ui/mobile/guides/patterns/settings), страница открыта); «Minimize the number of settings» ([HIG Settings](https://developer.apple.com/design/human-interface-guidelines/settings), страница открыта) | Тема, размер шрифта, вибрация — из настроек телефона; одна главная цифра на карточку, подробности — по нажатию |
| 5 | **Цифры честно** | У графиков уже есть списки и таблицы (decisions.md, 2026-10-17; theme.ts) | Цвет — не единственный носитель информации ([WCAG 1.4.1](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/20/use-of-color.html), страница открыта); «Avoid relying solely on color» ([HIG Charts](https://developer.apple.com/design/human-interface-guidelines/charts), страница открыта) | У каждого графика список или таблица; изменения замеров — нейтральным цветом (health-module.md) |
| 6 | **Ошибку можно отменить** | Удаление сейчас — «нажмите ещё раз» (TransactionFormScreen.tsx, MeasurementDetailScreen.tsx) | Снекбар после удаления «offer[s] an Undo option» ([Android: Snackbar](https://developer.android.com/develop/ui/compose/components/snackbar), страница открыта); не предупреждать, если потеря данных — ожидаемый итог действия ([HIG Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback), страница открыта); подтверждения работают, только если они редки ([NN/g](https://www.nngroup.com/articles/confirmation-dialog/), по выдержке поиска) | Удаление сразу + «Отменить» |
| 7 | **Спокойно и лично** | Приложение для одного человека; «Здоровье» — минимум (бриф) | Duolingo добавил к серии «заморозку»: немного «слабины» мотивирует сильнее жёстких правил ([блог Duolingo](https://blog.duolingo.com/how-duolingo-streak-builds-habit), по выдержке поиска) | Мнение: без серий, значков и красного цвета за «плохой» вес; если серии появятся — с выходным днём |

## 2. Карта навигации

```
Корневой стек (apps/mobile)
├─ Блокировка ............ поверх всего, если включена (5.9)
├─ Первый запуск ......... только когда нет ни одного счёта (5.10)
├─ (tabs) нижняя панель — модули из modules.ts
│   ├─ Финансы
│   │   ├─ [Записи | Графики | Отчёты] + «+»            ← как сейчас
│   │   ├─ Бюджет (кнопка в шапке): доли дохода, регулярные платежи
│   │   └─ Запись (лист), Счета, Категории, Импорт истории
│   └─ Здоровье
│       ├─ Сводка + «+»
│       ├─ Вес / % жира / Талия → тренд и цель
│       └─ Новый замер (лист), Рост и пол
└─ Настройки (⚙ в шапке модуля; не вкладка)
    └─ Безопасность · Данные (копия, импорт) · строки модулей
```

**Нижняя панель.** Факт: панель навигации M3 — для 3–5 равнозначных разделов ([Android: Navigation bar](https://developer.android.com/develop/ui/compose/components/navigation-bar), страница открыта); HIG — подписи по возможности из одного слова, вкладки не прятать и не отключать ([HIG Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), страница открыта). Сейчас вкладок две, иконки — эмодзи 💰/❤️ с прозрачностью 0,5 у неактивной (`app/(tabs)/_layout.tsx`). Рекомендация: векторные иконки Material Symbols (лицензия Apache 2.0 — [README](https://raw.githubusercontent.com/google/material-design-icons/master/README.md), страница открыта), нарисованные через уже установленный react-native-svg — новой нативной библиотеки не нужно. Активная вкладка: «таблетка» цвета primary под закрашенной иконкой (форма индикатора в M3 — `CornerFull`, высота панели 64 dp — [NavigationBarTokens](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/NavigationBarTokens.kt), страница открыта) + подпись `text` 600; неактивная — контурная иконка и `textMuted`. Состояние видно не только цветом: форма иконки и начертание подписи тоже меняются.

**Где может жить «Сводка».** Решение пользователя от 2026-10-17 касается выключателей, а не модулей, поэтому сводка возможна. Варианты:

| | Где | Плюсы | Минусы |
|---|---|---|---|
| A | Сводки нет; приложение открывается на последнем модуле и вкладке | Ничего строить не надо; до «+» ближе всего | Нет общего взгляда |
| B | Вкладка «Сводка» первой: ею становится скрытый `(tabs)/index.tsx`, который сейчас перенаправляет на первый модуль | Один экран обо всём | Ещё один экран при старте; нужен контракт модулей |
| C | Сводка внутри «Финансов» | — | Ломает изоляцию модулей |

Рекомендация: A сейчас, B — когда появится третий модуль. Для B каждый модуль отдаёт карточку через `AppModule` (например, `summary?: ComponentType`), оболочка рисует её внутри своей границы ошибок; модули друг друга не импортируют (правило CLAUDE.md). Выключателей нет — показываются все карточки. Вариант A опирается на HIG: «Restore the previous state when your app restarts» ([HIG Launching](https://developer.apple.com/design/human-interface-guidelines/launching), страница открыта). Решает пользователь (вопрос 4).

**Настройки и безопасность.** Факт: 2026-10-17 убраны выключатели модулей и вкладка «Настройки» (decisions.md). Руководство Android: настройки обычно не входят в главную навигацию и ставятся во вторичные места — в верхнюю панель или меню; частые действия — рядом с функцией, а не в настройках ([Android: Settings](https://developer.android.com/design/ui/mobile/guides/patterns/settings), страница открыта). Revolut открывает безопасность через значок профиля в левом верхнем углу → Security ([справка Revolut](https://help.revolut.com/help/profile-and-plan/log-in-issues/sign-in-with-face-id-or-fingerprint/), по выдержке поиска). Рекомендация: ⚙ справа в шапке главного экрана каждого модуля открывает один корневой экран `/settings` вне `(tabs)`. В нём нет ни выключателей модулей, ни выбора темы (тема — как в телефоне: decisions.md, 2026-10-18; Android советует не переопределять системную тему — та же страница). Модуль добавляет свои строки через `AppModule` (например, `settings?: { title, href }[]`), оболочка о модулях не знает. Это снова экран настроек, хоть и без выключателей, — нужно согласие пользователя (вопрос 5).

## 3. Токены

### 3.1 Цвет

**Как считал.** Относительная яркость L = 0,2126·R + 0,7152·G + 0,0722·B, где каналы sRGB линеаризованы (c ≤ 0,04045 → c/12,92, иначе ((c+0,055)/1,055)^2,4); контраст = (L1 + 0,05)/(L2 + 0,05) — определения WCAG 2.2 ([relative luminance](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/terms/20/relative-luminance.html), [contrast ratio](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/terms/20/contrast-ratio.html) — исходники W3C, страница открыта; сайт w3.org из облака закрыт, 403). Считал своим скриптом на Python; он воспроизводит все числа из комментариев theme.ts (5,07; 4,66; 3,26; 6,08; 10,49; 5,62; 5,13; 6,81; 5,93; 5,34; 7,07; 10,74; 6,90; 7,93; 3,22; 2,15). Пороги: текст 4,5:1, крупный текст (18 pt или 14 pt полужирный) 3:1 ([WCAG 1.4.3](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/20/contrast-minimum.html), [large scale](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/terms/20/large-scale.html), страница открыта); элементы управления и их состояния 3:1 ([WCAG 1.4.11](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/21/non-text-contrast.html), страница открыта); граница кнопки не обязательна, если кнопку видно по тексту или иконке ([Understanding 1.4.11](https://raw.githubusercontent.com/w3c/wcag/main/understanding/21/non-text-contrast.html), страница открыта) — поэтому жёлтый FAB на белом (1,62:1) допустим: «+» на нём 10,49:1.

**Изменения (Рекомендация):**

| Токен | Светлая | Тёмная | Контраст | Зачем |
|---|---|---|---|---|
| `primary` / `onPrimary` | без изменений: #1c1c1e / #ffffff | **#f2f2f0 → #f5c542** / #1a1a19 | тёмная: текст на кнопке 10,74; кнопка к фону 10,74, к `card` 9,35, к `fill` 8,39. Светлая: выбранный сегмент к дорожке `fill` 14,95 | «Тёмный + жёлтый», как в приложении пользователя: главные кнопки, выбранные чип, сегмент, вкладка, день в календаре |
| `accentSoft` (новый) | #fdf5dd | #342f1e | `text` 15,62 / 11,92; `textMuted` 4,66 / 5,23 | Подсветка только что добавленной записи |
| `inverseSurface` / `onInverseSurface` (новые) | #262624 / #f2f2f0 | #f2f2f0 / #1a1a19 | 13,53 / 15,54 | Снекбар: в M3 фон — InverseSurface, текст — InverseOnSurface, действие — InversePrimary ([SnackbarTokens.kt](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/SnackbarTokens.kt), страница открыта) |
| `inverseAccent` (новый) | #f5c542 | #7a5600 | 9,35 на #262624 / 5,93 на #f2f2f0 | Кнопка «Отменить» в снекбаре |
| `scrim` (новый) | rgba(0, 0, 0, 0.32) | то же | — | Затемнение под листом; 0,32 = `ScrimTokens.ContainerOpacity` ([исходник](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ScrimTokens.kt), страница открыта) |
| `sheet` (новый) | #ffffff (= background) | #262624 (= card) | `text` 17,01 / 13,53 | В тёмной теме слой выше — светлее: «base» и «elevated» у Apple ([HIG Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), страница открыта), тональная высота в M3 ([Android: Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3), страница открыта) |

Остальные токены theme.ts не меняются, в том числе вся палитра графиков. Проверил её валидатором навыка dataviz на настоящих фонах приложения: светлая (#ffffff) — худшая соседняя пара для дальтоников ΔE 9,1, для обычного зрения 19,6, три цвета ниже 3:1 (поэтому значения дублируются текстом — уже сделано); тёмная (#1a1a19) — 8,4 и 19,3, все цвета не ниже 3:1. Совпадает с комментариями theme.ts: причин менять палитру нет.

**Правило применения (Рекомендация):**

| Роль | Токены | Где |
|---|---|---|
| Действие и выбор | `accent` (FAB), `primary` (кнопки, выбранное) | «+», «Сохранить», выбранный чип, сегмент, вкладка |
| Данные | `chart.*`; один ряд — синий | Кольцо, столбцы, линия, полосы бюджета и цели (`chart.selected` на дорожке `fill`: 3,88 светлая, 3,74 тёмная) |
| Перерасход, удаление | `danger` (на дорожке `fill`: 4,94 / 5,39) | Полоса и слово «перерасход», ошибки |
| Доход | `income` (на `card`: 4,71 / 6,90) | Суммы доходов |

Найдено при расчёте: `textMuted` на `fill` в светлой теме — 4,46:1, это меньше 4,5. Серый текст не ставить на чипы и клавиши в светлой теме.

### 3.2 Шрифт

Шрифт системный (на Android — Roboto): файлы шрифта не грузятся, старт не замедляется. Размеры — в sp ([Android: Grids and units](https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units), страница открыта).

| Токен | Размер / интерлиньяж | Вес | Где | Сверка |
|---|---|---|---|---|
| `display` | 34/41 | 700 | «Общий баланс», значение замера | HIG Large Title 34/41 |
| `entry` | 44/52 | 600 | Сумма в форме, начальный баланс | Мнение |
| `title` | 22/28 | 600 | Заголовок шапки | M3 titleLarge 22/28 |
| `headline` | 17/22 | 600 | Месяц, заголовки разделов | HIG Headline 17/22 |
| `body` | 16/22 | 400 | Строки списков, поля | M3 bodyLarge 16/24 |
| `subhead` | 15/20 | 400 | Вторичные строки, таблица | HIG Subhead 15/20 |
| `label` | 14/20 | 600 | Чипы, кнопки, подписи полей | M3 labelLarge 14/20 |
| `caption` | 13/18 | 400 | Подписи строк, суммы дня | HIG Footnote 13/18 |
| `tab` | 12/16 | 600 | Подписи вкладок | M3 labelMedium 12/16 |
| `axis` | 11/14 | 400 | Оси графиков | M3 labelSmall 11/16; минимум HIG — 11 pt |

Шкала M3 — [Android: Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3) (страница открыта); стили Apple и минимум 11 pt — [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography) (страница открыта). Размеры в коде сейчас (13, 14, 15, 16, 17, 34, 36) почти совпадают со шкалой — переход дешёвый.
Цифры: в колонках — `fontVariant: ['tabular-nums']` (поддерживается RN, [Text style props](https://raw.githubusercontent.com/facebook/react-native-website/main/docs/text-style-props.md), страница открыта); крупные одиночные числа — обычные (Мнение).
Крупный шрифт: Android 14 увеличивает текст до 200 % по нелинейной кривой ([Android 14 features](https://developer.android.com/about/versions/14/features), страница открыта); HIG советует поддерживать увеличение не меньше 200 % ([HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), страница открыта). Рекомендация: масштаб не отключать; у `display`, `entry` и клавиш — `maxFontSizeMultiplier` 1,3 ([RN Text](https://raw.githubusercontent.com/facebook/react-native-website/main/docs/text.md), страница открыта); проверить экраны при 200 %.

### 3.3 Отступы

Сетка 8 dp, мелкие элементы — 4 dp ([Android: Grids and units](https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units), страница открыта). Шкала: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40. Поле экрана — 16 (сейчас 20). Рекомендация: 16 даёт +8 dp ширины под суммы на экране 360 dp; FAB в Compose ставится в 16 dp от края (`FabSpacing`, [Scaffold.kt](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Scaffold.kt), страница открыта). Официальную страницу M3 о полях открыть не удалось. Строка списка — не ниже 56; зона касания — не меньше 48 × 48 dp ([Android: Accessibility](https://developer.android.com/guide/topics/ui/accessibility/apps), страница открыта). WCAG 2.5.8 требует минимум 24 × 24 CSS px ([SC 2.5.8](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/22/target-size-minimum.html), страница открыта), 2.5.5 (уровень AAA) — 44 × 44 ([SC 2.5.5](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/21/target-size-enhanced.html), страница открыта). Сегменты сейчас ≈ 36–38 dp в высоту (отступ 9 + строка текста 15 sp; по коду, на устройстве не мерил), чипы ≈ 34–36 dp — поднять до 48 высотой или `hitSlop`.

### 3.4 Радиусы

xs 4 (концы столбцов) · sm 8 · md 12 (поля, кнопки, сегмент) · lg 16 (карточки) · xl 28 (верх листа) · full (чипы, «таблетки», FAB). Это шкала M3: 4 / 8 / 12 / 16 / 28 / полный ([ShapeTokens](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ShapeTokens.kt), страница открыта); лист снизу в M3 — `CornerExtraLargeTop`, ручка 32 × 4 dp ([SheetBottomTokens](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/SheetBottomTokens.kt), страница открыта). Мнение: FAB оставить круглым, как в приложении пользователя; в M3 он 56 × 56 dp со скруглением `CornerLarge` ([FabBaselineTokens](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/FabBaselineTokens.kt), страница открыта).

### 3.5 Высота (elevation)

Интерфейс плоский. Тень — только у FAB и снекбара в светлой теме (уровень 3 = 6 dp, [ElevationTokens](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ElevationTokens.kt), страница открыта). В тёмной теме верхний слой отличается цветом поверхности (`card`, `sheet`): M3 выражает высоту в основном тоном ([Android: Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3), страница открыта).

### 3.6 Движение

Длительности M3: short 50–200 мс, medium 250–400, long 450–600; кривая standard — cubic-bezier(0.2, 0, 0, 1) ([MotionTokens](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/MotionTokens.kt), страница открыта).

| Что | Длительность, мс | Кривая |
|---|---|---|
| Нажатие, выбор чипа или сегмента | 100–150 | standard |
| «Записи / Графики / Отчёты» | 0 (сразу) или затухание 150 | — |
| Лист: открыть / закрыть | 250 / 200 | emphasized decelerate / accelerate |
| Снекбар: появиться | 150 | standard |

Правила: анимация не блокирует ввод («Let people cancel motion»), частые действия — почти без движения ([HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion), страница открыта). Если в телефоне включено «Убрать анимацию» (`AccessibilityInfo.isReduceMotionEnabled`, [RN AccessibilityInfo](https://raw.githubusercontent.com/facebook/react-native-website/main/docs/accessibilityinfo.md), страница открыта) — только мгновенно или затуханием, без сдвигов (WCAG 2.3.3, [SC](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/21/animation-from-interactions.html), страница открыта). Для сравнения: в Telegram есть настройка «Animations — Reduce motion effects to save power» ([strings.xml](https://raw.githubusercontent.com/DrKLO/Telegram/master/TMessagesProj/src/main/res/values/strings.xml), страница открыта).

### 3.7 Тактильный отклик

expo-haptics на Android даёт `performAndroidHapticsAsync` ([Haptics.types.ts](https://raw.githubusercontent.com/expo/expo/main/packages/expo-haptics/src/Haptics.types.ts), страница открыта), который вызывает системный `performHapticFeedback` ([HapticsModule.kt](https://raw.githubusercontent.com/expo/expo/main/packages/expo-haptics/android/src/main/java/expo/modules/haptics/HapticsModule.kt), страница открыта).

| Событие | Константа | С какой версии API |
|---|---|---|
| Клавиша суммы или PIN | KEYBOARD_TAP | 8 |
| Смена сегмента или вкладки | SEGMENT_TICK | 34 |
| Запись сохранена | CONFIRM | 30 |
| Ошибка ввода, неверный код | REJECT | 30 |
| Долгое нажатие на строку | LONG_PRESS | 3 |
| Переключатель в настройках | TOGGLE_ON / TOGGLE_OFF | 34 |

Версии API — [HapticFeedbackConstants](https://developer.android.com/reference/android/view/HapticFeedbackConstants) (страница открыта); Android 14 — это API 34, на телефоне пользователя доступны все. Там же: начиная с Android 13 только системные приложения могут игнорировать пользовательскую настройку вибрации при касании — значит, отдельный выключатель вибрации в приложении не нужен, а совет HIG «Make haptics optional» ([HIG Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics), страница открыта) выполняет сама система. Принципы Android: предпочитать стандартные константы, частым событиям — слабый отклик, без «жужжащих» вибраций ([Android: Haptics principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles), страница открыта).

## 4. Компоненты

| Компонент | Сейчас | Что сделать (Рекомендация) | Опора |
|---|---|---|---|
| Шапка модуля | Заголовок стека; «Бюджеты» текстом | `AppHeader` в core: заголовок 22, справа до двух действий + ⚙ | Android: Settings (⚙ в верхней панели) |
| Нижняя панель | Эмодзи, прозрачность | SVG-иконки, «таблетка» primary, подписи 12/600 | M3: Navigation bar |
| SegmentedControl | core; выбранный — primary | Высота 48; SEGMENT_TICK; для немногих коротких вариантов (Мнение: до 4) | [Android: Segmented button](https://developer.android.com/develop/ui/compose/components/segmented-button) (страница открыта): множественный выбор — от двух до пяти вариантов, для сложного выбора или больше пяти — чипы |
| Чипы | `finance/Chip` | Перенести в core; 36 + `hitSlop` до 48; выбранный — primary | [Android: Chip](https://developer.android.com/develop/ui/compose/components/chip) (страница открыта): filter-чипы |
| Карточка | Радиусы 12–14 в разных местах | `Card`: `card`, радиус 16, отступ 16, без тени | — |
| Строка списка | `Row` в RecordsTab | `ListRow`: иконка 40, заголовок 16, подпись 13, сумма 16/600 tabular справа, высота от 56 | — |
| Сумма и клавиатура | `TextField` + системная `decimal-pad` | `AmountInput` + `NumericKeypad` 3 × 4 (клавиши от 56 × 48), запятая, ⌫, KEYBOARD_TAP. Один компонент для записи, счёта, бюджета, замера и PIN | [HIG Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data) (страница открыта) |
| Лист снизу | `presentation: "modal"` на весь экран | `presentation: 'formSheet'` в expo-router: на Android это системный bottom sheet, но заголовок стека внутри не рисуется — его рисует сам лист ([Expo Router: Modals](https://raw.githubusercontent.com/expo/expo/main/docs/pages/router/advanced/modals.mdx), страница открыта; это документация ветки main — проверить на SDK 57) | [HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) (страница открыта): один лист за раз, у «Готово» есть пара «Отмена» |
| FAB | Только в «Финансах» | 56 dp, круг, `accent`, 16 dp от края и над панелью; и в «Здоровье» | FAB, `FabSpacing` |
| Пустое состояние | Одна строка текста | `EmptyState`: одна фраза + одна кнопка | HIG Tab bars: «If a section is empty, explain why» |
| Скелет | Нет | Только для первой загрузки дольше ~1 с; блоки цвета `fill`; без мерцания при «Убрать анимацию» | [NN/g: Skeleton screens](https://www.nngroup.com/articles/skeleton-screens/) (по выдержке поиска): меньше 1 с — ни скелета, ни спиннера |
| Снекбар | Нет | `Snackbar` + хост в core: один за раз, одно действие «Отменить», над FAB; с действием не исчезает сам, пока пользователь не сделает что-то ещё | Compose: «Snackbars with an action should not timeout or self-dismiss until the user performs another action» ([Snackbar.kt](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Snackbar.kt), страница открыта); MDC: «Only one snackbar will be shown at a time» ([Snackbar.md](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/Snackbar.md), страница открыта) |
| Полоса бюджета | `progressFill` цвета primary | `Meter`: дорожка `fill` 8 dp, заливка `chart.selected`, перерасход — `danger` + «!» + слово; метка темпа 2 dp `textSecondary` | Copilot (см. 5.5) |
| Мини-график | Нет | `Sparkline` 96 × 40: линия 2, конечная точка r 4 с кольцом фона 2 | Правила навыка dataviz |
| Переключатель | Нет | `SwitchRow` для настроек | Android: Settings («Individual switch») |
| Иконки | Эмодзи | `Icon` (SVG, Material Symbols); эмодзи категорий остаются | README, Apache 2.0 |
| Ошибка модуля | `ModuleErrorFallback` | Без изменений | — |

**Графики.**
- Кольцо: не больше 6 долей (5 цветов + «Остальные (N)» серым), зазор 2 px, сумма в центре, под кольцом — список с долями и полосками (как сейчас).
- Столбцы: не толще 24 px, скругление 4 px только сверху; выбранный месяц — `chart.selected`, остальные — `chart.rest`; кнопка «Показать цифрами» (как сейчас).
- Линия: 2 px; точки r 4 с кольцом цвета фона 2 px, выбранная — r 6. Ось Y для веса и талии не от нуля; HIG объясняет на пульсе, что ноль внизу прячет важные различия ([HIG Charts](https://developer.apple.com/design/human-interface-guidelines/charts), страница открыта). Подписи оси — справа (там же: «shifting the Y axis to the trailing side»). Цель — пунктир `textSecondary` с подписью; сетка — сплошные волосяные линии.
- Над графиком — вывод одной строкой («За 3 месяца: −3,2 кг»): HIG — «Summarize the main message of your chart» (там же).
- Касание в любом месте графика выбирает ближайшую точку — так уже сделано, и так советует HIG (там же).
- Текст никогда не красится в цвет ряда; у каждого графика есть список или таблица; при двух рядах и больше — легенда.
- Не рисовать тройные кольца «как у Apple»: HIG запрещает копировать Activity rings для других целей и показывать в них другие данные ([HIG Activity rings](https://developer.apple.com/design/human-interface-guidelines/activity-rings), страница открыта).

## 5. Ключевые экраны

### 5.1 Финансы → Записи

```
┌ Финансы                      Бюджет  ⚙ ┐
│ [ Записи ][ Графики ][ Отчёты ]        │
│  ‹         октябрь 2026 г.          ›  │
│ ┌ Расходы    Доходы      Баланс     ┐  │
│ │ 1 284,60   2 400,00    1 115,40   │  │
│ └───────────────────────────────────┘  │
│ Можно потратить до 31 окт.  605,40 › │
│ 18 окт., воскресенье  Расходы: 46,30 BYN│
│ 🛒 Продукты · Карта          −32,80 BYN │
│ …                                   (+) │
└ [▣ Финансы]          [♡ Здоровье]       ┘
```

- Всё из приложения пользователя остаётся. Новое — строка «Можно потратить до 31 октября»: только если задан бюджет, нажатие ведёт в «Бюджет». Похожие цифры: «left to spend» у Monzo — баланс за вычетом предстоящих платежей ([Monzo: Trends](https://monzo.com/help/budgeting-overdrafts-savings/trends-spending-and-balance-web), по выдержке поиска); прогноз трат к концу месяца с учётом запланированных платежей у Revolut ([блог Revolut](https://www.revolut.com/blog/post/introducing-spending-analytics/), запись 2019 года; [справка Revolut: Analytics](https://help.revolut.com/help/app-features/budgeting-and-analytics/how-does-the-analytics-feature-work/); оба — по выдержке поиска).
- Регулярный платёж помечен ↻: Copilot помечает такие записи «[R]» ([Copilot: Recurrings](https://help.copilot.money/en/articles/3760068-create-recurrings), по выдержке поиска).
- Новая запись появляется сразу и на секунду подсвечивается `accentSoft` (Мнение).
- Удаление из формы записи → строка исчезает, снекбар «Запись удалена · Отменить».

### 5.2 Финансы → Графики

Остаётся кольцо с полосками. Изменения (Рекомендация): «Расходы / Доходы» — чипами вместо второго сегмента под первым (два одинаковых переключателя подряд спорят друг с другом — Мнение); выбранная доля подсвечивается и в кольце, и в списке. Цвета — по правилу 3.1.

### 5.3 Финансы → Отчёты

Без изменений по структуре: «Общий баланс» (`display` 34), карточка «Расходы / Доходы», «Счета» с «Изменить», столбцы по месяцам, таблица «По месяцам, BYN» с tabular-nums. Меняются только токены (радиусы, отступ 16, шрифт).

### 5.4 Новая запись: быстрый ввод суммы

```
┌ ✕            Новая запись              ┐
│ [ Расход ][ Доход ][ Перевод ]         │
│                12,50 BYN               │
│ (Карта ▾) (Сегодня) (Вчера) (📅)        │
│  🛒     🚌     🏠     🎉                │
│  💊     📦     ⋯ Все                    │
│ Заметка                                │
│ [ 1 ][ 2 ][ 3 ]                        │
│ [ 4 ][ 5 ][ 6 ]                        │
│ [ 7 ][ 8 ][ 9 ]                        │
│ [ , ][ 0 ][ ⌫ ]                        │
│ [            Сохранить            ]    │
└────────────────────────────────────────┘
```

- Открывается из «+» листом на всю высоту; сумма активна сразу. Своя клавиатура: нет анимации системной, запятая всегда на одном месте, клавиши крупные.
- Путь: «+» → цифры → «Продукты» → «Сохранить». Счёт — последний использованный, дата — «Сегодня». HIG: заполнять поля разумными значениями по умолчанию, давать выбор вместо набора текста, кнопку продолжения делать доступной только после обязательных данных ([HIG Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data), страница открыта).
- Категории — 7 самых частых за 90 дней + «Все» (Мнение).
- «Заметка» открывает системную клавиатуру, цифровая на это время прячется.
- Сохранение: лист закрывается сразу, запись пишется в фоне; ошибка — снекбар «Не сохранилось · Повторить». Так Telegram рисует отправляемое сообщение сразу, со значком часов, а ошибку показывает на нём же (`createStatusDrawableParams` в [ChatMessageCell.java](https://raw.githubusercontent.com/DrKLO/Telegram/master/TMessagesProj/src/main/java/org/telegram/ui/Cells/ChatMessageCell.java), страница открыта).
- Калькулятор в поле (12,50 + 3,20) — вопрос 9.

### 5.5 Бюджет v2: доли дохода и регулярные платежи

```
┌ ‹ Бюджет                         Изменить ┐
│  ‹          октябрь 2026 г.           ›   │
│ ┌ Можно потратить до 31 октября        ┐  │
│ │ 605,40 BYN                           │  │
│ │ Доход 2 400,00 из плана 2 400,00 BYN │  │
│ └──────────────────────────────────────┘  │
│ Ближайшие платежи    осталось 150,00 BYN  │
│ ↻ Интернет   22 окт., через 4 дня  35,00 [Оплачено] │
│ Доли дохода                распределено 81 % │
│ 🛒 Еда · 30 %              осталось 333,60 │
│ ██████████████░░│░░░░░░  386,40 из 720,00   │
│ 🚌 Транспорт · 5 %    ! перерасход 22,20   │
└────────────────────────────────────────────┘
```

- Доли — проценты от дохода месяца; лимит = доля × доход. Регулярные платежи — фиксированная сумма, сбережения — перевод на свой счёт, «Свободно» — то, что не распределено. Главная цифра экрана — «Можно потратить»: доход − регулярные − сбережения − уже потраченное вне регулярных.
- Откуда паттерн: Monzo Salary Sorter раскладывает зарплату по «копилкам» и для похожей зарплаты повторяет выбранные в первый раз проценты ([справка Monzo, США](https://monzo.com/help/us-pots/us-what-is-salary-sorter/), по выдержке поиска); в YNAB деньги распределяют по категориям, пока «Ready to Assign» не станет нулём ([YNAB](https://support.ynab.com/en_us/assigning-your-money-a-guide-SypgkrNJi), по выдержке поиска); Monzo по умолчанию ставит цель категории равной тратам прошлого месяца ([Monzo: Trends](https://monzo.com/help/budgeting-overdrafts-savings/trends-spending-and-balance-web), по выдержке поиска).
- Темп: метка на полосе — доля прошедших дней (18 из 31 = 58 %). У Copilot пунктир «ideal pace» на графике и цвет полосы категории по темпу: зелёный, жёлто-оранжевый, красный ([Copilot: Dashboard](https://intercom.help/copilotmoney/en/articles/6045480-dashboard-tab-overview), [Copilot: Categories](https://help.copilot.money/en/articles/9504513-categories-tab-overview), по выдержке поиска). У нас цвет меняется только при перерасходе (красный + «!» + слово), остальное говорит текст: меньше цветов (принцип 4) и состояние не только цветом (WCAG 1.4.1).
- Регулярные платежи: дата, сумма, «Оплачено» одной кнопкой создаёт запись (Мнение). Copilot показывает следующий ожидаемый платёж ([Copilot: Recurrings](https://help.copilot.money/en/articles/3760068-create-recurrings), по выдержке поиска); Monzo ведёт «Left to Pay» и списывает счета из отдельной «копилки» ([Monzo: Bills](https://monzo.com/help/budgeting-overdrafts-savings/web-bill-pots), по выдержке поиска). Напоминание в день платежа — через уже подключённые expo-notifications (Рекомендация).
- Открыто: база долей — план или факт (вопрос 3); где живёт «Бюджет» (вопрос 2).

### 5.6 Здоровье → Сводка

```
┌ Здоровье                              ⚙ ┐
│ Последний замер: 17 октября             │
│ ┌ Вес                     ╱╲_╱‾╲__     ┐ │
│ │ 82,4 кг   −0,3 кг с прошлого замера  │ │
│ │ Цель 78,0 кг · осталось 4,4 кг       │ │
│ │ ███████████░░░░░░░░░░░               │ │
│ └──────────────────────────────────────┘ │
│ ┌ Процент жира  21,8 %   −0,2 % …      ┐ │
│ ┌ Талия         88,0 см  −0,5 см …     ┐ │
│ Подсказки                        1 из 2  │
│ Health Connect · обновлено в 08:12   (+) │
└ [▣ Финансы]            [♥ Здоровье]       ┘
```

- Три карточки в постоянном порядке, мини-график в каждой. Сверху — самое важное: в новой вкладке Today у Oura оценки закреплены наверху, ниже — подробности ([блог Oura](https://ouraring.com/blog/new-oura-app-experience/), по выдержке поиска). В «Сводке» Apple Health — закреплённые категории, тенденции и «важное» (сторонние сайты: [Cassinelli](https://matthewcassinelli.com/shortcuts/folders/ios-18/health-app/), [MacRumors](https://macrumors.com/guide/health), по выдержке поиска). Подробный график держит тот же стиль, что и маленький, — так устроены Health Trends ([HIG Charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data), страница открыта).
- Мнение: настраивать набор карточек не нужно. У Samsung Health карточки можно добавлять, убирать и двигать ([Samsung](https://www.samsung.com/ca/support/mobile-devices/galaxy-phone-use-and-manage-trackers-in-samsung-health/), по выдержке поиска), но при трёх показателях это лишнее.
- Изменение — нейтральным цветом и со словами «с прошлого замера» (решения 2026-10-17, health-module.md).
- «+ Новый замер» становится FAB вместо большой кнопки сверху (принцип 2).
- Health Connect: когда подключён — одна строка статуса; карточка — только когда нужно действие.

### 5.7 Здоровье → Новый замер

Лист: три строки «Вес / Процент жира / Талия» с прошлым значением серым, нажатая строка активна; та же цифровая клавиатура; дата чипами; «Сохранить» доступна, когда заполнено хотя бы одно поле. Диапазоны из `kinds.ts` проверяются сразу при вводе, а не после «Сохранить» — HIG «Dynamically validate field values» ([HIG Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data), страница открыта).

### 5.8 Здоровье → тренд с целью

```
┌ ‹ Вес                                 ⋮ ┐
│ 82,4 кг                                 │
│ 17 октября · −0,3 кг с прошлого замера  │
│ За 3 месяца: −3,2 кг                    │
│ [ Месяц ][ 3 мес ][ Год ][ Всё ]        │
│ ●─●─●─●─●─●─●─●─●─●─●─●─●─●        86   │
│                                    82   │
│ - - - Цель 78,0 - - - - - - - -    78   │
│ 18 июл.                      17 окт.    │
│ Цель: 78,0 кг                 Изменить  │
│ Все замеры                              │
│ 17 октября                    82,4 кг   │
└─────────────────────────────────────────┘
```

- Периоды кнопками, как в Stocks (день, три месяца, пять лет — пример из [HIG Charts](https://developer.apple.com/design/human-interface-guidelines/charts), страница открыта).
- Ось Y охватывает данные и цель, не от нуля (там же).
- Удаление замера — снекбар «Замер удалён · Отменить».
- Цель необязательна (вопрос 7). Прогресс в карточке = (старт − сейчас) / (старт − цель).

### 5.9 Экран блокировки

```
┌──────────────────────────────┐
│            [замок]            │
│           Ecosystem           │
│    Приложение заблокировано   │
│    [ ⌾ Разблокировать ]       │
│ ┌ системное окно Android ───┐ │
│ │ Вход в Ecosystem          │ │
│ │ (отпечаток)               │ │
│ │ Использовать PIN-код      │ │
└──────────────────────────────┘
```

- Вариант A (Рекомендация): блокировка телефона. BiometricPrompt с `BIOMETRIC_STRONG | DEVICE_CREDENTIAL` — отпечаток или лицо, а если не вышло — PIN, графический ключ или пароль телефона ([Android: Biometric auth](https://developer.android.com/identity/sign-in/biometric-auth), страница открыта); в Expo это expo-local-authentication, на Android он использует Biometric Prompt ([Expo docs](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/unversioned/sdk/local-authentication.mdx), страница открыта). Своего кода нет — нечего забыть. Для данных только на телефоне это важно: в Telegram забытый код приложения значит переустановку («you'll need to delete and reinstall the app» — [strings.xml](https://raw.githubusercontent.com/DrKLO/Telegram/master/TMessagesProj/src/main/res/values/strings.xml), страница открыта); у нас это потеря всей истории, если нет копии.
- Вариант B: свой PIN из 4–6 цифр + отпечаток; клавиатура — та же, что в 5.4. Revolut: вход в приложение отпечатком или Face ID и код ([справка Revolut](https://help.revolut.com/help/profile-and-plan/log-in-issues/sign-in-with-face-id-or-fingerprint/), по выдержке поиска; длину кода источники называют по-разному — 6 или 4 цифры).
- Экран сам открывает системное окно; кнопка — для повтора.
- Автоблокировка: сразу / 1 мин / 5 мин / 1 час. В Telegram: выключено, 1 мин, 5 мин, 1 час, 5 часов ([PasscodeActivity.java](https://raw.githubusercontent.com/DrKLO/Telegram/master/TMessagesProj/src/main/java/org/telegram/ui/PasscodeActivity.java), страница открыта).
- Скрывать содержимое в списке недавних. expo-screen-capture ставит окну флаг FLAG_SECURE ([ScreenCaptureModule.kt](https://raw.githubusercontent.com/expo/expo/main/packages/expo-screen-capture/android/src/main/java/expo/modules/screencapture/ScreenCaptureModule.kt), страница открыта); по справке Android этот флаг не даёт содержимому попасть на скриншоты и незащищённые экраны ([FLAG_SECURE](https://developer.android.com/reference/android/view/WindowManager.LayoutParams#FLAG_SECURE), страница открыта). Про список недавних справка не пишет; Telegram описывает свою настройку так: содержимое скрыто в списке недавних, но скриншоты делать нельзя («you won't be able to take screenshots», strings.xml, страница открыта). Как поведёт себя список недавних на телефоне пользователя — проверить. Вопрос 6.
- HIG: не делать в приложении отдельный выключатель биометрии (её включают в системе) и не называть свой код словом «passcode», которым Apple называет код разблокировки устройства, — иначе его примут за тот же код ([HIG Managing accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts), страница открыта). Поэтому в настройках один выключатель — «Блокировка входа».

### 5.10 Первый запуск (только когда нет ни одного счёта)

```
┌ Шаг 2 из 3                  Пропустить ┐
│ Первый счёт                            │
│ С него начнутся записи.                │
│ (Карта) (Наличные) (Сбережения)        │
│ Название: Карта                        │
│ Сколько на нём сейчас                  │
│ 1 250,00 BYN                           │
│ Валюта — белорусский рубль (BYN)       │
│ [клавиатура]                           │
│ [              Дальше              ]   │
└────────────────────────────────────────┘
```

- Шаги: 1) «Финансы и здоровье. Данные хранятся только на этом телефоне» → «Начать»; 2) первый счёт; 3) «Защитить вход?» → «Включить» / «Позже». Рост и пол спрашиваются тогда, когда нужны (как сейчас).
- HIG: онбординг быстрый и по возможности необязательный; необязательную настройку откладывать; учить действием ([HIG Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding), страница открыта); аккаунт требовать, только если без него нельзя ([HIG Managing accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts), страница открыта) — у нас аккаунта нет совсем. Duolingo даёт пройти первое упражнение до регистрации (сторонний разбор [Appcues](https://goodux.appcues.com/blog/duolingo-user-onboarding), по выдержке поиска; официального источника не нашёл).
- Валюта не выбирается: приложение работает только в BYN (`APP_CURRENCY` в money.ts) — строка просто сообщает. HIG Settings: не спрашивать того, что можно узнать иначе.
- После шагов пустые «Записи» предлагают две вещи: «Добавьте первую запись кнопкой «+»» и «Перенести историю из старого приложения» (импорт вставкой текста — решение 2026-10-18).

### 5.11 Настройки и безопасность

```
┌ ‹ Настройки                            ┐
│ БЕЗОПАСНОСТЬ                           │
│ Блокировка входа                [ ●]   │
│ Автоблокировка          через 1 мин  › │
│ Скрывать в недавних             [● ]   │
│ ДАННЫЕ                                 │
│ Резервная копия       вчера, 21:40   › │
│ Импорт истории                       › │
│ ФИНАНСЫ: Счета · Категории · Регулярные│
│ ЗДОРОВЬЕ: Рост и пол · Health Connect  │
└────────────────────────────────────────┘
```

- Группы с заголовками, длинные группы — на подэкраны, текущее значение — подписью у строки ([Android: Settings](https://developer.android.com/design/ui/mobile/guides/patterns/settings), страница открыта).
- Чего нет и почему: темы (как в телефоне), вибрации (системная настройка), размера шрифта (системный), выключателей модулей (решение 2026-10-17), версии приложения — Android советует не класть сведения о приложении в настройки (та же страница), их место — экран «О приложении» в меню ⋮.
- Резервная копия — файл через «Поделиться» (expo-sharing уже в зависимостях apps/mobile); восстановление — выбор файла (expo-document-picker в package.json нет). Нативные модули из этого документа, которых нет в package.json: expo-haptics ~57.0.1, expo-local-authentication ~57.0.2, expo-screen-capture ~57.0.1, expo-document-picker ~57.0.1 (версии для SDK 57 — `node_modules/expo/bundledNativeModules.json`); после добавления нужна пересборка APK. Формат и шифрование копии — не дизайн, это часть безопасности.

## 6. Скорость и ощущение

**Факты.**
- До 0,1 с — мгновенно, до 1 с — внимание не прерывается и особая обратная связь не нужна, 10 с — предел внимания ([NN/g](https://www.nngroup.com/articles/response-times-3-important-limits/), по выдержке поиска).
- Если загрузка короче 1 с, ни скелет, ни спиннер не нужны, их мелькание раздражает ([NN/g: Skeleton screens](https://www.nngroup.com/articles/skeleton-screens/), по выдержке поиска); крутящийся индикатор — для ожиданий 2–10 с, дольше — процент выполнения ([NN/g: Progress indicators](https://www.nngroup.com/articles/progress-indicators/), по выдержке поиска).
- HIG: показать что-то сразу; индикатор — когда загрузка длится дольше «момента-двух» ([HIG Loading](https://developer.apple.com/design/human-interface-guidelines/loading), страница открыта). Запускаться мгновенно, восстанавливать прошлое состояние, экран запуска делать почти таким же, как первый экран, и в текущей теме ([HIG Launching](https://developer.apple.com/design/human-interface-guidelines/launching), страница открыта).
- Android vitals считает чрезмерными холодный старт от 5 с, тёплый от 2 с, горячий от 1,5 с ([Android vitals](https://developer.android.com/google/play/vitals/launch-time), страница открыта). Метрики — TTID и TTFD; TTID видно в Logcat в строке «Displayed» ([Android: App startup time](https://developer.android.com/topic/performance/vitals/launch-time), страница открыта).
- При 60 кадрах в секунду на кадр есть 16,67 мс; занятый JS-поток задерживает реакцию на касания ([RN Performance](https://raw.githubusercontent.com/facebook/react-native-website/main/docs/performance.md), страница открыта).
- Оптимистичное обновление интерфейса — хук `useOptimistic` в React 19 ([react.dev](https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/reference/react/useOptimistic.md), страница открыта); пример — отправка сообщения в Telegram (5.4).
- Снекбар с действием в M3 по умолчанию не исчезает сам (`showSnackbar` ставит `Indefinite`, если есть `actionLabel`); без действия — 4 с (Short) или 10 с (Long) с поправкой на настройки доступности (`calculateRecommendedTimeoutMillis`) ([SnackbarHost.kt](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/SnackbarHost.kt), страница открыта).

**Что видно в коде сейчас** (прочитано; на телефоне не проверял, ничего не измерял):
1. `useAsyncData` ставит `loading = true` при каждом `refresh`, экраны передают его в `RefreshControl refreshing={loading}`, а `useRefreshOnFocus` вызывает `refresh` при каждом возврате на экран → индикатор «потяните, чтобы обновить» включается при каждом возврате.
2. При смене месяца в «Записях» старые данные остаются до прихода новых: подпись месяца уже новая, цифры ещё прошлого месяца.
3. Корневой `_layout.tsx` показывает `ActivityIndicator`, пока идут миграции и `prepare` всех модулей.
4. В app.json нет настроек экрана запуска; у плагина expo-splash-screen фон по умолчанию #ffffff ([Expo docs](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/unversioned/sdk/splash-screen.mdx), страница открыта) — в тёмной теме возможна белая вспышка при старте (не проверено).
5. Удаление записи и замера — двойным нажатием.

**Рекомендации.**

| Приём | Как | Опора |
|---|---|---|
| Старое, пока грузится новое | Индикатор обновления — только когда пользователь потянул сам; фоновые перечитывания — тихо | NN/g (меньше 1 с — без индикатора); HIG Loading |
| Смена месяца | Старые цифры приглушить (прозрачность 0,4) до прихода новых; скелет — только если дольше 1 с | NN/g; правило dataviz «Refetch keeps the frame» |
| Оптимистичное сохранение | Закрыть лист сразу, вставить строку в список, писать в SQLite в фоне; ошибка — снекбар «Повторить» | Telegram; `useOptimistic` |
| Удаление | Сразу + «Отменить» | Android Snackbar; HIG Feedback |
| Старт | В `prepare` — только обязательное; цвет экрана запуска = фон темы (#ffffff / #1a1a19 через `dark.backgroundColor`) | HIG Launching; Expo splash-screen |
| Восстановление | Открывать последний модуль, вкладку и месяц | HIG Launching |
| Движение | До 300 мс, не блокирует ввод; «Убрать анимацию» соблюдается | HIG Motion; WCAG 2.3.3 |
| Замер, а не догадки | TTID (Logcat «Displayed»), время «+ → клавиатура готова», «Сохранить → строка в списке» — до и после изменений; цифры записывать в notes | CLAUDE.md: «Measure before optimising»; Android: App startup time |

## Вопросы к пользователю

1. Тёмная тема: выбранное и главные кнопки — жёлтые, как в привычном приложении (так на макетах), или почти белые, как сейчас?
2. «Бюджет»: кнопкой в шапке «Финансов» (на макетах) или четвёртой вкладкой «Записи · Графики · Отчёты · Бюджет»?
3. Доли дохода считать от плана (ожидаемый доход; по умолчанию — доход прошлого месяца) или от фактически пришедших денег?
4. Экран «Сводка» нужен сейчас или когда появится третий модуль? С чего открывать приложение: с последнего экрана (предложение), с «Записей» или со «Сводки»?
5. Вернуть экран «Настройки» — без выключателей, по ⚙ в шапке?
6. Блокировка: через блокировку телефона (предложение — нечего забыть) или свой PIN приложения? Автоблокировка: сразу, через 1 или 5 минут? Скрывать содержимое в недавних — тогда внутри приложения нельзя делать скриншоты, а скриншоты нужны для отзывов?
7. Цель для веса (и других замеров) нужна или «Здоровье» остаётся без целей?
8. Регулярный платёж: напоминание и «Оплачено» одной кнопкой или запись создаётся сама в день платежа?
9. Нужен ли калькулятор в поле суммы (12,50 + 3,20)?
10. Название на телефоне сейчас «mobile» (decisions.md, 2026-10-17) — поменять на «Ecosystem»?
11. Поле экрана 16 dp вместо 20 (+8 dp под суммы на экране 360 dp) — подходит?

## Источники

**Репозиторий (только чтение):** `packages/core/src/theme.ts`, `SegmentedControl.tsx`, `TextField.tsx`, `useAsyncData.ts`, `types.ts`; `packages/finance/src/components/*.tsx`, `screens/*.tsx`, `lib/money.ts`, `seed.ts`; `packages/health/src/screens`, `components`, `lib/kinds.ts`, `lib/tips.ts`; `apps/mobile/app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app.json`, `package.json`, `modules.ts`; `notes/decisions.md`, `roadmap.md`, `health-module.md`; `node_modules/expo/bundledNativeModules.json`.

**Android (страница открыта):**
- https://developer.android.com/develop/ui/compose/components/navigation-bar
- https://developer.android.com/develop/ui/compose/components/fab
- https://developer.android.com/develop/ui/compose/components/snackbar
- https://developer.android.com/develop/ui/compose/components/segmented-button
- https://developer.android.com/develop/ui/compose/components/chip
- https://developer.android.com/develop/ui/compose/designsystems/material3
- https://developer.android.com/guide/topics/ui/accessibility/apps
- https://developer.android.com/design/ui/mobile/guides/layout-and-content/grids-and-units
- https://developer.android.com/design/ui/mobile/guides/patterns/settings
- https://developer.android.com/develop/ui/views/haptics/haptics-principles
- https://developer.android.com/reference/android/view/HapticFeedbackConstants
- https://developer.android.com/google/play/vitals/launch-time
- https://developer.android.com/topic/performance/vitals/launch-time
- https://developer.android.com/about/versions/14/features
- https://developer.android.com/identity/sign-in/biometric-auth
- https://developer.android.com/reference/android/view/WindowManager.LayoutParams#FLAG_SECURE
- Исходники Compose Material 3 (androidx): https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/ — `tokens/MotionTokens.kt`, `tokens/ShapeTokens.kt`, `tokens/NavigationBarTokens.kt`, `tokens/FabBaselineTokens.kt`, `tokens/SheetBottomTokens.kt`, `tokens/ElevationTokens.kt`, `tokens/ScrimTokens.kt`, `tokens/SnackbarTokens.kt`, `Snackbar.kt`, `SnackbarHost.kt`, `Scaffold.kt`
- Material Components for Android: https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/Snackbar.md, https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/BottomNavigation.md
- Material Symbols, лицензия: https://raw.githubusercontent.com/google/material-design-icons/master/README.md
- m3.material.io из облака закрыт (403) — его положения взяты из страниц developer.android.com и исходников выше.

**Apple HIG (страница открыта, через JSON-версию `developer.apple.com/tutorials/data/design/human-interface-guidelines/<страница>.json`):**
- https://developer.apple.com/design/human-interface-guidelines/tab-bars
- https://developer.apple.com/design/human-interface-guidelines/loading
- https://developer.apple.com/design/human-interface-guidelines/launching
- https://developer.apple.com/design/human-interface-guidelines/onboarding
- https://developer.apple.com/design/human-interface-guidelines/feedback
- https://developer.apple.com/design/human-interface-guidelines/entering-data
- https://developer.apple.com/design/human-interface-guidelines/charts
- https://developer.apple.com/design/human-interface-guidelines/charting-data
- https://developer.apple.com/design/human-interface-guidelines/activity-rings
- https://developer.apple.com/design/human-interface-guidelines/managing-accounts
- https://developer.apple.com/design/human-interface-guidelines/settings
- https://developer.apple.com/design/human-interface-guidelines/accessibility
- https://developer.apple.com/design/human-interface-guidelines/typography
- https://developer.apple.com/design/human-interface-guidelines/motion
- https://developer.apple.com/design/human-interface-guidelines/playing-haptics
- https://developer.apple.com/design/human-interface-guidelines/dark-mode
- https://developer.apple.com/design/human-interface-guidelines/sheets

**WCAG 2.2 (исходники W3C на GitHub, страница открыта; https://www.w3.org/TR/WCAG22/ из облака закрыт):**
- https://raw.githubusercontent.com/w3c/wcag/main/guidelines/terms/20/relative-luminance.html
- https://raw.githubusercontent.com/w3c/wcag/main/guidelines/terms/20/contrast-ratio.html
- https://raw.githubusercontent.com/w3c/wcag/main/guidelines/terms/20/large-scale.html
- https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/20/contrast-minimum.html
- https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/21/non-text-contrast.html
- https://raw.githubusercontent.com/w3c/wcag/main/understanding/21/non-text-contrast.html
- https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/22/target-size-minimum.html
- https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/21/target-size-enhanced.html
- https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/20/use-of-color.html
- https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/21/animation-from-interactions.html

**Expo, React Native, React (страница открыта):**
- https://raw.githubusercontent.com/expo/expo/main/packages/expo-haptics/src/Haptics.types.ts
- https://raw.githubusercontent.com/expo/expo/main/packages/expo-haptics/android/src/main/java/expo/modules/haptics/HapticsModule.kt
- https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/unversioned/sdk/local-authentication.mdx
- https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/unversioned/sdk/screen-capture.mdx
- https://raw.githubusercontent.com/expo/expo/main/packages/expo-screen-capture/android/src/main/java/expo/modules/screencapture/ScreenCaptureModule.kt
- https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/unversioned/sdk/splash-screen.mdx
- https://raw.githubusercontent.com/expo/expo/main/docs/pages/router/advanced/modals.mdx
- https://raw.githubusercontent.com/facebook/react-native-website/main/docs/accessibilityinfo.md
- https://raw.githubusercontent.com/facebook/react-native-website/main/docs/text.md
- https://raw.githubusercontent.com/facebook/react-native-website/main/docs/text-style-props.md
- https://raw.githubusercontent.com/facebook/react-native-website/main/docs/performance.md
- https://raw.githubusercontent.com/reactjs/react.dev/main/src/content/reference/react/useOptimistic.md

**Telegram для Android, исходный код (страница открыта):**
- https://raw.githubusercontent.com/DrKLO/Telegram/master/TMessagesProj/src/main/java/org/telegram/ui/PasscodeActivity.java
- https://raw.githubusercontent.com/DrKLO/Telegram/master/TMessagesProj/src/main/res/values/strings.xml
- https://raw.githubusercontent.com/DrKLO/Telegram/master/TMessagesProj/src/main/java/org/telegram/ui/Cells/ChatMessageCell.java

**Приложения и исследования (по выдержке поиска; сайты из облака закрыты):**
- Monzo: https://monzo.com/help/us-pots/us-what-is-salary-sorter/ · https://monzo.com/help/budgeting-overdrafts-savings/web-bill-pots · https://monzo.com/help/budgeting-overdrafts-savings/trends-spending-and-balance-web
- Copilot Money: https://help.copilot.money/en/articles/3760068-create-recurrings · https://help.copilot.money/en/articles/9504513-categories-tab-overview · https://intercom.help/copilotmoney/en/articles/6045480-dashboard-tab-overview
- YNAB: https://support.ynab.com/en_us/assigning-your-money-a-guide-SypgkrNJi
- Revolut: https://www.revolut.com/blog/post/introducing-spending-analytics/ · https://help.revolut.com/help/app-features/budgeting-and-analytics/how-does-the-analytics-feature-work/ · https://help.revolut.com/help/profile-and-plan/log-in-issues/sign-in-with-face-id-or-fingerprint/
- Oura: https://ouraring.com/blog/new-oura-app-experience/
- Samsung Health: https://www.samsung.com/ca/support/mobile-devices/galaxy-phone-use-and-manage-trackers-in-samsung-health/
- Apple Health (сторонние сайты): https://matthewcassinelli.com/shortcuts/folders/ios-18/health-app/ · https://macrumors.com/guide/health
- Duolingo: https://blog.duolingo.com/how-duolingo-streak-builds-habit · https://goodux.appcues.com/blog/duolingo-user-onboarding (сторонний разбор)
- Nielsen Norman Group: https://www.nngroup.com/articles/response-times-3-important-limits/ · https://www.nngroup.com/articles/skeleton-screens/ · https://www.nngroup.com/articles/progress-indicators/ · https://www.nngroup.com/articles/confirmation-dialog/
- Google Fit смотрел (цели Heart Points по рекомендациям AHA и ВОЗ — https://blog.google/products/google-fit/new-year-2021-fitness-goals/, по выдержке поиска), но в предложения он не вошёл: целей активности в MVP нет.
