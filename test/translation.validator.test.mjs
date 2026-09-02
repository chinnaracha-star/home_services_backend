import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LOCALE,
  parseLocale,
} from "../src/validators/locale.validator.mjs";
import {
  parseTranslationBody,
} from "../src/validators/translation.validator.mjs";

test("locale defaults to Thai and normalizes supported values", () => {
  assert.equal(parseLocale(), DEFAULT_LOCALE);
  assert.equal(parseLocale(" EN "), "en");
  assert.equal(parseLocale("th"), "th");
});

test("locale rejects unsupported values", () => {
  assert.throws(() => parseLocale("jp"), {
    code: "INVALID_LOCALE",
  });
});

test("translation body requires a non-empty name", () => {
  assert.deepEqual(parseTranslationBody({ name: " Cleaning " }), {
    name: "Cleaning",
  });
  assert.throws(() => parseTranslationBody({ name: "" }), {
    code: "VALIDATION_ERROR",
  });
});

test("service option translation normalizes optional unit", () => {
  assert.deepEqual(
    parseTranslationBody(
      { name: "Air conditioner cleaning", unit: " unit " },
      { allowUnit: true },
    ),
    { name: "Air conditioner cleaning", unit: "unit" },
  );
});

test("service option translation allows omitting unit", () => {
  assert.deepEqual(
    parseTranslationBody({ name: "Cleaning" }, { allowUnit: true }),
    { name: "Cleaning", unit: null },
  );
});
