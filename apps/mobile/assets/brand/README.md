# Знак «Хаты»

Исходники иконки приложения (SVG, 1024 × 1024). PNG рядом, в `assets/`, получены из них отрисовкой в Chromium.

- `hata-icon.svg` — дом одной фигурой с ромбом-окном на белом фоне → `icon.png`, `favicon.png` (48 × 48).
- `hata-android-foreground.svg` — тот же знак без фона, уменьшенный до 0,72, чтобы поместиться в безопасную зону адаптивной иконки (слой 108 dp, не обрезается центральный круг 66 dp — developer.android.com, «Adaptive icons») → `android-icon-foreground.png`; фон — белый (`android-icon-background.png`).
- `hata-android-monochrome.svg` — белый силуэт для иконок в цвет темы (Android 13+) → `android-icon-monochrome.png`.

Цвета: красный `#D22730`, зелёный `#009739`, белый — значения цветов флага из таблицы статьи «Flag of Belarus» в Википедии (Pantone 1795 C и 355 C). Сам флаг в знаке не воспроизводится.
