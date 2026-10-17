import { getTotalBalance, getThisMonthSpend } from "../lib/balance";
import { formatMinorUnits } from "../lib/money";

export async function getBalanceWidgetProps() {
  const [total, spend] = await Promise.all([getTotalBalance(), getThisMonthSpend()]);
  return {
    totalBalance: formatMinorUnits(total),
    monthSpend: formatMinorUnits(spend),
  };
}
