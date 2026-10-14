# Кольца и браслеты с API

Проверено 2026-10-04. Пометка ⚠️ — источник сторонний, официальный сайт из облачной сессии был недоступен.

| Устройство | Доступ | Данные | Источник |
|---|---|---|---|
| Polar | Бесплатно, аккаунт Polar Flow. Только новые данные, без истории | Тренировки, активность, вес, рост | https://www.polar.com/blog/introducing-polar-open-accesslink-api/ |
| Oura (кольцо) | Только OAuth2. Личные токены отключены в декабре 2025 | Сон, готовность, активность, пульс | ⚠️ https://tryterra.co/blog/oura-api-ai-apps-access-permissions-commercial-restrictions |
| WHOOP | OAuth2 | Восстановление, HRV, пульс покоя, SpO2, температура кожи, сон | https://developer.whoop.com/docs/developing/v1-v2-migration |
| Ultrahuman (кольцо) | Заявка на партнёрство | Сон, HRV, пульс, температура кожи, SpO2 | ⚠️ https://openwearables.io/docs/providers/ultrahuman-api-integration |
| Garmin | Только юрлица, приём заявок, по данным источника, приостановлен | — | ⚠️ https://openwearables.io/docs/providers/garmin-api-integration.md |
| Fitbit | Старый API отключается 30.09.2026, на смену — Google Health API | — | https://developers.google.com/health/about |

## Решение
На Android читать данные из Health Connect (одно хранилище для всех устройств).
Библиотека: https://github.com/matinzd/react-native-health-connect (Expo, development build).
Не проверено: какие приложения колец пишут данные в Health Connect.

## Окружающая среда
Датчиков окружающей среды у этих колец и браслетов не найдено (температура кожи — это тело).
Внешние данные: Open-Meteo Air Quality API — без ключа: PM2.5, PM10, UV-индекс, пыльца (только Европа).
⚠️ https://docs.anysite.io/api-reference/openmeteo/openmeteoair-quality.md
