import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: ["cash", "bank", "card", "savings"] }).notNull(),
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
    // Integers, never floats: grams for "weight", millimetres for every circumference.
    value: integer("value").notNull(),
    measuredAt: integer("measured_at").notNull(),
  },
  (t) => [index("body_measurements_kind_measured_at").on(t.kind, t.measuredAt)]
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
