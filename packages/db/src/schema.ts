import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["cash", "bank", "card", "savings"] }).notNull(),
  // The column default stays as created in 0000 (changing it means rebuilding the table);
  // the app always writes APP_CURRENCY explicitly.
  currency: text("currency").notNull().default("RUB"),
  // Minor units (e.g. kopecks/cents), never a float.
  initialBalance: integer("initial_balance").notNull().default(0),
  // Minor units; null means the user hasn't set a low-balance alert for this account.
  lowBalanceThreshold: integer("low_balance_threshold"),
  archivedAt: integer("archived_at"),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["income", "expense"] }).notNull(),
  color: text("color"),
  icon: text("icon"),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
  // Minor units, always positive; sign is implied by `type`.
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  counterpartAccountId: integer("counterpart_account_id").references(() => accounts.id),
  occurredAt: integer("occurred_at").notNull(),
  note: text("note"),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const budgets = sqliteTable("budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  period: text("period", { enum: ["monthly"] }).notNull().default("monthly"),
  amountLimit: integer("amount_limit").notNull(),
  // Format: "YYYY-MM"
  startMonth: text("start_month").notNull(),
});

export const BODY_MEASUREMENT_KINDS = [
  "weight",
  "bodyFat",
  "neck",
  "chest",
  "waist",
  "belly",
  "hips",
  "biceps",
  "thigh",
] as const;
export type BodyMeasurementKind = (typeof BODY_MEASUREMENT_KINDS)[number];

// One value per row; the rows saved together share `measured_at` and form one check-in.
export const bodyMeasurements = sqliteTable(
  "body_measurements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: BODY_MEASUREMENT_KINDS }).notNull(),
    // Integers, never floats: grams for "weight", tenths of a percent for "bodyFat",
    // millimetres for every circumference.
    value: integer("value").notNull(),
    measuredAt: integer("measured_at").notNull(),
    // Where the value came from: typed in, or imported from Health Connect.
    source: text("source", { enum: ["manual", "health_connect"] }).notNull().default("manual"),
    // The record's id in its source; unique so an import never adds the same record twice.
    externalId: text("external_id"),
  },
  (t) => [
    index("body_measurements_kind_measured_at").on(t.kind, t.measuredAt),
    uniqueIndex("body_measurements_external_id").on(t.externalId),
  ]
);

// Workouts. Exercises are not a table: they are the app's catalog (packages/health/src/lib/exercises.ts),
// referred to by its text id.

/** A saved workout («комплекс»): a named list of exercises. */
export const workoutTemplates = sqliteTable("workout_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const workoutTemplateExercises = sqliteTable(
  "workout_template_exercises",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    templateId: integer("template_id")
      .notNull()
      .references(() => workoutTemplates.id),
    exerciseId: text("exercise_id").notNull(),
    position: integer("position").notNull(),
    sets: integer("sets").notNull(),
    // Repetitions, or seconds for a held exercise such as the plank.
    reps: integer("reps").notNull(),
  },
  (t) => [index("workout_template_exercises_template").on(t.templateId, t.position)]
);

/** One workout as done (or being done): finished_at stays null until the user finishes it. */
export const workoutSessions = sqliteTable(
  "workout_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // Null for a workout that wasn't started from a template, or whose template was deleted.
    templateId: integer("template_id").references(() => workoutTemplates.id),
    name: text("name").notNull(),
    startedAt: integer("started_at").notNull(),
    finishedAt: integer("finished_at"),
  },
  (t) => [index("workout_sessions_finished_at").on(t.finishedAt)]
);

export const workoutSets = sqliteTable(
  "workout_sets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: integer("session_id")
      .notNull()
      .references(() => workoutSessions.id),
    exerciseId: text("exercise_id").notNull(),
    position: integer("position").notNull(),
    // Grams, like body weight; null when the exercise uses body weight only.
    weightGrams: integer("weight_grams"),
    reps: integer("reps"),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    index("workout_sets_session").on(t.sessionId, t.position),
    index("workout_sets_exercise").on(t.exerciseId),
  ]
);

// Food. Amounts per 100 g are integers: kcal, and protein, fat and carbohydrates in tenths of a gram.

export const foods = sqliteTable(
  "foods",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    brand: text("brand"),
    // EAN/UPC from the package; unique, so a scanned product is stored once.
    barcode: text("barcode"),
    // "base": the app's built-in list, "off": Open Food Facts, "custom": typed in by the user.
    source: text("source", { enum: ["base", "off", "custom"] }).notNull(),
    // Id of a built-in food, so the list can be added again without duplicates.
    baseKey: text("base_key"),
    kcal: integer("kcal").notNull(),
    protein: integer("protein").notNull(),
    fat: integer("fat").notNull(),
    carbs: integer("carbs").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [uniqueIndex("foods_barcode").on(t.barcode), uniqueIndex("foods_base_key").on(t.baseKey)]
);

/** What was eaten: the portion's own kcal and macros are kept, so editing the food doesn't rewrite history. */
export const foodEntries = sqliteTable(
  "food_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    foodId: integer("food_id")
      .notNull()
      .references(() => foods.id),
    grams: integer("grams").notNull(),
    meal: text("meal", { enum: ["breakfast", "lunch", "dinner", "snack"] }).notNull(),
    eatenAt: integer("eaten_at").notNull(),
    kcal: integer("kcal").notNull(),
    protein: integer("protein").notNull(),
    fat: integer("fat").notNull(),
    carbs: integer("carbs").notNull(),
  },
  (t) => [index("food_entries_eaten_at").on(t.eatenAt)]
);

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions, { relationName: "accountTransactions" }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
    relationName: "accountTransactions",
  }),
  counterpartAccount: one(accounts, {
    fields: [transactions.counterpartAccountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));
