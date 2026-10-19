# «Здоровье»: что взять у популярных приложений

> Проверено фактчекером команды 2026-10-19, исправления внесены в текст: [[fact-check-1]]. Напоминания: на Android 14 `SCHEDULE_EXACT_ALARM` по умолчанию не выдаётся новым установкам ([Android 14](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)), поэтому напоминания без точного времени могут приходить с опозданием.

Исследование для планировщика, 2026-10-18. Репозиторий только читался. Сайты производителей из облака почти все закрыты (403), поэтому многие факты взяты из выдержек поиска; открывались developer.android.com, developer.apple.com и raw.githubusercontent.com.

**Пометки.** «(страница открыта)»: страница скачана и прочитана. «(по выдержке поиска)»: видел только краткое изложение из поиска. «(файл открыт)»: файл в репозитории или в `node_modules`. «Рекомендация» и «Мнение» — мои предложения и оценки, а не факты.
**Объём (Мнение):** S — до дня работы, одна ветка, только JS; M — несколько дней или правка `app.json` с новой сборкой; L — новые нативные модули, вопросы приватности, много неизвестного.
**Колонка «Нативное»:** «нет» — только JS; «app.json» — новые разрешения или настройки, нужен `npx expo prebuild --platform android --clean` и новый APK, новых модулей нет; «модуль X ~v» — новый нативный модуль (версия для SDK 57 из `node_modules/expo/bundledNativeModules.json`, файл открыт). EAS Update не подключён (`notes/roadmap.md`), поэтому на телефон любое изменение попадает только с новым APK.

## Коротко
- Самое ценное и дешёвое — **линия тренда веса** (сглаживание как в «The Hacker's Diet»: тренд = вчерашний тренд + 10 % разницы), **темп за неделю по тренду** и **оценка даты достижения цели**. Всё это только JS, без новых модулей.
- **Напоминание о взвешивании раз в неделю**: `expo-notifications` уже в APK (его использует бюджет «Финансов»), еженедельный триггер в нём есть.
- Из Health Connect следующими стоит читать **шаги**, **сон** и **всю историю веса**. На Android 14 (SDK extension 20+) Health Connect сам считает шаги телефона, если хоть одно приложение получило `READ_STEPS`. Новые модули не нужны, только разрешения в `app.json` и новый APK.
- **Не брать:** «оценки готовности и восстановления» (Oura, WHOOP, Garmin), копию колец Apple, оценку HRV «хорошо/плохо».
- **Позже:** фото прогресса (приложение разрешает резервную копию Android в Google Drive, блокировки нет) и еда (база продуктов для Беларуси не подтверждена).

## 1. Что уже есть (файлы открыты)
- Замеры: вес, % жира, талия. График — одна линия по всем точкам, без тренда и выбора периода (`packages/health/src/components/LineChart.tsx`).
- Темп веса для подсказки NHS — разница двух взвешиваний: последнего и первого, сделанного не меньше 7 дней назад в пределах 4 недель (`weeklyWeightChangeKg` в `lib/tips.ts`). Одно «водное» взвешивание сдвигает темп.
- Health Connect: вес, % жира, рост; первое окно 29 дней; импорт при запуске (`onReady`). Статус «подключено», если открыт хотя бы один из трёх типов (`lib/healthConnect.android.ts`).
- Уже в APK (`apps/mobile/package.json`): `expo-notifications` 57.0.9, `react-native-android-widget` 0.21.0, `react-native-svg` 15.15.4, `react-native-health-connect` 4.1.3.
- В сгенерированном манифесте `android:allowBackup="true"` (`apps/mobile/android/app/src/main/AndroidManifest.xml`), см. раздел 5.

## 2. Популярность: свидетельства
| Приложение | Свидетельство | Источник |
|---|---|---|
| Apple Health | Встроено в iPhone: HealthKit — общее хранилище данных на iPhone и Apple Watch, всё видно в приложении «Здоровье» | [developer.apple.com](https://developer.apple.com/documentation/healthkit) (страница открыта) |
| Google Fit | Google заменяет его приложением Google Health до конца 2026 г.; API Google Fit работают до конца 2026 г. Число пользователей: Я не могу это подтвердить | [9to5google](https://9to5google.com/2026/05/07/google-fit-shut-down-health-replacement-migration-tool-coming/) (по выдержке поиска); баннер на [developer.android.com](https://developer.android.com/health-and-fitness/health-connect/get-started) (страница открыта) |
| Samsung Health | 500 млн+ установок из Google Play (2018) | [sammobile](https://www.sammobile.com/2018/08/02/samsung-health-500-million-installs-google-play-store/) (по выдержке поиска) |
| Fitbit → Google Health | С 19.05.2026 приложение Fitbit становится Google Health. Число пользователей: Я не могу это подтвердить | [support.google.com](https://support.google.com/googlehealth/answer/17068213) (по выдержке поиска) |
| Oura | 5,5 млн колец продано к сентябрю 2025 | [fiercehealthcare](https://www.fiercehealthcare.com/health-tech/oura-raises-900m-series-e-oura-ring-sales-catapult) (по выдержке поиска) |
| MyFitnessPal | 200 млн пользователей при продаже Under Armour; сейчас компания называет 280 млн. Это регистрации, а не активные пользователи | [businessofapps](https://www.businessofapps.com/?p=60999); [Википедия со ссылкой на компанию](https://en.wikipedia.org/wiki/MyFitnessPal) (по выдержке поиска) |
| Yazio | «Более 80 млн пользователей» (основатели); «100M+» в Google Play | [tu-ilmenau.de](https://www.tu-ilmenau.de/unionline/en/series/details/tu-spin-offs-what-became-of-1123); [similarweb](https://www.similarweb.com/app/google/com.yazio.android/austria/) (по выдержке поиска) |
| FatSecret | 12,9 млн активных пользователей за год (данные компании) | [foods.fatsecret.com](https://foods.fatsecret.com/) (по выдержке поиска) |
| Lose It! | «57+ млн пользователей» (страница App Store) | [App Store](https://apps.apple.com/app/lose-it-weight-loss-program-and-calorie-counter/id297368629) (по выдержке поиска) |
| Strava | 100 млн спортсменов (2020, объявление компании). Более новые цифры: Я не могу это подтвердить | [gearjunkie](https://gearjunkie.com/news/strava-passes-100-million-users) (по выдержке поиска) |
| Hevy | «11+ млн пользователей» | [hevyapp.com](https://www.hevyapp.com/about-us/) (по выдержке поиска) |
| Duolingo (образец серий) | 58,7 млн активных пользователей в день, 2-й квартал 2026 | [письмо акционерам, sec.gov](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm) (по выдержке поиска) |
| Garmin Connect, Withings, WHOOP, Happy Scale, Libra, Strong, MacroFactor | Я не могу это подтвердить | — |

## 3. Тренд веса, цель, темп
### 3.1 Как это описывают (факты)
- **The Hacker's Diet (Джон Уокер).** Тренд — экспоненциально сглаженное скользящее среднее, «10 % сглаживания»: A[d] = A[d−1] + 0,1 × (M[d] − A[d−1]) ([Pencil and Paper](https://www.fourmilab.ch/hackdiet/e4/pencilpaper.html), по выдержке поиска). Константа 0,9 по запаздыванию примерно равна 20-дневному простому среднему ([Signal and Noise](https://www.fourmilab.ch/hackdiet/e4/signalnoise.html), по выдержке поиска). Темп — наклон прямой, подобранной к тренду методом наименьших квадратов; за неделю — 7 × наклон за день. Ручной способ — разница трендов за месяц, делённая на 4: Я не могу это подтвердить (в выдержках поиска этого нет, fourmilab.ch из облака закрыт). Там же дефицит калорий считается по правилу «3500 ккал на фунт» — см. раздел 7.
- **Libra (Android).** Показывает только линию тренда, «как советует The Hacker's Diet» ([блог Withings, 2011](https://blog.withings.com/2011/03/09/withings-synchs-with-libra-an-android-app-for-weight-monitoring-2/)); есть цель и оценка времени до неё ([alternativeto](https://www.alternativeto.net/software/libra---weight-manager/about/)). Оба по выдержке поиска.
- **Happy Scale (iOS).** «Математика находит настоящий тренд», вариант со скользящим средним, прогноз веса при текущем тренде, разбивка цели на небольшие промежуточные цели ([App Store](https://apps.apple.com/app/id532430574), по выдержке поиска). Точная формула: Я не могу это подтвердить.
- **MacroFactor.** Пропущенные дни заполняются линейной интерполяцией; свежие значения в среднем весят больше; «тренд» показан отдельно от «весов сегодня» ([справка](https://help.macrofactorapp.com/dashboard/weight_trend/), по выдержке поиска).
- **TrendWeight** (открытый код): сглаживает дневные колебания, чтобы были видны изменения ([README](https://raw.githubusercontent.com/ervwalter/trendweight/main/README.md), страница открыта); дата и начало дня определяют, какой замер дня берётся ([ARCHITECTURE.md](https://raw.githubusercontent.com/ervwalter/trendweight/main/docs/ARCHITECTURE.md), страница открыта).
- **Withings.** Еженедельный отчёт по понедельникам: вес, изменение за неделю, цель и сколько до неё осталось ([справка](https://support.withings.com/hc/en-us/articles/206290947-Withings-App-Online-Dashboard-What-is-the-weekly-report)); цель задаётся вместе с темпом ([справка](https://support.withings.com/hc/en-us/articles/201491327-Withings-App-Online-Dashboard-Setting-a-target-weight)); в BodyPath (Withings+) показаны оценочная дата цели и до 3 дополнительных показателей ([справка](https://support.withings.com/hc/en-us/articles/47323926457617-Withings-App-Health-Tab-BodyPath)). Всё по выдержке поиска.
- **MyFitnessPal.** Советует взвешиваться раз в неделю в одинаковых условиях, например в понедельник в 9:00 до завтрака ([справка](https://support.myfitnesspal.com/hc/en-us/articles/360032272992-How-often-should-I-record-my-weight-and-other-measurements)). Дату цели не хранит: успеть к сроку может потребовать снижения «быстрее, чем полезно»; показывает только разовую оценку ([справка](https://support.myfitnesspal.com/hc/en-us/articles/360032271632-Where-can-I-find-my-target-date)). Оба по выдержке поиска.

### 3.2 Расчёт (моя арифметика, проверить тестами)
- α = 0,1: новое взвешивание весит 10 %; влияние старого замера падает вдвое за ln 0,5 / ln 0,9 ≈ 6,6 дня.
- Запаздывание при ровном снижении: (1 − α)/α = 9 дней. У 20-дневного простого среднего (20 − 1)/2 = 9,5 дня, что сходится с оценкой Уокера. При −0,5 кг/нед. тренд выше реального веса на 9 × 0,5 / 7 ≈ 0,64 кг.
- Шум: дисперсия случайных колебаний после сглаживания составляет α/(2 − α) ≈ 0,053 от исходной, то есть разброс меньше в 1/√0,053 ≈ 4,4 раза.
- Взвешивания нерегулярны (ручной ввод плюс импорт), поэтому вес нового замера стоит брать как α = 1 − 0,9^Δдней: через 2 дня 0,19, через неделю 0,52, через 2 недели 0,77. Мнение: так тренд не «застывает» при редких взвешиваниях; MacroFactor решает то же интерполяцией. Несколько замеров за день (весы через Health Connect) — сводить к одному значению дня.
- Оценка даты: недели = (цель − тренд) / темп. Пример: тренд 82,0 кг, цель 78,0 кг, темп −0,4 кг/нед. → 10 недель.

### 3.3 Функции
| Функция | Где есть | Подходит нам | Объём | Нативное | Рекомендация |
|---|---|---|---|---|---|
| Линия тренда поверх точек и строка «Тренд: 82,1 кг» | Hacker's Diet, Libra, Happy Scale, MacroFactor, TrendWeight (ссылки в 3.1) | Считается на телефоне за один проход, без сети; вторая линия на нашем SVG-графике | S | нет | **сейчас**: убирает «скачки» воды |
| Темп за неделю по наклону тренда за 28 дней | Hacker's Diet Online, Withings (ссылки в 3.1) | Заменяет `weeklyWeightChangeKg`; подсказка NHS станет устойчивее | S | нет | **сейчас** |
| Цель по весу и строка «≈ 10 недель, если темп сохранится» | Libra, Happy Scale, Withings, MyFitnessPal (ссылки в 3.1) | Одно поле в «Рост и пол» (хранилище ключ-значение, без миграции); строку скрывать, если тренд уходит от цели | S–M | нет | **сейчас**, если пользователь хочет цель (вопрос 2) |
| Тренд % жира тем же сглаживанием; талия — изменение за 4 недели | Withings BodyPath (доп. показатели); Hevy — свой график для каждого замера ([справка](https://help.hevyapp.com/hc/en-us/articles/34462134138775-How-to-Record-Body-Measurements-and-Progress-Photos), по выдержке поиска) | Жир с весов прыгает, сглаживание полезно; талию мерят редко, хватит разницы | S | нет | **сейчас**, вместе с трендом |

## 4. Health Connect: что ещё можно читать
### 4.1 Android 14 и новее (страницы открыты)
- С Android 14 Health Connect входит в систему как модуль, ставить его не нужно, удалить нельзя. Где найти: Настройки → Безопасность и конфиденциальность → Конфиденциальность → Health Connect. Нужны сервисы Google Play; в рабочем профиле не работает ([get-started](https://developer.android.com/health-and-fitness/health-connect/get-started), [availability](https://developer.android.com/health-and-fitness/health-connect/availability)).
- На Android 14 с SDK extension 20 и выше Health Connect сам считает шаги телефона (датчик `TYPE_STEP_COUNTER`, запись не чаще раза в минуту), но **только если хоть одно приложение получило `READ_STEPS`**. С обновления июня 2026 такие шаги подписаны отдельным именем пакета устройства ([read-data](https://developer.android.com/health-and-fitness/health-connect/read-data)). Есть ли это на телефоне пользователя: Я не могу это подтвердить.
- По умолчанию читать можно данные не старше 30 дней до **первой** выдачи любого разрешения; более старые требуют `READ_HEALTH_DATA_HISTORY`. Чтение в фоне требует `READ_HEALTH_DATA_IN_BACKGROUND` ([data-types](https://developer.android.com/health-and-fitness/health-connect/data-types), [read-data](https://developer.android.com/health-and-fitness/health-connect/read-data)). Мнение: если доступ к весу уже выдан, история шагов и сна тоже упрётся в эту дату.
- Для накопительных данных (шаги) Google советует агрегацию, а не чтение записей: она убирает дубли. Для «Активности» и «Сна» дубли убираются по приоритету источников, который задаёт пользователь ([aggregate-data](https://developer.android.com/health-and-fitness/health-connect/aggregate-data)).

### 4.2 Типы данных ([data-types](https://developer.android.com/health-and-fitness/health-connect/data-types), страница открыта; код библиотеки 4.1.3, файлы открыты)
| Данные | Запись | Разрешение `android.permission.health.…` | `recordType` | Агрегат в библиотеке |
|---|---|---|---|---|
| Шаги | StepsRecord | `READ_STEPS` | `Steps` | COUNT_TOTAL |
| Сон | SleepSessionRecord (со стадиями) | `READ_SLEEP` | `SleepSession` | SLEEP_DURATION_TOTAL |
| Пульс | HeartRateRecord (серия) | `READ_HEART_RATE` | `HeartRate` | BPM_AVG/MIN/MAX |
| Пульс в покое | RestingHeartRateRecord | `READ_RESTING_HEART_RATE` | `RestingHeartRate` | BPM_AVG/MIN/MAX |
| HRV | HeartRateVariabilityRmssdRecord | `READ_HEART_RATE_VARIABILITY` | `HeartRateVariabilityRmssd` | нет, только записи |
| Тренировки | ExerciseSessionRecord | `READ_EXERCISE` (маршрут — `READ_EXERCISE_ROUTE`) | `ExerciseSession` | EXERCISE_DURATION_TOTAL |
| Питание | NutritionRecord | `READ_NUTRITION` | `Nutrition` | ENERGY_TOTAL, PROTEIN_TOTAL и др. |
| Вода | HydrationRecord | `READ_HYDRATION` | `Hydration` | VOLUME_TOTAL |
| История старше 30 дней | — | `READ_HEALTH_DATA_HISTORY` | `ReadHealthDataHistory` | — |
| Чтение в фоне | — | `READ_HEALTH_DATA_IN_BACKGROUND` | `BackgroundAccessPermission` | — |

Особенности библиотеки (файлы открыты): внутри `androidx.health.connect:connect-client:1.1.0`. Проверки доступности функций (`getFeatureStatus`) нет. `getGrantedPermissions` не сообщает о разрешении на историю, узнать о нём можно только по результату чтения. В таблице разрешений её документации ([permissions.md v4.1.3](https://raw.githubusercontent.com/matinzd/react-native-health-connect/v4.1.3/docs/docs/permissions.md), страница открыта) нет строки HRV, но в коде этот тип есть. Агрегация по дням (`aggregateGroupByPeriod`) переводит время в местное, подходит для «шагов по дням».

Кто пишет в Health Connect: Samsung Health — шаги, пульс, сон со стадиями, вес, % жира ([developer.samsung.com](https://developer.samsung.com/health/health-connect-faq.html), по выдержке поиска); Mi Fitness — шаги, сон, пульс ([fitmesh.fit](https://www.fitmesh.fit/en/sync/xiaomi-mi-band), сторонний сайт, по выдержке поиска). Что пишут устройства пользователя: Я не могу это подтвердить (вопрос 1).

### 4.3 Функции
| Функция | Где есть | Подходит нам | Объём | Нативное | Рекомендация |
|---|---|---|---|---|---|
| Шаги: сегодня и в среднем за 7 дней | Samsung Health — карточка «Шаги» с целью ([samsung.com](https://www.samsung.com/us/support/answer/ANS10001370/), по выдержке поиска); Google Health — Today ([support.google.com](https://support.google.com/googlehealth/answer/17068213), по выдержке поиска); у Apple без часов кольцо «Движение» строится по шагам и тренировкам из других приложений ([HIG](https://developer.apple.com/design/human-interface-guidelines/activity-rings), страница открыта) | Работает и без часов (4.1); один агрегатный запрос — быстро | M | app.json | **сейчас** (следующий APK) |
| Вся история веса | возможность Health Connect ([read-data](https://developer.android.com/health-and-fitness/health-connect/read-data)) | Тренду нужна история; разовый импорт по страницам | S–M | app.json | **сейчас**, вместе с шагами |
| Сон: прошлая ночь и среднее за 7 дней | Google Health — вкладка «Сон» ([support.google.com](https://support.google.com/googlehealth/answer/17068213)), Oura ([ouraring.com](https://ouraring.com/blog/readiness-score/)), WHOOP ([whoop.com](https://www.whoop.com/au/en/thelocker/how-does-whoop-recovery-work-101/)) — по выдержке поиска | Только если часы или браслет пишут сон; стадии — позже | M | app.json | **сейчас**, если есть источник сна |
| Пульс в покое (линия тренда) | Apple Health «Тренды» ([support.apple.com](https://support.apple.com/guide/iphone/view-your-health-data-iphe3d379c32/ios)), Oura, WHOOP — по выдержке поиска | Одно значение в день, мало данных | M | app.json | позже, после шагов и сна |
| HRV только относительно обычного уровня | Oura «баланс HRV» ([ouraring.com](https://ouraring.com/blog/readiness-score/)); Garmin «статус HRV» — сравнение с личной базой ([руководство](https://www8.garmin.com/manuals-apac/webhelp/venu33s/EN-SG/GUID-16D80A47-53F1-44B2-8C97-98DBB188E5AF-4096.html)) — по выдержке поиска | Без «норм», см. раздел 7 | M | app.json | позже |
| Пульс, вся серия | — | Много данных, мало пользы сверх пульса в покое | M | app.json | не нужно |
| Минуты тренировок за неделю против 150 мин ВОЗ | Google Fit: Heart Points и Move Minutes по рекомендациям AHA и ВОЗ ([blog.google](https://blog.google/products/android/introducing-new-google-fit/)); Google Health: недельная цель кардио ([support.google.com](https://support.google.com/googlehealth/answer/17068213)) — по выдержке поиска | Совпадает с нашей подсказкой ВОЗ, но учитывает только записанные тренировки | M | app.json | позже |
| Вода | Samsung Health — виджет «Вода» ([ответ в сообществе Samsung](https://r2.community.samsung.com/t5/Samsung-Health/Water-intake-widget/td-p/21320455)); Yazio — трекер воды ([App Store](https://apps.apple.com/ru/app/yazio-%D1%81%D1%87%D0%B5%D1%82%D1%87%D0%B8%D0%BA-%D0%BA%D0%B0%D0%BB%D0%BE%D1%80%D0%B8%D0%B9-%D0%B8-%D0%B4%D0%B8%D0%B5%D1%82%D0%B0/id946099227)) — по выдержке поиска | Нужен ручной ввод — лишний интерфейс | S–M | app.json | не нужно |
| Калории из другого приложения | MyFitnessPal пишет в Health Connect итоги приёмов пищи ([sahha.ai](https://sahha.ai/integrations/in/myfitnesspal), сторонний сайт, по выдержке поиска) | См. раздел 6 | S–M | app.json | позже, вместе с едой |
| Чтение в фоне | [read-data](https://developer.android.com/health-and-fitness/health-connect/read-data) | Импорт при запуске уже есть; фон нужен только виджету с шагами | M | модуль `expo-background-task` ~57.0.8 и app.json | не нужно сейчас |

Мнение: статус «подключено» сейчас общий для трёх типов. Для новых типов нужен статус по каждому типу и одна кнопка «Подключить шаги и сон».

## 5. Сводка, серии, напоминания, фото, виджеты
### 5.1 Факты
- **Сводка из карточек.** Google Health: вкладка Today с настраиваемой панелью ([support.google.com](https://support.google.com/googlehealth/answer/17068213)). Garmin Connect: главный экран из карточек, раздел Edit Home ([garmin.com](https://www.garmin.com/en-US/blog/fitness/unlocking-the-potential-of-garmin-connect/)). Samsung Health: карточки на вкладке Home ([samsung.com](https://www.samsung.com/us/support/answer/ANS10001370/)). Apple Health: раздел «Тренды» сообщает о заметных изменениях пульса в покое, шагов и сна ([support.apple.com](https://support.apple.com/guide/iphone/view-your-health-data-iphe3d379c32/ios)). Всё по выдержке поиска.
- **Кольца.** Apple запрещает показывать в кольцах Activity другие данные и рисовать похожие кольца для Move/Exercise/Stand ([HIG](https://developer.apple.com/design/human-interface-guidelines/activity-rings), страница открыта).
- **Оценки.** Oura Readiness складывается из пульса в покое, баланса HRV, температуры и др. ([ouraring.com](https://ouraring.com/blog/readiness-score/)); WHOOP Recovery 0–100 % — из HRV, пульса в покое, сна и дыхания ([whoop.com](https://www.whoop.com/au/en/thelocker/how-does-whoop-recovery-work-101/)). Формулы закрыты. По выдержке поиска.
- **Серии.** Duolingo: у тех, кто дошёл до серии в 7 дней, вероятность вернуться на следующий день в 2,4 раза выше, чем у тех, у кого серии нет ([blog.duolingo.com](https://blog.duolingo.com/improving-the-streak/)); серию можно «заморозить» на день ([blog.duolingo.com](https://blog.duolingo.com/how-duolingo-streak-builds-habit)). Strava: недельная серия — хотя бы одна активность от 60 секунд с понедельника по воскресенье; загрузка задним числом восстанавливает серию; уведомления о сериях отключить нельзя ([support.strava.com](https://support.strava.com/hc/en-us/articles/36553427481997-Streaks-on-Strava)). Lose It!: «серия записей» ([App Store](https://apps.apple.com/app/lose-it-weight-loss-program-and-calorie-counter/id297368629)). Всё по выдержке поиска.
- **Взвешивания и самочувствие.** Обзор Zheng и др., 2015: регулярное самовзвешивание связано с большим снижением веса и не связано с плохими психологическими исходами у взрослых в программах снижения веса ([PubMed 25521523](https://pubmed.ncbi.nlm.nih.gov/25521523/)). Обзор Pacanowski и др., 2015: отрицательные связи встречались, в основном у женщин и молодых ([PMC4729441](https://pmc.ncbi.nlm.nih.gov/articles/PMC4729441)). Оба по выдержке поиска.
- **Напоминания.** У MyFitnessPal напоминания привязаны к приёмам пищи ([справка](https://support.myfitnesspal.com/hc/en-us/articles/360032622391-How-to-set-up-logging-reminders), по выдержке поиска). У нас: в установленном `expo-notifications` 57.0.9 есть `WeeklyTriggerInput` (день недели от 1 до 7, 1 — воскресенье) (файл открыт). Для точного времени на Android 12+ нужно `SCHEDULE_EXACT_ALARM` ([документация Expo SDK 57](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/notifications.mdx), страница открыта). Мнение: напоминанию о взвешивании точность до минуты не нужна.
- **Фото прогресса.** Hevy: одно фото в день, наложение прошлого фото для того же ракурса, фото по умолчанию закрыты от других, совет — снимать раз в 4–5 недель ([справка](https://help.hevyapp.com/hc/en-us/articles/34462134138775-How-to-Record-Body-Measurements-and-Progress-Photos), по выдержке поиска).
- **Приватность фото у нас** ([Auto Backup](https://developer.android.com/identity/data/autobackup), страница открыта). Если резервное копирование включено в телефоне, Android по умолчанию копирует в Google Drive файлы и базы данных приложения. Лимит — 25 МБ на приложение; если данных больше, резервная копия **не делается вообще**. На Android 9+ копия зашифрована PIN-кодом или паролем телефона. В нашем манифесте `allowBackup="true"`, блокировки приложения нет (бриф).
- **Виджеты.** Google Health 5.0: виджет до 6 показателей ([9to5google](https://9to5google.com/2026/05/20/google-health-5-0-widget/), по выдержке поиска); Samsung Health: виджет «Шаги» ([samsung.com](https://www.samsung.com/us/support/answer/ANS10001370/), по выдержке поиска). У нас `registerWidgetTaskHandler` регистрирует одну фоновую задачу на всё приложение (`AppRegistry.registerHeadlessTask` с одним ключом, код библиотеки открыт): второй модуль перезапишет обработчик «Финансов». По `updatePeriodMillis` Android обновляет виджет не чаще раза в 30 минут ([AppWidgetProviderInfo](https://developer.android.com/reference/android/appwidget/AppWidgetProviderInfo), страница открыта).

### 5.2 Функции
| Функция | Подходит нам | Объём | Нативное | Рекомендация |
|---|---|---|---|---|
| Блок «Сводка» вверху: вес (тренд, за неделю), шаги, сон; карточка появляется, только когда есть данные | Без переключателей (решение пользователя от 2026-10-17): нет данных — нет карточки | M | нет | **сейчас**, вместе с шагами |
| Кольца как у Apple | HIG запрещает показывать в кольцах Activity другие данные и рисовать Move/Exercise/Stand в похожих кольцах; другие кольца разрешены, если их явно отделить; для Android-приложения HIG не обязателен ([HIG](https://developer.apple.com/design/human-interface-guidelines/activity-rings), страница открыта). Мнение: полоса прогресса проще | — | — | не нужно |
| Оценка «готовности/восстановления» | Закрытые формулы, выглядит как медицинская оценка | L | — | не нужно |
| Напоминание о взвешивании раз в неделю с итогом недели в тексте | Модуль уже в APK. Запрос разрешения есть только в «Финансах» (`ensureNotificationPermission`), а модули друг друга не импортируют — перенести функцию в `packages/core` | S | нет | **сейчас** |
| Недельная серия взвешиваний; записи задним числом засчитываются | Мягче дневной серии. Мнение: польза для одного пользователя спорная | S | нет | позже |
| Фото прогресса | Нужны съёмка или выбор фото (`expo-image-picker` ~57.0.8 или `expo-camera` ~57.0.3) и исключение папки фото из резервной копии (правило в манифесте). По желанию — блокировка (`expo-local-authentication` ~57.0.2) и запрет скриншотов (`expo-screen-capture` ~57.0.1) | L | новые модули | позже, после решения о приватности (вопрос 5) |
| Виджет «Вес: тренд и за неделю» | Данные из своей SQLite, фоновое чтение Health Connect не нужно. Нужен общий диспетчер виджетов в `apps/mobile` или `packages/core`; новый виджет в `app.json` | M | app.json | позже, после тренда |
| Виджет с шагами | Нужно фоновое чтение Health Connect | M–L | app.json и модуль фона | не нужно сейчас |

## 6. Еда: только обзор (пользователь сказал «позже»)
| Приложение | Штрих-код | База продуктов | Беларусь и Россия |
|---|---|---|---|
| MyFitnessPal | С 1.10.2022 только в Premium ([droid-life](https://www.droid-life.com/2022/08/24/myfitnesspal-puts-barcode-scanner-behind-premium-paywall/), по выдержке поиска) | Я не могу это подтвердить | Я не могу это подтвердить |
| Yazio | Есть; ненайденный продукт можно добавить самому ([справка](https://help.yazio.com/hc/en-us/articles/208555549-The-scanned-product-will-not-be-recognized-why)) | Базы для 249 стран и территорий, но «отдельных баз не для всех стран»: если результатов мало, ищет в базе по языку страны, затем показывает английские продукты ([справка](https://help.yazio.com/hc/en-us/articles/11804332619665-How-does-the-food-product-search-work-within-Yazio)). По выдержке поиска | Есть страница в российском App Store с русским описанием ([App Store](https://apps.apple.com/ru/app/yazio-%D1%81%D1%87%D0%B5%D1%82%D1%87%D0%B8%D0%BA-%D0%BA%D0%B0%D0%BB%D0%BE%D1%80%D0%B8%D0%B9-%D0%B8-%D0%B4%D0%B8%D0%B5%D1%82%D0%B0/id946099227)); отдельная база для Беларуси: Я не могу это подтвердить |
| FatSecret | Заявлено покрытие штрих-кодов 90 %+ ([platform.fatsecret.com](https://platform.fatsecret.com/api)) | Приложение на русском есть в App Store ([App Store](https://apps.apple.com/ru/app/%d1%81%d1%87%d0%b5%d1%82%d1%87%d0%b8%d0%ba-%d0%ba%d0%b0%d0%bb%d0%be%d1%80%d0%b8%d0%b9-%d0%be%d1%82-fatsecret/id347184248)). API: бесплатный тариф Basic — только база США, 5000 запросов в день; локальные базы — в платном Premier ([api-editions](https://platform.fatsecret.com/api-editions)) | В списке регионов API есть Беларусь (язык по умолчанию — русский) и Россия ([localization](https://platform.fatsecret.com/docs/guides/localization)); насколько полны данные: Я не могу это подтвердить. Всё по выдержке поиска |
| Lose It! | Есть; Snap It — запись еды по фото; «50+ млн продуктов» ([App Store](https://apps.apple.com/app/lose-it-weight-loss-program-and-calorie-counter/id297368629), по выдержке поиска) | — | Я не могу это подтвердить |
| Open Food Facts (открытая база) | — | Открытые данные (ODbL). Чтение по API без регистрации, но с User-Agent вида «Приложение/версия (e-mail)»; лимит 15 запросов в минуту с одного IP на все чтения товаров и 10 — на поиск; если запросы идут прямо из мобильного приложения, лимит считается на пользователя, поиск по мере ввода запрещён ([docs/api](https://raw.githubusercontent.com/openfoodfacts/openfoodfacts-server/main/docs/api/index.md), страница открыта) | Белорусские товары с кодом 481 в базе есть ([пример](https://world.openfoodfacts.org/product/4810319020134), по выдержке поиска); сколько их: Я не могу это подтвердить |

Во что это обойдётся нам (Мнение):
- **A.** Еду записывать в другом приложении, а калории читать из Health Connect (`READ_NUTRITION`). S–M, app.json. Работает, только если то приложение пишет питание в Health Connect: MyFitnessPal — по стороннему сайту; Yazio и FatSecret: Я не могу это подтвердить.
- **B.** Свой дневник с ручным вводом и своими продуктами. M–L, без нативного; главная цена — интерфейс быстрого ввода.
- **C.** Сканер и Open Food Facts. L: модуль `expo-camera` ~57.0.3 (умеет читать штрих-коды, [документация](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/camera.mdx), страница открыта) и разрешение камеры; сеть (сейчас приложение работает без сети); e-mail из User-Agent окажется в публичном репозитории; ODbL при сохранении базы у себя; покрытие Беларуси неизвестно.
- **D.** FatSecret API. L: локальная база только в платном тарифе; секретный ключ нельзя класть в публичный репозиторий и APK, значит нужен свой сервер.

Рекомендация: сейчас не начинать, как и решил пользователь. Вернуться после тренда и Health Connect; самый дешёвый путь — A.

## 7. Безопасность: где легко скатиться в медицинский совет
Наши подсказки уже справочные, с источниками, и на экране написано, что это не медицинская консультация (`screens/HealthHomeScreen.tsx`, файл открыт). Новое, что требует осторожности:

| Риск | Что делать (Рекомендация) | Источник |
|---|---|---|
| «Оценки» готовности, восстановления, стресса | Не делать | формулы закрыты ([ouraring.com](https://ouraring.com/blog/readiness-score/), [whoop.com](https://www.whoop.com/au/en/thelocker/how-does-whoop-recovery-work-101/), по выдержке поиска) |
| HRV «хорошо/плохо» | Показывать только отклонение от собственного обычного уровня, без норм. Что общепринятых норм HRV для носимых устройств нет, видел только во вторичных источниках: по первоисточнику Я не могу это подтвердить | Garmin: статус HRV сравнивает с личной базой ([руководство](https://www8.garmin.com/manuals-apac/webhelp/venu33s/EN-SG/GUID-16D80A47-53F1-44B2-8C97-98DBB188E5AF-4096.html), по выдержке поиска) |
| Пульс в покое «опасный» | Без тревог и диагнозов. Справочно: у большинства взрослых 60–100 уд/мин; при неровном пульсе нужна оценка у врача | [NHS](https://www.nhs.uk/common-health-questions/accidents-first-aid-and-treatments/how-do-i-check-my-pulse/) (по выдержке поиска) |
| Оценка даты цели подгоняет | Подпись «если темп сохранится»; подсказка NHS о 0,5–1 кг в неделю остаётся; дату не хранить как срок | MyFitnessPal не хранит дату цели по этой причине ([справка](https://support.myfitnesspal.com/hc/en-us/articles/360032271632-Where-can-I-find-my-target-date), по выдержке поиска) |
| «Дефицит калорий» по изменению веса | Не показывать: правило «3500 ккал» завышает снижение веса, потому что не учитывает замедление обмена | NIH, материалы о Body Weight Planner (по выдержке поиска). Ссылку [TAB-2436](https://www.techtransfer.nih.gov/tech/TAB-2436) Я не могу подтвердить: поиск её не находит |
| Цель ниже здорового веса | Справочно: ИМТ ниже 18,5 — недостаточный вес по NHS; у мускулистых людей ИМТ неточен | [NHS](https://www.nhs.uk/conditions/obesity/) (по выдержке поиска) |
| Сон | Справочно: взрослым — 7 часов и больше | [AASM и SRS, 2015](https://aasm.org/seven-or-more-hours-of-sleep-per-night-a-health-necessity-for-adults/) (по выдержке поиска) |
| Шаги | Не обещать «10 000»: по мета-анализу Paluch и др. (2022) польза выходит на плато. Возрастные пороги видел только во вторичных источниках | [обзор статьи](https://hospitalhealthcare.com/specialisms/cardiovascular/mortality-benefit-from-higher-daily-steps-plateaus/), [DOI](https://doi.org/10.1016/S2468-2667(21)00302-9) (по выдержке поиска) |
| Серии и частые взвешивания | Без стыда и «потерь»; серия по неделям, а не по дням | [Zheng 2015](https://pubmed.ncbi.nlm.nih.gov/25521523/), [Pacanowski 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4729441) (по выдержке поиска) |
| Подсчёт калорий | Отложено. Мнение: рискован для людей с расстройствами пищевого поведения | — |
| Формулировки | Мнение: регуляторы судят по заявленному назначению; «общее благополучие» без упоминания болезней медизделием не считается. Личного приложения это не касается, но граница полезна: не писать «у вас риск болезни X» | FDA General Wellness ([innolitics](https://innolitics.com/articles/fda-guidance-general-wellness-policy-for-low-risk-devices/)), MDCG 2019-11 ([openregulatory](https://openregulatory.com/mdcg/mdcg-2019-11)) — вторичные источники, по выдержке поиска |

## 8. Топ-10 (Рекомендация)
1. **Линия тренда веса**, тренд % жира и изменение талии за 4 недели. Сейчас; S; только JS. Главная польза при минимуме интерфейса.
2. **Темп за неделю по тренду.** Сейчас; S. Подсказка NHS перестанет реагировать на одно взвешивание.
3. **Цель и оценка даты.** Сейчас; S–M. Есть у Libra, Happy Scale и Withings; показывать с оговоркой.
4. **Еженедельное напоминание с итогом.** Сейчас; S. Модуль уже в APK.
5. **Шаги из Health Connect.** Следующий APK; M. На Android 14 работают и без часов.
6. **Вся история веса** (`READ_HEALTH_DATA_HISTORY`). Следующий APK; S–M. Тренду нужна история.
7. **Сон из Health Connect.** Следующий APK; M. Если часы или браслет пишут сон.
8. **Блок «Сводка».** Вместе с 5–7; M. Одна точка входа без переключателей.
9. **Пульс в покое, HRV справочно.** Позже; M. Зависит от устройства.
10. **Виджет «Вес».** Позже; M. Нужен общий диспетчер виджетов.

## 9. Рекомендация: следующий шаг «Здоровья»
0. Проверить на телефоне нынешний импорт веса из Health Connect на реальных данных (по заметкам, ещё не проверялся) и узнать, что пишет в Health Connect (вопрос 1).
1. Ветка `feature/health-trend`, только JS, с тестами на расчёты: тренд с весом по дням (3.2), темп по тренду вместо `weeklyWeightChangeKg`, цель с оценкой даты, тренд % жира, изменение талии за 4 недели, еженедельное напоминание. До оптимизации замерить отрисовку графика примерно на 1000 точках.
2. Ветка `feature/health-connect-activity`: добавить в `app.json` `READ_STEPS`, `READ_SLEEP`, `READ_HEALTH_DATA_HISTORY` (и `READ_RESTING_HEART_RATE`, если есть источник), затем `npx expo prebuild --platform android --clean` и APK. Статус по каждому типу, блок «Сводка».

Не сейчас: фото, еда, «оценки», чтение в фоне, виджеты с данными Health Connect.

## Вопросы к пользователю
1. Какой телефон и какие весы, часы, браслет или кольцо? Какие приложения пишут в Health Connect (Samsung Health, Mi Fitness, Google Health и т. п.)? От этого зависит польза шагов, сна и пульса.
2. Нужна ли цель по весу с оценкой даты, или достаточно тренда?
3. Как часто взвешиваться: каждый день (тренд это сгладит) или раз в неделю? В какой день и час напоминать?
4. Загрузить всю историю веса из Health Connect? Для этого нужно ещё одно разрешение.
5. Нужны ли фото прогресса? Если да, подходят ли блокировка приложения отпечатком и исключение фото из резервной копии Google?
6. Приложение сейчас разрешает резервное копирование Android: если оно включено в телефоне, данные приложения (финансы и здоровье) копируются в Google Drive (до 25 МБ, зашифровано PIN-кодом телефона). Оставить или запретить?
7. Нужны ли серии вроде «6 недель подряд со взвешиванием»?
8. Еда: когда вернуться к теме? Что удобнее — записывать еду в другом приложении и подтягивать калории через Health Connect или своё сканирование штрих-кодов?
9. Нужен ли второй виджет на главном экране — «Вес»?

## Источники
**Android и Health Connect (страницы открыты):**
- https://developer.android.com/health-and-fitness/health-connect/data-types
- https://developer.android.com/health-and-fitness/health-connect/get-started
- https://developer.android.com/health-and-fitness/health-connect/read-data
- https://developer.android.com/health-and-fitness/health-connect/aggregate-data
- https://developer.android.com/health-and-fitness/health-connect/availability
- https://developer.android.com/identity/data/autobackup
- https://developer.android.com/reference/android/appwidget/AppWidgetProviderInfo

**Библиотеки и Expo (страницы открыты):**
- https://raw.githubusercontent.com/matinzd/react-native-health-connect/v4.1.3/docs/docs/permissions.md
- https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/notifications.mdx
- https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/camera.mdx
- https://raw.githubusercontent.com/openfoodfacts/openfoodfacts-server/main/docs/api/index.md
- https://raw.githubusercontent.com/ervwalter/trendweight/main/README.md
- https://raw.githubusercontent.com/ervwalter/trendweight/main/docs/ARCHITECTURE.md

**Apple (страницы открыты, через данные страницы в JSON):**
- https://developer.apple.com/design/human-interface-guidelines/activity-rings
- https://developer.apple.com/documentation/healthkit

**Приложения (по выдержке поиска):**
- Hacker's Diet: https://www.fourmilab.ch/hackdiet/e4/pencilpaper.html ; https://www.fourmilab.ch/hackdiet/e4/signalnoise.html ; https://www.fourmilab.ch/hackdiet/www/subsubsection1_4_1_0_8_4.html
- Libra: https://blog.withings.com/2011/03/09/withings-synchs-with-libra-an-android-app-for-weight-monitoring-2/ ; https://www.alternativeto.net/software/libra---weight-manager/about/
- Happy Scale: https://apps.apple.com/app/id532430574
- MacroFactor: https://help.macrofactorapp.com/dashboard/weight_trend/
- Withings: https://support.withings.com/hc/en-us/articles/206290947-Withings-App-Online-Dashboard-What-is-the-weekly-report ; https://support.withings.com/hc/en-us/articles/201491327-Withings-App-Online-Dashboard-Setting-a-target-weight ; https://support.withings.com/hc/en-us/articles/47323926457617-Withings-App-Health-Tab-BodyPath
- MyFitnessPal: https://support.myfitnesspal.com/hc/en-us/articles/360032272992-How-often-should-I-record-my-weight-and-other-measurements ; https://support.myfitnesspal.com/hc/en-us/articles/360032271632-Where-can-I-find-my-target-date ; https://support.myfitnesspal.com/hc/en-us/articles/360032622391-How-to-set-up-logging-reminders ; https://www.droid-life.com/2022/08/24/myfitnesspal-puts-barcode-scanner-behind-premium-paywall/ ; https://en.wikipedia.org/wiki/MyFitnessPal ; https://www.businessofapps.com/?p=60999 ; https://sahha.ai/integrations/in/myfitnesspal
- Apple Health: https://support.apple.com/guide/iphone/view-your-health-data-iphe3d379c32/ios
- Google Fit и Google Health: https://blog.google/products/android/introducing-new-google-fit/ ; https://9to5google.com/2026/05/07/google-fit-shut-down-health-replacement-migration-tool-coming/ ; https://support.google.com/googlehealth/answer/17068213 ; https://9to5google.com/2026/05/20/google-health-5-0-widget/
- Samsung Health: https://www.samsung.com/us/support/answer/ANS10001370/ ; https://developer.samsung.com/health/health-connect-faq.html ; https://www.sammobile.com/2018/08/02/samsung-health-500-million-installs-google-play-store/ ; https://r2.community.samsung.com/t5/Samsung-Health/Water-intake-widget/td-p/21320455
- Xiaomi (сторонний сайт): https://www.fitmesh.fit/en/sync/xiaomi-mi-band
- Garmin: https://www.garmin.com/en-US/blog/fitness/unlocking-the-potential-of-garmin-connect/ ; https://www8.garmin.com/manuals-apac/webhelp/venu33s/EN-SG/GUID-16D80A47-53F1-44B2-8C97-98DBB188E5AF-4096.html
- Oura: https://ouraring.com/blog/readiness-score/ ; https://www.fiercehealthcare.com/health-tech/oura-raises-900m-series-e-oura-ring-sales-catapult
- WHOOP: https://www.whoop.com/au/en/thelocker/how-does-whoop-recovery-work-101/
- Yazio: https://help.yazio.com/hc/en-us/articles/11804332619665-How-does-the-food-product-search-work-within-Yazio ; https://help.yazio.com/hc/en-us/articles/208555549-The-scanned-product-will-not-be-recognized-why ; https://www.tu-ilmenau.de/unionline/en/series/details/tu-spin-offs-what-became-of-1123 ; https://www.similarweb.com/app/google/com.yazio.android/austria/ ; https://apps.apple.com/ru/app/yazio-%D1%81%D1%87%D0%B5%D1%82%D1%87%D0%B8%D0%BA-%D0%BA%D0%B0%D0%BB%D0%BE%D1%80%D0%B8%D0%B9-%D0%B8-%D0%B4%D0%B8%D0%B5%D1%82%D0%B0/id946099227
- FatSecret: https://platform.fatsecret.com/api ; https://platform.fatsecret.com/api-editions ; https://platform.fatsecret.com/docs/guides/localization ; https://foods.fatsecret.com/ ; https://apps.apple.com/ru/app/%d1%81%d1%87%d0%b5%d1%82%d1%87%d0%b8%d0%ba-%d0%ba%d0%b0%d0%bb%d0%be%d1%80%d0%b8%d0%b9-%d0%be%d1%82-fatsecret/id347184248
- Lose It!: https://apps.apple.com/app/lose-it-weight-loss-program-and-calorie-counter/id297368629
- Open Food Facts: https://world.openfoodfacts.org/product/4810319020134
- Strava: https://support.strava.com/hc/en-us/articles/36553427481997-Streaks-on-Strava ; https://gearjunkie.com/news/strava-passes-100-million-users
- Hevy: https://help.hevyapp.com/hc/en-us/articles/34462134138775-How-to-Record-Body-Measurements-and-Progress-Photos ; https://www.hevyapp.com/about-us/
- Duolingo: https://blog.duolingo.com/improving-the-streak/ ; https://blog.duolingo.com/how-duolingo-streak-builds-habit ; https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm

**Исследования и рекомендации (по выдержке поиска):**
- https://pubmed.ncbi.nlm.nih.gov/25521523/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC4729441
- https://www.nhs.uk/common-health-questions/accidents-first-aid-and-treatments/how-do-i-check-my-pulse/ ; https://www.nhs.uk/conditions/obesity/
- https://aasm.org/seven-or-more-hours-of-sleep-per-night-a-health-necessity-for-adults/
- https://hospitalhealthcare.com/specialisms/cardiovascular/mortality-benefit-from-higher-daily-steps-plateaus/ ; https://doi.org/10.1016/S2468-2667(21)00302-9
- https://www.techtransfer.nih.gov/tech/TAB-2436
- https://innolitics.com/articles/fda-guidance-general-wellness-policy-for-low-risk-devices/ ; https://openregulatory.com/mdcg/mdcg-2019-11

**Файлы (открыты, только чтение):** `packages/health/src/lib/tips.ts`, `lib/measurements.ts`, `lib/healthConnect.android.ts`, `components/LineChart.tsx`, `components/HealthConnectCard.tsx`, `screens/HealthHomeScreen.tsx`; `packages/finance/src/lib/notifications.ts`, `src/widget/widget-task-handler.tsx`; `apps/mobile/app.json`, `apps/mobile/package.json`, `apps/mobile/app-entry.js`, `apps/mobile/android/app/src/main/AndroidManifest.xml`; `node_modules/expo/bundledNativeModules.json`; `node_modules/react-native-health-connect/` (README.md, src/index.tsx, src/types/*, android/build.gradle, PermissionUtils.kt, HealthConnectUtils.kt, records/ReactStepsRecord.kt); `node_modules/react-native-android-widget/src/api/register-widget-task-handler.tsx`; `node_modules/expo-notifications/build/Notifications.types.d.ts`; `notes/health-module.md`, `notes/wearables-api.md`, `notes/roadmap.md`, `notes/decisions.md`.
