// @ts-check
import { expect, test } from "@playwright/test";

test.describe("Privacy Signals", () => {
  test.describe("Global Privacy Control (GPC)", () => {
    test("disables tracking when GPC is enabled", async ({ page }) => {
      // Set GPC before page load
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "globalPrivacyControl", {
          get: () => true,
          configurable: true,
        });
      });

      await page.goto("/tests/fixtures/basic-form?utm_source=gpc_test");

      const form = page.locator("#contact-form");

      // No attribution fields should be injected
      await expect(
        form.locator('input[data-form-attribution="true"]')
      ).toHaveCount(0);
      await expect(form.locator('input[name="utm_source"]')).toHaveCount(0);
      await expect(form.locator('input[name="landing_page"]')).toHaveCount(0);
    });

    test("does not store data when GPC is enabled", async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "globalPrivacyControl", {
          get: () => true,
          configurable: true,
        });
      });

      await page.goto("/tests/fixtures/basic-form?utm_source=gpc_storage_test");

      const stored = await page.evaluate(() => {
        return sessionStorage.getItem("form_attribution_data");
      });

      expect(stored).toBeNull();
    });
  });

  test.describe("Do Not Track (DNT)", () => {
    test('disables tracking when DNT is set to "1"', async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "doNotTrack", {
          get: () => "1",
          configurable: true,
        });
      });

      await page.goto("/tests/fixtures/basic-form?utm_source=dnt_test");

      const form = page.locator("#contact-form");

      // No attribution fields should be injected
      await expect(
        form.locator('input[data-form-attribution="true"]')
      ).toHaveCount(0);
      await expect(form.locator('input[name="utm_source"]')).toHaveCount(0);
    });

    test('disables tracking when DNT is set to "yes"', async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "doNotTrack", {
          get: () => "yes",
          configurable: true,
        });
      });

      await page.goto("/tests/fixtures/basic-form?utm_source=dnt_yes_test");

      const form = page.locator("#contact-form");

      await expect(
        form.locator('input[data-form-attribution="true"]')
      ).toHaveCount(0);
    });

    test('allows tracking when DNT is set to "0"', async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "doNotTrack", {
          get: () => "0",
          configurable: true,
        });
      });

      await page.goto("/tests/fixtures/basic-form?utm_source=dnt_off_test");

      const form = page.locator("#contact-form");

      // Attribution should work normally
      await expect(form.locator('input[name="utm_source"]')).toHaveValue(
        "dnt_off_test"
      );
    });

    test("checks window.doNotTrack as fallback", async ({ page }) => {
      await page.addInitScript(() => {
        // Remove navigator.doNotTrack
        Object.defineProperty(navigator, "doNotTrack", {
          get: () => undefined,
          configurable: true,
        });
        // Set window.doNotTrack (used by older IE)
        Object.defineProperty(window, "doNotTrack", {
          get: () => "1",
          configurable: true,
        });
      });

      await page.goto("/tests/fixtures/basic-form?utm_source=window_dnt_test");

      const form = page.locator("#contact-form");

      await expect(
        form.locator('input[data-form-attribution="true"]')
      ).toHaveCount(0);
    });
  });

  test.describe("No privacy signals", () => {
    test("tracks normally when no privacy signals are set", async ({
      page,
    }) => {
      await page.goto("/tests/fixtures/basic-form?utm_source=normal_test");

      const form = page.locator("#contact-form");

      // Attribution should work
      await expect(form.locator('input[name="utm_source"]')).toHaveValue(
        "normal_test"
      );
      await expect(form.locator('input[name="landing_page"]')).toHaveCount(1);
    });
  });
});
