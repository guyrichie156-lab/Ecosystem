import type { Nutrients } from "./nutrition";

export type BaseFood = Nutrients & {
  /** "sr" + the food's NDB number in the USDA table. */
  key: string;
  name: string;
  /** The USDA short description, to find the food on fdc.nal.usda.gov (SR Legacy). */
  usda: string;
};

/**
 * Built-in foods. Values per 100 g come from the USDA National Nutrient Database for Standard
 * Reference, Release 28 (abbreviated table ABBREV.txt, as shipped in the npm package
 * fda-nutrient-database 1.0.2), the data that became SR Legacy in FoodData Central. USDA data are in
 * the public domain (CC0 1.0); USDA asks to name FoodData Central as the source.
 * Carbohydrates are USDA's «by difference» value, which includes fibre.
 * Units as in nutrition.ts: kcal; protein, fat and carbohydrates in tenths of a gram.
 */
export const BASE_FOODS: BaseFood[] = [
  { key: "sr20009", name: "Гречка обжаренная, сухая", kcal: 346, protein: 117, fat: 27, carbs: 750, usda: "BUCKWHEAT GROATS,RSTD,DRY" },
  { key: "sr20010", name: "Гречка, варёная", kcal: 92, protein: 34, fat: 6, carbs: 199, usda: "BUCKWHEAT GROATS,RSTD,CKD" },
  { key: "sr20444", name: "Рис белый, сухой", kcal: 365, protein: 71, fat: 7, carbs: 800, usda: "RICE,WHITE,LONG-GRAIN,REG,RAW,UNENR" },
  { key: "sr20445", name: "Рис белый, варёный без соли", kcal: 130, protein: 27, fat: 3, carbs: 282, usda: "RICE,WHITE,LONG-GRAIN,REG,UNENR,CKD WO/ SALT" },
  { key: "sr08120", name: "Овсяные хлопья, сухие", kcal: 379, protein: 132, fat: 65, carbs: 677, usda: "CEREALS,OATS,REG & QUICK,NOT FORT,DRY" },
  { key: "sr08121", name: "Овсянка на воде, без соли", kcal: 71, protein: 25, fat: 15, carbs: 120, usda: "CEREALS,OATS,REG & QUICK,UNENR,CKD W/ H2O,WO/ SALT" },
  { key: "sr20420", name: "Макароны, сухие", kcal: 371, protein: 130, fat: 15, carbs: 747, usda: "PASTA,DRY,UNENR" },
  { key: "sr20421", name: "Макароны, варёные без соли", kcal: 158, protein: 58, fat: 9, carbs: 309, usda: "PASTA,CKD,UNENR,WO/ ADDED SALT" },
  { key: "sr20005", name: "Перловка, сухая", kcal: 352, protein: 99, fat: 12, carbs: 777, usda: "BARLEY,PEARLED,RAW" },
  { key: "sr20006", name: "Перловка, варёная", kcal: 123, protein: 23, fat: 4, carbs: 282, usda: "BARLEY,PEARLED,COOKED" },
  { key: "sr20031", name: "Пшено, сухое", kcal: 378, protein: 110, fat: 42, carbs: 728, usda: "MILLET,RAW" },
  { key: "sr20032", name: "Пшено, варёное", kcal: 119, protein: 35, fat: 10, carbs: 237, usda: "MILLET,COOKED" },
  { key: "sr20466", name: "Манная крупа, сухая", kcal: 360, protein: 127, fat: 10, carbs: 728, usda: "SEMOLINA,UNENRICHED" },
  { key: "sr20481", name: "Мука пшеничная", kcal: 364, protein: 103, fat: 10, carbs: 763, usda: "WHEAT FLR,WHITE,ALL-PURPOSE,UNENR" },
  { key: "sr18064", name: "Хлеб пшеничный", kcal: 267, protein: 107, fat: 32, carbs: 487, usda: "BREAD,WHEAT" },
  { key: "sr18060", name: "Хлеб ржаной", kcal: 259, protein: 85, fat: 33, carbs: 483, usda: "BREAD,RYE" },
  { key: "sr11352", name: "Картофель сырой, с кожурой", kcal: 77, protein: 20, fat: 1, carbs: 175, usda: "POTATOES,FLESH & SKN,RAW" },
  { key: "sr11367", name: "Картофель варёный без кожуры, без соли", kcal: 86, protein: 17, fat: 1, carbs: 200, usda: "POTATOES,BLD,CKD WO/ SKN,FLESH,WO/ SALT" },
  { key: "sr05062", name: "Куриная грудка без кожи, сырая", kcal: 120, protein: 225, fat: 26, carbs: 0, usda: "CHICKEN,BROILER OR FRYERS,BRST,SKINLESS,BNLESS,MEAT ONLY,RAW" },
  { key: "sr05064", name: "Куриная грудка без кожи, запечённая", kcal: 165, protein: 310, fat: 36, carbs: 0, usda: "CHICKEN,BROILERS OR FRYERS,BREAST,MEAT ONLY,CKD,RSTD" },
  { key: "sr01123", name: "Яйцо куриное, сырое", kcal: 143, protein: 126, fat: 95, carbs: 7, usda: "EGG,WHL,RAW,FRSH" },
  { key: "sr01129", name: "Яйцо куриное, варёное вкрутую", kcal: 155, protein: 126, fat: 106, carbs: 11, usda: "EGG,WHL,CKD,HARD-BOILED" },
  { key: "sr23567", name: "Говяжий фарш 15 % жира, сырой", kcal: 215, protein: 186, fat: 150, carbs: 0, usda: "BEEF,GROUND,85% LN MEAT / 15% FAT,RAW" },
  { key: "sr10024", name: "Свиная корейка без жира, сырая", kcal: 143, protein: 214, fat: 57, carbs: 0, usda: "PORK,FRSH,LOIN,WHL,LN,RAW" },
  { key: "sr05710", name: "Грудка индейки без кожи, сырая", kcal: 114, protein: 233, fat: 23, carbs: 0, usda: "TURKEY,RTL PARTS,BREAST,MEAT ONLY,RAW" },
  { key: "sr15268", name: "Треска тихоокеанская, сырая", kcal: 72, protein: 175, fat: 2, carbs: 0, usda: "FISH,COD,PACIFIC,RAW (NOT PREVIOUSLY FROZEN)" },
  { key: "sr15085", name: "Лосось (нерка), сырой", kcal: 131, protein: 222, fat: 47, carbs: 0, usda: "FISH,SALMON,SOCKEYE,RAW" },
  { key: "sr15121", name: "Тунец консервированный в воде, без жидкости", kcal: 86, protein: 194, fat: 10, carbs: 0, usda: "FISH,TUNA,LT,CND IN H2O,DRND SOL" },
  { key: "sr01077", name: "Молоко 3,25 %", kcal: 61, protein: 32, fat: 32, carbs: 48, usda: "MILK,WHL,3.25% MILKFAT,W/ ADDED VITAMIN D" },
  { key: "sr01079", name: "Молоко 2 %", kcal: 50, protein: 33, fat: 20, carbs: 48, usda: "MILK,RED FAT,FLUID,2% MILKFAT,W/ ADDED VIT A & VITAMIN D" },
  { key: "sr01082", name: "Молоко 1 %", kcal: 42, protein: 34, fat: 10, carbs: 50, usda: "MILK,LOWFAT,FLUID,1% MILKFAT,W/ ADDED VIT A & VITAMIN D" },
  { key: "sr01289", name: "Кефир нежирный (Lifeway, США)", kcal: 41, protein: 38, fat: 9, carbs: 45, usda: "KEFIR,LOWFAT,PLN,LIFEWAY" },
  { key: "sr01116", name: "Йогурт натуральный из цельного молока", kcal: 61, protein: 35, fat: 32, carbs: 47, usda: "YOGURT,PLN,WHL MILK,8 GRAMS PROT PER 8 OZ" },
  { key: "sr01287", name: "Греческий йогурт нежирный", kcal: 73, protein: 100, fat: 19, carbs: 39, usda: "YOGURT,GREEK,PLN,LOWFAT" },
  { key: "sr01015", name: "Зернёный творог (cottage cheese) 2 %", kcal: 81, protein: 104, fat: 23, carbs: 48, usda: "CHEESE,COTTAGE,LOWFAT,2% MILKFAT" },
  { key: "sr01012", name: "Зернёный творог (cottage cheese) со сливками", kcal: 98, protein: 111, fat: 43, carbs: 34, usda: "CHEESE,COTTAGE,CRMD,LRG OR SML CURD" },
  { key: "sr01036", name: "Рикотта", kcal: 174, protein: 113, fat: 130, carbs: 30, usda: "CHEESE,RICOTTA,WHOLE MILK" },
  { key: "sr01009", name: "Сыр чеддер", kcal: 404, protein: 229, fat: 333, carbs: 31, usda: "CHEESE,CHEDDAR" },
  { key: "sr01026", name: "Моцарелла", kcal: 300, protein: 222, fat: 224, carbs: 22, usda: "CHEESE,MOZZARELLA,WHL MILK" },
  { key: "sr01056", name: "Сметана", kcal: 198, protein: 24, fat: 194, carbs: 46, usda: "CREAM,SOUR,CULTURED" },
  { key: "sr01145", name: "Масло сливочное несолёное", kcal: 717, protein: 8, fat: 811, carbs: 1, usda: "BUTTER,WITHOUT SALT" },
  { key: "sr04060", name: "Масло подсолнечное", kcal: 884, protein: 0, fat: 1000, carbs: 0, usda: "OIL,SUNFLOWER,LINOLEIC (LESS THAN 60%)" },
  { key: "sr04053", name: "Масло оливковое", kcal: 884, protein: 0, fat: 1000, carbs: 0, usda: "OIL,OLIVE,SALAD OR COOKING" },
  { key: "sr11205", name: "Огурец", kcal: 15, protein: 6, fat: 1, carbs: 36, usda: "CUCUMBER,WITH PEEL,RAW" },
  { key: "sr11529", name: "Помидор", kcal: 18, protein: 9, fat: 2, carbs: 39, usda: "TOMATOES,RED,RIPE,RAW,YEAR RND AVERAGE" },
  { key: "sr11109", name: "Капуста белокочанная", kcal: 25, protein: 13, fat: 1, carbs: 58, usda: "CABBAGE,RAW" },
  { key: "sr11124", name: "Морковь", kcal: 41, protein: 9, fat: 2, carbs: 96, usda: "CARROTS,RAW" },
  { key: "sr11282", name: "Лук репчатый", kcal: 40, protein: 11, fat: 1, carbs: 93, usda: "ONIONS,RAW" },
  { key: "sr11080", name: "Свёкла", kcal: 43, protein: 16, fat: 2, carbs: 96, usda: "BEETS,RAW" },
  { key: "sr11821", name: "Перец сладкий красный", kcal: 31, protein: 10, fat: 3, carbs: 60, usda: "PEPPERS,SWT,RED,RAW" },
  { key: "sr11090", name: "Брокколи", kcal: 34, protein: 28, fat: 4, carbs: 66, usda: "BROCCOLI,RAW" },
  { key: "sr09003", name: "Яблоко с кожурой", kcal: 52, protein: 3, fat: 2, carbs: 138, usda: "APPLES,RAW,WITH SKIN" },
  { key: "sr09040", name: "Банан", kcal: 89, protein: 11, fat: 3, carbs: 228, usda: "BANANAS,RAW" },
  { key: "sr09200", name: "Апельсин", kcal: 47, protein: 9, fat: 1, carbs: 118, usda: "ORANGES,RAW,ALL COMM VAR" },
  { key: "sr09252", name: "Груша", kcal: 57, protein: 4, fat: 1, carbs: 152, usda: "PEARS,RAW" },
  { key: "sr09132", name: "Виноград", kcal: 69, protein: 7, fat: 2, carbs: 181, usda: "GRAPES,RED OR GRN (EURO TYPE,SUCH AS THOMPSON SEEDLESS),RAW" },
  { key: "sr16070", name: "Чечевица, варёная без соли", kcal: 116, protein: 90, fat: 4, carbs: 201, usda: "LENTILS,MATURE SEEDS,CKD,BLD,WO/SALT" },
  { key: "sr16057", name: "Нут, варёный без соли", kcal: 164, protein: 89, fat: 26, carbs: 274, usda: "CHICKPEAS ,MATURE SEEDS,CKD,BLD,WO/SALT" },
  { key: "sr16145", name: "Фасоль красная консервированная, без жидкости", kcal: 124, protein: 80, fat: 10, carbs: 215, usda: "BEANS,KIDNEY,RED,MATURE SEEDS,CND,DRND SOL" },
  { key: "sr12155", name: "Грецкий орех", kcal: 654, protein: 152, fat: 652, carbs: 137, usda: "WALNUTS,ENGLISH" },
  { key: "sr16087", name: "Арахис, сырой", kcal: 567, protein: 258, fat: 492, carbs: 161, usda: "PEANUTS,ALL TYPES,RAW" },
  { key: "sr12036", name: "Семечки подсолнечника очищенные", kcal: 584, protein: 208, fat: 515, carbs: 200, usda: "SUNFLOWER SD KRNLS,DRIED" },
  { key: "sr19335", name: "Сахар", kcal: 387, protein: 0, fat: 0, carbs: 1000, usda: "SUGARS,GRANULATED" },
  { key: "sr19296", name: "Мёд", kcal: 304, protein: 3, fat: 0, carbs: 824, usda: "HONEY" },
  { key: "sr19904", name: "Тёмный шоколад 70–85 %", kcal: 598, protein: 78, fat: 426, carbs: 459, usda: "CHOCOLATE,DK,70-85% CACAO SOL" },
];
