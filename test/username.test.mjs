import test from "node:test";
import assert from "node:assert/strict";
import {
  nextAvailableUsername,
  usernameFromEmail,
} from "../src/utils/username.mjs";

test("builds a username from the email local part", () => {
  assert.equal(usernameFromEmail("check@gmail.com"), "check");
  assert.equal(usernameFromEmail("Check.User@yahoo.com"), "check.user");
});

test("keeps the original username when it is free", () => {
  assert.equal(nextAvailableUsername("check", []), "check");
});

test("appends a suffix when the username is already taken", () => {
  assert.equal(nextAvailableUsername("check", ["check"]), "check_2");
  assert.equal(nextAvailableUsername("check", ["check", "check_2"]), "check_3");
});
