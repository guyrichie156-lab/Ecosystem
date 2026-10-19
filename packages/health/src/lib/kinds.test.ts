import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMeasurement } from "./kinds";

test("a measurement is stored as an integer in the smallest unit", () => {
  assert.deepEqual(parseMeasurement("weight", "82,5"), { value: 82500 }); // grams
  assert.deepEqual(parseMeasurement("weight", " 82.5 "), { value: 82500 });
  assert.deepEqual(parseMeasurement("bodyFat", "18,5"), { value: 185 }); // tenths of a percent
  assert.deepEqual(parseMeasurement("waist", "84"), { value: 840 }); // millimetres
});

test("typos outside the plausible range are caught", () => {
  assert.deepEqual(parseMeasurement("weight", "825"), { error: "Вес: от 20 до 400 кг" });
  assert.deepEqual(parseMeasurement("bodyFat", "1"), { error: "Процент жира: от 2 до 75 %" });
});

test("only numbers with at most one decimal are accepted", () => {
  for (const text of ["82,55", "abc", "", "-80", "8 2"]) {
    assert.ok("error" in parseMeasurement("weight", text), `«${text}»`);
  }
});
