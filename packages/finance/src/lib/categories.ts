import { eq } from "drizzle-orm";
import { db, categories } from "@ecosystem/db";

export async function getCategories() {
  return db.select().from(categories);
}

export async function getExpenseCategories() {
  return db.select().from(categories).where(eq(categories.kind, "expense"));
}
