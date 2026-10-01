import test from "node:test";
import assert from "node:assert/strict";
import { buildPasswordResetRedirectUrl } from "../src/utils/password-reset-redirect.mjs";

test("uses localhost reset page when no production origin is set", () => {
  assert.equal(
    buildPasswordResetRedirectUrl({}),
    "http://localhost:3000/reset-password",
  );
});

test("builds the Vercel reset URL from CLIENT_ORIGIN", () => {
  assert.equal(
    buildPasswordResetRedirectUrl({
      clientOrigin: "https://your-app.vercel.app/",
      resetPath: "/reset-password",
    }),
    "https://your-app.vercel.app/reset-password",
  );
});

test("prefers an explicit password reset redirect URL", () => {
  assert.equal(
    buildPasswordResetRedirectUrl({
      redirectUrl: "https://your-app.vercel.app/reset-password/",
      clientOrigin: "http://localhost:3000",
    }),
    "https://your-app.vercel.app/reset-password",
  );
});
