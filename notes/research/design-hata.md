> Отчёт агента-дизайнера от 2026-10-22…24: цвета «Хаты», тёмная тема, значки, фон. Макеты — design-hata-mockups.html в этой папке. Решения ждут пользователя — см. [[decisions]], 2026-10-24.

# «Хата»: цвета, тема, вкладки и фон — предложение дизайнера

Дата: 2026-10-22, закончено 2026-10-24. Роль: дизайнер команды. Статус: предложение, решений владельца по нему нет.
Код читал из ветки `feature/brand` (коммит `c133b52`), заметки — из `max/jolly-feynman-ykq4yw`. Репозиторий только читался.
Макеты: `облако сессии: team2/design-mockups.html`, снимок: `облако сессии: team2/design-mockups.png`.

**Как читать.** «(страница открыта)» — я загрузил страницу или файл сам. «(по выдержке поиска)» — видел только пересказ поисковика. «(прочитано в node_modules)» — файл установленного пакета. «Мнение» — моё предложение, не факт. «Я не могу это подтвердить» — проверить не смог.

## Коротко

- **Красный — действие.** Главные кнопки, «+», выбранный сегмент и чип — фирменный красный #D22730 с белым текстом (5,16:1). Так в обеих темах.
- **Красный текст — только проблема, и всегда со значком ⚠ и словом.** Он темнее красного бренда в светлой теме (#A8141E) и светлее в тёмной (#FF8A8F). Залитая красная кнопка «Удалить» запрещена.
- **Зелёный — «плюс» и «в процессе».** Доход со знаком «+» (#00782F / #4CC77A), плашка «Продолжить» (#00782F). Фирменный #009739 — только в узорах и точке «в сети»: для мелкого текста на белом он слишком светлый (3,83:1).
- **Красный и зелёный нельзя различать только по цвету.** Для дальтоников-дейтеранопов они почти одинаковы (расчёт ниже: ΔE 2,4). Смысл несут знак «+»/«−», слово и значок.
- **Жёлтого больше нет.** `accent` и FAB были жёлтыми (#f5c542) — владелец жёлтый отверг. Жёлтый остаётся только в 4-м цвете графиков (это данные, не акцент).
- **Переключатель темы** «Системная / Светлая / Тёмная» — на экране «Настройки» по ⚙ в шапке каждого модуля. Выбор хранится в уже существующем `settingsStorage` и читается синхронно до первого кадра.
- **Значки вкладок** — SVG через уже установленный react-native-svg, рисунки из Material Symbols (Apache 2.0). `@expo/vector-icons` в проекте **не установлен** — бриф предполагал обратное.
- **«Красивый фон»** — шапка модуля с мягким градиентом и почти прозрачным мотивом «окно» (ромб в ромбе из знака). Один SVG ≈ 1 КБ, без картинок.
- **Флаг не повторяем:** нет красной полосы над зелёной, нет вертикального орнамента у края, красный и зелёный не касаются.

## 1. Цвета

### 1.1 Как считал контраст

Формула WCAG 2.x: относительная яркость L = 0,2126·R + 0,7152·G + 0,0722·B. Каналы sRGB сначала линеаризуются: c ≤ 0,04045 → c/12,92, иначе ((c + 0,055)/1,055)^2,4. Контраст = (L светлого + 0,05) / (L тёмного + 0,05). Определения — исходники W3C: [relative luminance](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/terms/20/relative-luminance.html), [contrast ratio](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/terms/20/contrast-ratio.html) (их открывал прошлый дизайнер, `notes/research/design.md`; сам я сегодня не открывал). Пороги: текст 4,5:1 ([WCAG 1.4.3](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/20/contrast-minimum.html)), рамки, значки и состояния — 3:1 ([WCAG 1.4.11](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/21/non-text-contrast.html)).

Пример для красного бренда #D22730 на белом:

| Канал | Значение | /255 | Линейное |
|---|---|---|---|
| R | 210 | 0,8235 | 0,6445 |
| G | 39 | 0,1529 | 0,0203 |
| B | 48 | 0,1882 | 0,0296 |

L = 0,2126·0,6445 + 0,7152·0,0203 + 0,0722·0,0296 = 0,1537. Контраст с белым (L = 1): 1,05 / 0,2037 = **5,16**.

Считал своим скриптом `облако сессии: team2/tools/wcag.py`. Проверка скрипта: он повторяет числа из комментариев `theme.ts` — 5,07; 4,66; 3,26; 6,08; 6,81; 6,90. Все таблицы ниже напечатал `tools/tokens.py` из той же папки.

### 1.2 Цвета бренда сами по себе

Цвета — из таблицы статьи «Flag of Belarus»: красный Pantone 1795 C = #D22730, зелёный Pantone 355 C = #009739 ([Википедия](https://en.wikipedia.org/wiki/Flag_of_Belarus), по выдержке поиска: из облака Википедия не открылась). Те же значения записаны в `apps/mobile/assets/brand/README.md`.

| Пара | Контраст | Что значит |
|---|---|---|
| #D22730 на белом | 5,16 | Белый текст на красной кнопке — можно |
| #009739 на белом | 3,83 | Мелкий зелёный текст на белом — **нельзя** (меньше 4,5). Белый текст на зелёной кнопке тоже нельзя |
| #009739 на #D22730 | **1,35** | Зелёное на красном не видно. Никогда не кладём одно на другое |
| #D22730 на старом тёмном фоне #1a1a19 | 3,38 | Красный текст на тёмном — **нельзя** (меньше 4,5) |
| #D22730 на новом тёмном фоне #141112 | 3,64 | Красная кнопка на тёмном видна (больше 3) |

**Красный на тёмном.** Заливка кнопок остаётся фирменной #D22730: белый текст на ней 5,16, сама кнопка к фону 3,64, к карточке 3,34, к дорожке сегмента 3,11 — всё не ниже 3. А красный *текст* в тёмной теме — светлый оттенок #FF8A8F (8,30 на фоне). Руководство Material (страница для Wear OS) прямо советует: «A dark theme should avoid using saturated colors, as they don't meet WCAG's accessibility standard of at least 4.5:1 for body text against dark surfaces. Saturated colors also produce optical vibrations against a dark background» ([developer.android.com](https://developer.android.com/design/ui/wear/guides/m2-5/styles/color), страница открыта).

**Зелёный на красном.** Как в знаке: между ними всегда белое. В интерфейсе зелёный и красный не касаются вообще. В фоне шапки зелёного нет (на макете зелёный поверх розового выглядел грязно-оливковым — проверено снимком).

### 1.3 Токены (тип `Theme` из `packages/core/src/theme.ts`)

| Токен | Сейчас светлая / тёмная | Предлагаю светлая | Предлагаю тёмная | Где |
|---|---|---|---|---|
| `background` | #ffffff / #1a1a19 | **#F6F4F2** | **#141112** | Фон экрана. Тёплый серый: на нём белые карточки видны без теней. Тёмный — с лёгким красным оттенком |
| `card` | #f5f5f7 / #262624 | **#FFFFFF** | **#1E1A1A** | Карточки, нижняя панель, поля ввода (Мнение: поле — `card`, а не `background`) |
| `fill` | #f0f0f2 / #2e2e2c | **#EEEAE7** | **#262020** | Чипы, дорожка сегмента, плитки категорий |
| `text` | #1c1c1e / #f2f2f0 | **#1F1A1A** | **#F5EFEE** | Основной текст |
| `textSecondary` | #3a3a3c / #d4d3cf | **#3E3736** | **#D8CFCE** | Заголовки дней, строки упражнений |
| `textMuted` | #6e6e73 / #a3a29d | **#69605F** | **#A99F9E** | Подписи. Теперь проходит и на `fill` (было 4,46 — меньше 4,5) |
| `separator` | #e5e5ea / #333331 | **#E6E1DE** | **#352E2E** | Линии между строками (украшение, порога нет) |
| `border` | #8e8e93 / #8e8e93 | **#8A817F** | **#8C8382** | Рамки полей и второстепенных кнопок |
| `link` | #1f62b3 / #6ea8f0 | #1F62B3 | #6EA8F0 | Ссылки, курсор, рамка поля в фокусе — без изменений |
| `primary` | #1c1c1e / #f2f2f0 | **#D22730** | **#D22730** | Главная кнопка, FAB, выбранный сегмент и чип, счётчик непрочитанного |
| `onPrimary` | #ffffff / #1a1a19 | #FFFFFF | **#FFFFFF** | Текст и значки на `primary` |
| `accent` | #f5c542 / #f5c542 | **#00782F** | **#00782F** | Плашка «в процессе» («Тренировка не закончена»), «Сохранено» |
| `onAccent` | #1c1c1e / #1a1a19 | **#FFFFFF** | **#FFFFFF** | Текст на `accent` |
| `danger` | #c62828 / #ff7a7a | **#A8141E** | **#FF8A8F** | Ошибки, перерасход — всегда со значком ⚠ и словом |
| `dangerBg` | #fdecea / #3a2020 | **#FCE8E8** | **#3D1A1D** | Фон плашки ошибки |
| `income` | #2e7d32 / #5cc46a | **#00782F** | **#4CC77A** | Суммы доходов со знаком «+» |

Новые токены (Мнение):

| Токен | Светлая | Тёмная | Где |
|---|---|---|---|
| `primarySoft` | #FBE3E4 | #4A1E22 | «Таблетка» активной вкладки, «+» у приёма пищи, метка «скоро» |
| `onPrimarySoft` | #8E1820 | #FFD7D9 | Значок и текст на `primarySoft` |
| `headerTint` | #FBE6E4 | #2B1618 | Верх градиента шапки модуля |
| `ornament` | rgba(210, 39, 48, 0.11), линия 0.20 | rgba(255, 138, 143, 0.08), линия 0.16 | Мотив «окно» в шапке. Украшение, порога нет |
| `brandRed` / `brandGreen` | #D22730 / #009739 | #D22730 / #009739 | Знак «Хаты», точка «в сети». Не для текста |

`chart` (Мнение: слоты не трогать, поменять только нейтральные):

| Поле | Светлая | Тёмная |
|---|---|---|
| `slots` | без изменений: #2a78d6, #eb6834, #1baf7a, #eda100, #e87ba4 | без изменений: #3987e5, #d95926, #199e70, #c98500, #d55181 |
| `other` | #aeaeb2 (без изменений) | #6b6a66 (без изменений) |
| `grid` | **#E6E1DE** | **#2C2626** |
| `baseline` | **#C9C2BE** | **#3A3333** |
| `selected` / `rest` | без изменений: #2a78d6 / #86b6ef | без изменений: #3987e5 / #184f95 |

### 1.4 Контраст каждой пары

✗ — ниже порога. Порог 4,5 — текст, 3 — рамки, значки, кнопки к фону.

| Текст / элемент | Фон | Порог | Светлая | Тёмная |
|---|---|---|---|---|
| `text` | `background` | 4,5 | 15,68 | 16,51 |
| `text` | `card` | 4,5 | 17,20 | 15,16 |
| `text` | `fill` | 4,5 | 14,38 | 14,10 |
| `text` | `headerTint` | 4,5 | 14,37 | 15,00 |
| `text` | `primarySoft` | 4,5 | 14,10 | 12,31 |
| `textSecondary` | `background` | 4,5 | 10,61 | 12,28 |
| `textSecondary` | `card` | 4,5 | 11,64 | 11,28 |
| `textSecondary` | `fill` | 4,5 | 9,73 | 10,49 |
| `textMuted` | `background` | 4,5 | 5,57 | 7,28 |
| `textMuted` | `card` | 4,5 | 6,11 | 6,68 |
| `textMuted` | `fill` | 4,5 | 5,11 | 6,21 |
| `textMuted` | `headerTint` | 4,5 | 5,10 | 6,61 |
| `link` | `background` | 4,5 | 5,54 | 7,62 |
| `link` | `card` | 4,5 | 6,08 | 7,00 |
| `link` | `headerTint` | 4,5 | 5,08 | 6,92 |
| `onPrimary` | `primary` | 4,5 | 5,16 | 5,16 |
| `onAccent` | `accent` | 4,5 | 5,63 | 5,63 |
| `danger` | `background` | 4,5 | 6,88 | 8,30 |
| `danger` | `card` | 4,5 | 7,54 | 7,62 |
| `danger` | `dangerBg` | 4,5 | 6,41 | 6,81 |
| `income` | `background` | 4,5 | 5,13 | 8,72 |
| `income` | `card` | 4,5 | 5,63 | 8,01 |
| `onPrimarySoft` | `primarySoft` | 4,5 | 7,48 | 10,65 |
| `border` | `background` | 3 | 3,46 | 5,08 |
| `border` | `card` | 3 | 3,80 | 4,67 |
| `primary` | `background` | 3 | 4,70 | 3,64 |
| `primary` | `card` | 3 | 5,16 | 3,34 |
| `primary` | `fill` (выбранный сегмент на дорожке) | 3 | 4,31 | 3,11 |
| `accent` | `background` | 3 | 5,13 | 3,33 |
| `accent` | `card` | 3 | 5,63 | 3,06 |
| `brandGreen` (точка «в сети») | `card` | 3 | 3,83 | 4,50 |
| `brandGreen` | `background` | 3 | 3,49 | 4,90 |
| `brandGreen` | `brandRed` | 3 | 1,35 ✗ | 1,35 ✗ |
| `brandRed` | `background` | 3 | 4,70 | 3,64 |
| `brandRed` | `card` | 3 | 5,16 | 3,34 |

Единственная пара ниже порога — зелёный на красном. Поэтому правило «не касаются».

Ещё пары с макетов: белые инициалы на аватарах «Мовы» — #256abf 5,39; #b8481c 5,27; #14805b 4,92; #b83e6a 5,34 (эти четыре цвета — мой подбор по оттенкам графиков, Мнение).

### 1.5 Графики на новых фонах

Проверил палитру скриптом навыка dataviz (`validate_palette.js`, симуляция дальтонизма Machado 2009) на новых фонах.
- Тёмная, фон #141112 и карточка #1E1A1A: всё PASS. Худшая соседняя пара для дальтоников ΔE 8,4, для обычного зрения 19,3; все пять цветов не ниже 3:1 (на карточке от 4,37 до 5,62).
- Светлая, карточка #FFFFFF: как сейчас — ΔE 9,1 и 19,6, три цвета ниже 3:1 (#1baf7a 2,82, #eda100 2,17, #e87ba4 2,69).
- Светлая, фон #F6F4F2: ниже 3:1 уже четыре цвета (добавился #eb6834, 2,92).

Вывод (Мнение): в светлой теме графики рисовать на белой карточке, а не на фоне экрана. Тогда всё как было проверено раньше. Значения и так дублируются текстом (решение 2026-10-17).

### 1.6 «danger» и «income» против красно-зелёного бренда

**Проблема.** Сейчас красный значит «плохо» (`danger`), зелёный — «доход» (`income`). Если бренд красно-зелёный, красная кнопка «Сохранить» рядом с красной ошибкой читается неоднозначно.

**Что показал расчёт.** Тем же скриптом dataviz:

| Пара | ΔE для дейтеранопа | ΔE обычное зрение |
|---|---|---|
| #D22730 ↔ #009739 (бренд) | **2,4** | 33,3 |
| #A8141E ↔ #00782F (danger ↔ income, светлая) | **2,9** | 28,5 |
| #FF8A8F ↔ #4CC77A (danger ↔ income, тёмная) | **3,0** | 27,6 |

Порог скрипта — 8 (ниже 6 — провал). Значит, человек с красно-зелёным дальтонизмом этих цветов почти не различит. Таких людей до 1 из 12 мужчин ([Википедия, «Color blindness», со ссылкой на NEI](https://en.wikipedia.org/wiki/Color_blindness), по выдержке поиска). Цвет здесь не может нести смысл в принципе (это и требование [WCAG 1.4.1](https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/20/use-of-color.html)).

**Решение — смысл по форме, а не по цвету.**

| Роль | Форма | Токен |
|---|---|---|
| Действие | **Залитая** красная фигура с белым текстом или значком: кнопка, «+», выбранный сегмент и чип | `primary` / `onPrimary` |
| Проблема | **Текст** со значком ⚠ и словом («перерасход», «не сохранилось»), на розовой плашке | `danger` на `dangerBg` |
| Удаление | Кнопка **с рамкой** и значком корзины, текст `danger`. Никогда не залитая. После удаления — «Отменить» (снекбар, предложение из `notes/research/design.md`) | `danger`, `border` |
| Доход | Знак **«+»** и зелёный текст | `income` |
| Расход | Знак **«−»** и обычный текст. Расход никогда не красный (так уже в `RecordsTab`) | `text` |
| В процессе / успех | Зелёная плашка с белым текстом и значком ▶ или ✓ | `accent` / `onAccent` |
| Фокус поля | Синяя рамка 2 px — **не красная**, чтобы красная рамка всегда значила ошибку | `link` |

Ещё: `danger` отделён от `primary` и по яркости — темнее в светлой теме (#A8141E против #D22730), светлее в тёмной (#FF8A8F). Зелёный дохода (#00782F / #4CC77A) — не фирменный #009739: фирменный остаётся для знака и узора.

## 2. Переключатель темы

**Что сейчас.** Тема только повторяет телефон: `useColorScheme()` в `useTheme` (`packages/core/src/theme.ts`), `userInterfaceStyle: "automatic"` в `app.json`. Владелец тёмную тему не нашёл (запись 2026-10-20 в `notes/roadmap.md`).

**Что советует Android.** «You can let users change the app's theme while the app is running. The following are recommended options: Light, Dark, System default (the recommended default option)» ([Android: Dark theme](https://developer.android.com/develop/ui/views/theming/darktheme), страница открыта).

**Где.** Значок ⚙ справа в шапке главного экрана каждого модуля открывает `/settings` — экран вне вкладок, в корневом стеке (`apps/mobile/app/settings.tsx`). Раздел «Оформление»: три плитки с миниатюрой — «Системная», «Светлая», «Тёмная». Выбранная — красная рамка 2 px и галочка, то есть не только цветом. Под плитками строка: «Как в настройках телефона. Сейчас в телефоне: светлая».
Важно: 2026-10-17 владелец убрал вкладку «Настройки» с выключателями модулей. Этот экран — не вкладка и без выключателей. Но это всё равно экран настроек — нужно его согласие (вопрос 1).
Если появится вкладка «Я» (её предлагает архитектор, `team2/architect.md`, раздел 1.3), ⚙ переедет туда.

**Как работает (Мнение, набросок).**

```ts
// packages/core/src/theme.ts
export type ThemePreference = "system" | "light" | "dark";
const PreferenceContext = createContext<{ preference: ThemePreference; setPreference(p: ThemePreference): void }>(…);

export function useTheme(): Theme {
  const system = useColorScheme();                  // как в телефоне
  const { preference } = useContext(PreferenceContext);
  const scheme = preference === "system" ? system : preference;
  return scheme === "dark" ? darkTheme : lightTheme;
}
```

- Хранение: ключ `app.theme` в `settingsStorage` (`packages/db/src/settings.ts`, это `SQLiteStorage` из `expo-sqlite/kv-store`). У него есть `getItemSync` — так уже читается профиль (`profile.ts`). Корневой `_layout.tsx` читает значение синхронно до первого кадра — тема не «мигает». `packages/core` не зависит от `@ecosystem/db`, поэтому провайдер получает `initial` и `onChange` из корневого макета.
- Нативные части Android (системные диалоги, выбор даты): на Android дополнительно вызвать `Appearance.setColorScheme(preference === "system" ? "unspecified" : preference)`. В установленном React Native 0.86.2 тип — `'light' | 'dark' | 'unspecified'` (`Appearance.d.ts`, прочитано в node_modules). Документация ветки main уже называет `'unspecified'` устаревшим и предлагает `'auto'` ([appearance.md](https://raw.githubusercontent.com/facebook/react-native-website/main/docs/appearance.md), страница открыта) — это для более новой версии RN. На Android вызов уходит в `AppCompatDelegate.setDefaultNightMode` (`AppearanceModule.kt`, прочитано в node_modules).
- Риск: «Starting with AppCompat v1.1.0, setDefaultNightMode() automatically recreates any started activities» (та же страница Android). В нашем сгенерированном манифесте у `MainActivity` есть `uiMode` в `android:configChanges` (прочитал `apps/mobile/android/app/src/main/AndroidManifest.xml`). Пересоздаётся ли от этого экран при смене темы — **Я не могу это подтвердить**, проверить на телефоне. Если приложение «перезапускается» — убрать вызов `Appearance`, оставить только контекст.
- Веб: в react-native-web 0.21.4 у `Appearance` нет `setColorScheme` (прочитано в node_modules) — вызывать только при `Platform.OS !== "web"`.
- Строка состояния: `<StatusBar style={theme.dark ? "light" : "dark"} />` вместо `"auto"`.
- Фон корневого вида: `SystemUI.setBackgroundColorAsync(theme.background)` — «Changes the root view background color» (expo-system-ui 57.0.4, прочитано в node_modules; плагин уже в `app.json`). Мнение: убирает белую вспышку при переходах в тёмной теме; не проверено.
- Android 12+: «use `UiModeManager#setApplicationNightMode` to let the system know what theme your app runs. This lets the system match the theme during the splash screen» (страница Android открыта). Это нативный код — Мнение: позже.

## 3. Нижняя панель

### 3.1 Значки вместо эмодзи

**Сейчас.** Вкладки — эмодзи 💰 ❤️ 🍽️ (`icon` в `module.ts` каждого модуля), неактивная — прозрачность 0,5 (`apps/mobile/app/(tabs)/_layout.tsx`).

**Что установлено (проверил).**
- `@expo/vector-icons` **нет** ни в `apps/mobile/package.json`, ни в `node_modules` (папки `node_modules/@expo/vector-icons` нет, `nodeLinker: hoisted`). В списке SDK 57 (`node_modules/expo/bundledNativeModules.json`) он есть как `^15.0.2` — его поставил бы `npx expo install`. Лицензия 15.0.2 — MIT ([registry.npmjs.org](https://registry.npmjs.org/@expo/vector-icons/15.0.2), страница открыта).
- `expo-symbols` 57.0.2 **есть**, но не напрямую: его тянет `expo-router` 57.0.11 (`pnpm-lock.yaml`). Лицензия MIT (`LICENSE`). На Android и в вебе он рисует Material Symbols шрифтом: «On Android and web, it uses Material Symbols» ([docs, v57](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/symbols.mdx), страница открыта). Шрифт — пакет `@expo-google-fonts/material-symbols` 0.4.42, `"license": "MIT AND Apache-2.0"`, сам шрифт — Apache 2.0 (`LICENSE_FONT`). Файл одного начертания — **962 012 байт** (`ls`). `SymbolView` грузит шрифт через `loadAsync` в `useEffect` и до загрузки рисует пустой квадрат (`build/SymbolView.js`, прочитано) — значки появляются после первого кадра.
- `react-native-svg` 15.15.4 — прямая зависимость, MIT. Умеет `LinearGradient`, `Pattern`, `Mask` (прочитано в `ReactNativeSVG.d.ts`).

**Рекомендация (Мнение).** Компонент `Icon` в `packages/core` на react-native-svg, с десятком путей из Material Symbols Rounded. Лицензия: «We have made these icons available for you to incorporate into your products under the Apache License Version 2.0»; SVG лежат в папке `symbols` репозитория ([README](https://raw.githubusercontent.com/google/material-design-icons/master/README.md), страница открыта). Apache 2.0 требует отдать получателю копию лицензии (раздел 4(a), прочитано в `LICENSE_FONT`) — для этого строка «Лицензии» в «Настройках».
Почему не шрифт: новой зависимости нет, рисуется сразу, весит мало. Для сравнения: 22 значка в макете — 5 683 байта разметки (замерил скриптом `tools/measure.js`), шрифт — 962 012 байт. Значки в макете я нарисовал сам «в духе» Material Symbols; в приложение лучше взять настоящие пути.
`AppModule.icon` — вместо эмодзи имя значка из набора core (например, `"wallet" | "heart" | "restaurant" | "chat"`). Эмодзи категорий в «Финансах» остаются.

| Вкладка | Material Symbols (имя есть в `expo-symbols/build/android/symbols.json`) |
|---|---|
| Финансы | `account_balance_wallet` |
| Здоровье | `favorite` (или `monitor_heart`) |
| Еда | `restaurant` |
| Мова | `chat` + свой ромб внутри (Мнение) |
| Настройки | `settings` |

**Как выглядит.** Активная: «таблетка» `primarySoft`, закрашенный значок `onPrimarySoft`, подпись `text` жирная. Неактивная: контурный значок и подпись `textMuted`. Состояние видно по форме значка и начертанию, не только по цвету. Фон панели — `card`, сверху линия `separator`.

### 3.2 «Мова» и 4–5 вкладок

- Android: навигационная панель — для «Three to five destinations of equal importance» ([Android: Navigation bar](https://developer.android.com/develop/ui/compose/components/navigation-bar), страница открыта). Что делать, если разделов больше пяти, эта страница не говорит.
- Сейчас 3 вкладки. С «Мовой» — 4. Пятой (Мнение) — «Ещё»: туда уходят следующие модули. Архитектор предлагает «Мова · Сервисы · Я» (+ «Финансы»); панель из макета подходит к обоим вариантам. Решает владелец (вопрос 4).
- «Мова» первой — как «Чаты» у WeChat (вкладки Chats, Contacts, Discover, Me — [beijing-kids.com, 2018](https://www.beijing-kids.com/blog/2018/07/04/hey-wechat-powerful-social-app-change-internet-china/), по выдержке поиска; источник старый и слабый).
- Помещается ли: на ширине 360 пять вкладок по 72 dp, подписи 12 sp до 8 букв («Здоровье») помещаются — проверил отрисовкой макета в Chromium (шрифт Liberation Sans, не Roboto). На телефоне не проверял.

## 4. «Красивый фон»

Три варианта, все — один SVG в шапке главного экрана модуля (на макете — раздел «Фон шапки»):

| | Вариант | Что это |
|---|---|---|
| А | **«Окно»** (Мнение: этот) | Градиент `headerTint` → `background` высотой ≈ 236 dp. Справа вверху — большой контур ромба, в нём почти прозрачный ромб-окно и маленький контур. Тает книзу маской |
| Б | «Решётка» | Тонкие ромбы 30 dp, линия 1 px, тают книзу. Гладкие линии, не «пиксели» и не вышивка |
| В | Градиент | Только переход цвета |

- Цена: SVG варианта А — 1 052 байта разметки (замерил `tools/measure.js`). Картинок нет, анимации нет, рисуется один раз. Скорость на телефоне **не измерял** — Я не могу это подтвердить. Как замерить (правило проекта «сначала замер»): время до первого кадра (Logcat «Displayed») и время коммита главного экрана модуля в React Profiler — с фоном и без.
- Как встроить (Мнение): `ModuleHeader` в `packages/core` — заголовок 26/700, справа до двух значков по 44 dp, снизу место для сегмента; под ним `HeaderBackdrop` (react-native-svg: `LinearGradient`, `Mask`, `Path`). Главный экран модуля прячет системную шапку (`headerShown: false`). Шапка заходит под строку состояния: в `styles.xml` она прозрачная (`android:statusBarColor` = transparent, прочитано) — нужен отступ `useSafeAreaInsets().top`. Внутренние экраны оставляют обычную шапку; в expo-router 57 у неё есть `headerBackground` («render as the background of the header… a gradient», `native-stack/types.d.ts`, прочитано) — туда вариант В.
- Остальное «красивое» без картинок: белые карточки на тёплом сером фоне; в тёмной теме — почти чёрный с красным оттенком; скругление карточек 16.
- **Не флаг.** Нет красной полосы над зелёной, нет вертикальной полосы орнамента у края, зелёный не касается красного, в узоре зелёного нет. Регистрировать как товарный знак обозначения, сходные с государственным флагом до степени смешения, по закону «О товарных знаках и знаках обслуживания» нельзя без согласия уполномоченного органа ([spinform](https://base.spinform.ru/show_doc.fwx?rgn=121395), [etalonline](https://etalonline.by/novosti/mnenie/gosudarstvennaya-simvolika-v-tovarnykh-znakakh/), [pravo.by](https://pravo.by/novosti/obshchestvenno-politicheskie-i-v-oblasti-prava/2016/april/4199/) — всё по выдержке поиска). Касается ли это оформления приложения, а не регистрации знака, — Я не могу это подтвердить. Это не юридическая консультация.

## 5. Компоненты в новой палитре

| Компонент | Сейчас | Предлагаю (Мнение) |
|---|---|---|
| `PrimaryButton` | `primary` почти чёрный / почти белый | Красный #D22730, белый текст 16/700, высота 48, радиус 12. На Android `android_ripple` белый 24 % |
| Второстепенная кнопка («Изменить») | Рамка `border` в `TrainingTab` | В core: рамка `border`, текст `text` |
| Удаление | Двойное нажатие | Рамка + значок корзины, текст `danger`; без заливки; затем «Отменить» |
| `Chip` | Выбранный — `primary` | Выбранный — красный и белый текст (к `fill` 4,31 / 3,11). Высота 36 + `hitSlop` до 48 |
| `SegmentedControl` | Выбранный — `primary` | То же: красная «таблетка», белый текст |
| `FloatingAddButton` | Жёлтый `accent`, «+» текстом | Красный `primary`, 56 dp, «+» значком SVG (ровно по центру), тень только в светлой теме, 16 dp от края. В «Мове» — карандаш |
| `TextField` | Фон `background`, фокус `link` | Фон `card`; фокус — синий, как сейчас; ошибка — рамка `danger` 2 px + текст с ⚠ |
| Карточка (новый `Card`) | Радиусы 12–14 в разных местах | `card`, радиус 16; в светлой — тонкая рамка `separator`, в тёмной — без рамки |
| Плашка «Тренировка не закончена» | Жёлтый `accent` | Зелёный #00782F, белый текст 5,63, значок ▶ |
| Плашка проблемы | — | `dangerBg`, текст `danger` 14/600, ⚠ слева, › справа |
| Нижняя панель | Эмодзи | SVG, «таблетка» `primarySoft` (раздел 3) |
| `ModuleHeader` (новый) | Системная шапка, «Бюджеты» ссылкой, 👤 эмодзи | Заголовок 26/700, «Бюджеты» кнопкой-таблеткой, 👤 и ⚙ значками, фон из раздела 4 |
| Счётчик непрочитанного («Мова») | — | `primary`, белые цифры 12/700; заглушённый чат — `fill` и `textSecondary` |
| Полоса нормы («Еда») | `chart.slots[0]` | Без изменений: синий и выше нормы (красного за еду нет) |
| Фигурки мышц | `chart.slots[1]` + `chart.other` | Без изменений: это цвета данных, не бренда |

Где был жёлтый: `accent` (FAB, плашка, метка вкладки в комментарии `theme.ts`). Всё заменено. Остаётся 4-й цвет графиков #eda100 / #c98500 — это данные. Если владельцу не понравится и он, палитру нужно будет снова проверить скриптом.

## 6. Макеты

Файл: `облако сессии: team2/design-mockups.html` — один файл, всё встроено, внешних запросов нет.
Экраны 390 × 844, каждый в светлой и тёмной теме: «Финансы» → «Записи»; «Здоровье» → «Тренировка»; «Еда» → день; «Настройки» → «Оформление»; «Мова» → список чатов (4 вкладки). Ниже — три варианта фона и панель на 360 dp с 3, 4 и 5 вкладками. Данные выдуманы.
Проверка: Playwright + Chromium, полный снимок 1240 × 6067 px — `облако сессии: team2/design-mockups.png`. 10 телефонов, ошибок в консоли 0, внешних запросов 0 (`tools/render.js`). По снимку исправил две вещи: цифры счётчика были серыми вместо белых (перебивал стиль строки); зелёный ромб в узоре выглядел оливковым — убран.

## 7. Вопросы владельцу

1. Экран «Настройки» по ⚙ (без выключателей модулей, только «Оформление», строки модулей, «О приложении») — можно?
2. Фон шапки: А «Окно», Б «Решётка» или В «Только градиент»?
3. Главные кнопки красные (на макетах) — или спокойнее: красные только «+» и выбранное, а кнопки — тёмные?
4. С «Мовой»: «Мова» первой или последней? Пятая вкладка — «Ещё» или «Сервисы» и «Я», как у архитектора?
5. Светлая тема: тёплый серый фон и белые карточки (на макетах) — или белый фон, как сейчас?

## Источники

**Репозиторий, только чтение (`feature/brand`, `c133b52`):** `packages/core/src/theme.ts`, `Chip.tsx`, `PrimaryButton.tsx`, `SegmentedControl.tsx`, `TextField.tsx`, `FloatingAddButton.tsx`, `types.ts`, `index.ts`, `package.json`; `apps/mobile/app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/finance/_layout.tsx`, `app.json`, `package.json`, `modules.ts`, `assets/brand/hata-icon.svg`, `assets/brand/README.md`; `packages/finance/src/screens/FinanceScreen.tsx`, `components/RecordsTab.tsx`, `MonthSwitcher.tsx`, `CategoryIcon.tsx`, `module.ts`, `seed.ts`; `packages/health/src/screens/HealthScreen.tsx`, `components/TrainingTab.tsx`, `BodyMap.tsx`, `module.ts`; `packages/food/src/screens/FoodDayScreen.tsx`, `components/DaySwitcher.tsx`, `lib/nutrition.ts`, `module.ts`; `packages/db/src/settings.ts`, `profile.ts`; `pnpm-workspace.yaml`, `pnpm-lock.yaml`. Заметки (`max/jolly-feynman-ykq4yw`): `notes/decisions.md`, `roadmap.md`, `research/design.md`, `research/design-mockups.html`. Сгенерированный `apps/mobile/android/app/src/main/AndroidManifest.xml` и `res/values/styles.xml` (не в git).

**node_modules (прочитано):** `react-native` 0.86.2 — `Libraries/Utilities/Appearance.js`, `Appearance.d.ts`, `ReactAndroid/.../AppearanceModule.kt`; `react-native-web` 0.21.4 — `dist/exports/Appearance/index.js`; `expo-symbols` 57.0.2 — `package.json`, `README.md`, `LICENSE`, `build/SymbolView.js`, `build/utils.js`, `build/android/symbols.json`; `@expo-google-fonts/material-symbols` 0.4.42 — `package.json`, `LICENSE_FONT`, `400Regular/`; `expo/bundledNativeModules.json`; `react-native-svg` 15.15.4 — `package.json`, `lib/typescript/ReactNativeSVG.d.ts`; `expo-system-ui` 57.0.4 — `build/SystemUI.d.ts`; `expo-router` — `build/react-navigation/native-stack/types.d.ts`, `bottom-tabs/types.d.ts`.

**Страница открыта:**
- https://developer.android.com/develop/ui/views/theming/darktheme
- https://developer.android.com/develop/ui/compose/components/navigation-bar
- https://developer.android.com/design/ui/wear/guides/m2-5/styles/color
- https://raw.githubusercontent.com/facebook/react-native-website/main/docs/appearance.md
- https://raw.githubusercontent.com/google/material-design-icons/master/README.md
- https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/symbols.mdx
- https://registry.npmjs.org/@expo/vector-icons/15.0.2

**По выдержке поиска (из облака не открылись или не открывал):**
- https://en.wikipedia.org/wiki/Flag_of_Belarus (цвета флага; Википедия из облака недоступна)
- https://en.wikipedia.org/wiki/Color_blindness (до 1 из 12 мужчин; ссылается на NEI)
- https://base.spinform.ru/show_doc.fwx?rgn=121395, https://etalonline.by/novosti/mnenie/gosudarstvennaya-simvolika-v-tovarnykh-znakakh/, https://pravo.by/novosti/obshchestvenno-politicheskie-i-v-oblasti-prava/2016/april/4199/ (государственная символика в товарных знаках)
- https://www.beijing-kids.com/blog/2018/07/04/hey-wechat-powerful-social-app-change-internet-china/ (вкладки WeChat; источник 2018 года)

**WCAG (ссылки из `notes/research/design.md`, сегодня не открывал):** relative-luminance, contrast-ratio, 1.4.1, 1.4.3, 1.4.11 — исходники W3C на raw.githubusercontent.com.

**Инструменты:** `tools/wcag.py`, `tools/tokens.py`, `tools/check.py`, `tools/render.js`, `tools/shots.js`, `tools/measure.js` в папке `облако сессии: team2/`; навык dataviz — `scripts/validate_palette.js`.
