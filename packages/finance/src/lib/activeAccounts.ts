import { sql } from "drizzle-orm";

/**
 * The one rule for which accounts count in balances, totals, records and charts: archived ones
 * don't. Use it as `account_id IN ${activeAccountIds}`, so the screens never disagree.
 */
export const activeAccountIds = sql`(SELECT id FROM accounts WHERE archived_at IS NULL)`;
