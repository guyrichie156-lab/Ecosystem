import { test } from "node:test";
import assert from "node:assert/strict";
import { formatAmount, formatMinorUnits, parseMinorUnits } from "./money";

test("parses whole and decimal amounts with comma or dot", () => {
  assert.equal(parseMinorUnits("1500"), 150000);
  assert.equal(parseMinorUnits("1500,5"), 150050);
  assert.equal(parseMinorUnits("1500.55"), 150055);
  assert.equal(parseMinorUnits("0,01"), 1);
});

test("accepts spaces between digit groups, including the ones Intl uses for ru-RU", () => {
  assert.equal(parseMinorUnits("1 000"), 100000);
  assert.equal(parseMinorUnits("1 000,50"), 100050);
  assert.equal(parseMinorUnits("12 345"), 1234500);
  assert.equal(parseMinorUnits(" 250 "), 25000);
});

test("rejects text, empty input and more than two decimals", () => {
  assert.equal(parseMinorUnits("abc"), null);
  assert.equal(parseMinorUnits(""), null);
  assert.equal(parseMinorUnits("1,234"), null);
  assert.equal(parseMinorUnits("1.2.3"), null);
});

test("negative amounts only when allowed", () => {
  assert.equal(parseMinorUnits("-500"), null);
  assert.equal(parseMinorUnits("-500", { allowNegative: true }), -50000);
  assert.equal(parseMinorUnits("−1 000,50", { allowNegative: true }), -100050);
});

test("formats back to Belarusian rubles by default", () => {
  // Intl inserts a narrow no-break space between digit groups for ru-RU.
  assert.equal(formatMinorUnits(150050).replace(/\s/g, " "), "1 500,50 BYN");
  assert.equal(formatMinorUnits(-50000, "BYN").replace(/\s/g, " "), "−500,00 BYN");
  assert.equal(formatMinorUnits(1250).replace(/\s/g, " "), "12,50 BYN");
});

test("negative amounts get a true minus sign, the same as in front of a record", () => {
  assert.equal(formatAmount(-5500), "−55,00");
  assert.equal(formatAmount(0), "0,00");
  assert.equal(formatAmount(-0), "0,00");
  assert.equal(parseMinorUnits(formatAmount(-5500), { allowNegative: true }), -5500);
});
