// @ts-check
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPT_SOURCE = fs.readFileSync(
  path.join(__dirname, "..", "dist", "script.js"),
  "utf8"
);

test.describe("Storage Adapters", () => {
  test.describe("sessionStorage (default)", () => {
    test("stores attribution data in sessionStorage", async ({ page }) => {
      await page.goto("/tests/fixtures/basic-form?utm_source=session_test");

      const stored = await page.evaluate(() => {
        const data = sessionStorage.getItem("form_attribution_data");
        return data ? JSON.parse(data) : null;
      });

      expect(stored).not.toBeNull();
      expect(stored.utm_source).toBe("session_test");
    });

    test("persists data across page navigation within session", async ({
      page,
    }) => {
      // First page with UTM params
      await page.goto("/tests/fixtures/basic-form?utm_source=first_visit");

      // Navigate to another page without UTM params
      await page.goto("/tests/fixtures/basic-form");

      const form = page.locator("#contact-form");

      // Should still have the data from first visit
      await expect(form.locator('input[name="utm_source"]')).toHaveValue(
        "first_visit"
      );
    });

    test("preserves first-touch attribution data", async ({ page }) => {
      // First visit with initial UTM
      await page.goto(
        "/tests/fixtures/basic-form?utm_source=first_source&utm_medium=first_medium"
      );

      // Second visit with different UTM (same session)
      await page.goto("/tests/fixtures/basic-form?utm_source=second_source");

      const form = page.locator("#contact-form");

      // Should keep first-touch values
      await expect(form.locator('input[name="utm_source"]')).toHaveValue(
        "first_source"
      );
      await expect(form.locator('input[name="utm_medium"]')).toHaveValue(
        "first_medium"
      );
    });
  });

  test.describe("localStorage", () => {
    test("stores attribution data in localStorage when configured", async ({
      page,
    }) => {
      await page.goto("/tests/fixtures/storage-options?utm_source=local_test");

      // Add script with localStorage config
      await page.evaluate(() => {
        const script = document.createElement("script");
        script.src = "/dist/script.js";
        script.dataset.storage = "localStorage";
        script.dataset.debug = "true";
        document.body.appendChild(script);
      });

      // Wait for script to execute
      await page.waitForTimeout(100);

      const stored = await page.evaluate(() => {
        const data = localStorage.getItem("form_attribution_data");
        return data ? JSON.parse(data) : null;
      });

      expect(stored).not.toBeNull();
      expect(stored.utm_source).toBe("local_test");
    });
  });

  test.describe("Cookie storage", () => {
    test("stores attribution data in cookies when configured", async ({
      page,
    }) => {
      await page.goto("/tests/fixtures/storage-options?utm_source=cookie_test");

      // Force the implementation down the legacy document.cookie path.
      // This avoids browser-specific CookieStore behavior affecting the test.
      await page.evaluate(() => {
        try {
          Object.defineProperty(window, "cookieStore", {
            get: () => undefined,
            configurable: true,
          });
        } catch {
          // ignore
        }
      });

      // Execute the library as an inline script so document.currentScript points
      // at this script element and its dataset is reliably available.
      await page.evaluate(
        ({ source }) => {
          const script = document.createElement("script");
          script.dataset.storage = "cookie";
          script.dataset.debug = "true";
          script.textContent = source;
          document.body.appendChild(script);
        },
        { source: SCRIPT_SOURCE }
      );

      // Wait for cookie to be set (CookieStore API is async)
      await expect(async () => {
        const cookies = await page.context().cookies();
        const attrCookie = cookies.find(
          (c) => c.name === "form_attribution_data"
        );
        expect(attrCookie).toBeDefined();
      }).toPass({ timeout: 5000 });

      const cookies = await page.context().cookies();
      const attrCookie = cookies.find(
        (c) => c.name === "form_attribution_data"
      );
      const decoded = decodeURIComponent(attrCookie?.value ?? "");
      const data = JSON.parse(decoded);
      expect(data.utm_source).toBe("cookie_test");
    });
  });

  test.describe("Custom storage key", () => {
    test("uses custom storage key when configured", async ({ page }) => {
      await page.goto(
        "/tests/fixtures/storage-options?utm_source=custom_key_test"
      );

      // Add script with custom storage key
      await page.evaluate(() => {
        const script = document.createElement("script");
        script.src = "/dist/script.js";
        script.dataset.storageKey = "my_custom_attribution";
        script.dataset.debug = "true";
        document.body.appendChild(script);
      });

      await page.waitForTimeout(100);

      const stored = await page.evaluate(() => {
        const data = sessionStorage.getItem("my_custom_attribution");
        return data ? JSON.parse(data) : null;
      });

      expect(stored).not.toBeNull();
      expect(stored.utm_source).toBe("custom_key_test");

      // Default key should be empty
      const defaultKey = await page.evaluate(() => {
        return sessionStorage.getItem("form_attribution_data");
      });
      expect(defaultKey).toBeNull();
    });
  });

  test.describe("Storage fallback", () => {
    test("falls back gracefully when preferred storage is unavailable", async ({
      page,
    }) => {
      // Disable sessionStorage
      await page.addInitScript(() => {
        Object.defineProperty(window, "sessionStorage", {
          get: () => {
            throw new Error("Storage disabled");
          },
        });
      });

      await page.goto("/tests/fixtures/basic-form?utm_source=fallback_test");

      // Should still inject into forms (using cookie or memory fallback)
      const form = page.locator("#contact-form");
      await expect(form.locator('input[name="utm_source"]')).toHaveValue(
        "fallback_test"
      );
    });
  });
});
