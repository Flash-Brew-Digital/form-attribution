// @ts-check
import { expect, test } from "@playwright/test";

test.describe("Form Hidden Field Injection", () => {
  test('injected fields have type="hidden"', async ({ page }) => {
    await page.goto("/tests/fixtures/basic-form?utm_source=test");

    const form = page.locator("#contact-form");
    const hiddenFields = form.locator(
      'input[type="hidden"][data-form-attribution="true"]'
    );

    const count = await hiddenFields.count();
    expect(count).toBeGreaterThan(0);

    // All should be hidden
    for (let i = 0; i < count; i++) {
      await expect(hiddenFields.nth(i)).toHaveAttribute("type", "hidden");
    }
  });

  test("injected fields have data-form-attribution marker", async ({
    page,
  }) => {
    await page.goto("/tests/fixtures/basic-form?utm_source=test");

    const form = page.locator("#contact-form");
    const markedFields = form.locator('input[data-form-attribution="true"]');

    const count = await markedFields.count();
    expect(count).toBeGreaterThan(0);
  });

  test("injected fields have data-form-attribution-managed marker", async ({
    page,
  }) => {
    await page.goto("/tests/fixtures/basic-form?utm_source=test");

    const form = page.locator("#contact-form");
    const managedFields = form.locator(
      'input[data-form-attribution-managed="true"]'
    );

    const count = await managedFields.count();
    expect(count).toBeGreaterThan(0);
  });

  test("updates existing hidden fields instead of creating duplicates", async ({
    page,
  }) => {
    await page.goto(
      "/tests/fixtures/existing-hidden-fields?utm_source=from_url&utm_medium=updated"
    );

    const form = page.locator("#form-with-hidden");

    // Should update the existing fields, not create new ones
    const sourceFields = form.locator('input[name="utm_source"]');
    const mediumFields = form.locator('input[name="utm_medium"]');

    // Should only have one of each (the original)
    await expect(sourceFields).toHaveCount(1);
    await expect(mediumFields).toHaveCount(1);

    // Values should be updated from URL
    await expect(sourceFields).toHaveValue("from_url");
    await expect(mediumFields).toHaveValue("updated");

    // Should have managed marker
    await expect(sourceFields).toHaveAttribute(
      "data-form-attribution-managed",
      "true"
    );
  });

  test("applies field prefix when configured", async ({ page }) => {
    await page.goto(
      "/tests/fixtures/field-prefix?utm_source=test&utm_medium=email"
    );

    const form = page.locator("#prefixed-form");

    // Fields should have the prefix
    await expect(form.locator('input[name="attr_utm_source"]')).toHaveValue(
      "test"
    );
    await expect(form.locator('input[name="attr_utm_medium"]')).toHaveValue(
      "email"
    );
    await expect(form.locator('input[name="attr_landing_page"]')).toHaveCount(
      1
    );
    await expect(form.locator('input[name="attr_current_page"]')).toHaveCount(
      1
    );

    // Non-prefixed fields should not exist
    await expect(form.locator('input[name="utm_source"]')).toHaveCount(0);
  });

  test("captures extra params when configured", async ({ page }) => {
    await page.goto(
      "/tests/fixtures/extra-params?utm_source=google&gclid=abc123&fbclid=fb456&campaign_id=789"
    );

    const form = page.locator("#extra-params-form");

    // Default params
    await expect(form.locator('input[name="utm_source"]')).toHaveValue(
      "google"
    );

    // Extra params
    await expect(form.locator('input[name="gclid"]')).toHaveValue("abc123");
    await expect(form.locator('input[name="fbclid"]')).toHaveValue("fb456");
    await expect(form.locator('input[name="campaign_id"]')).toHaveValue("789");
  });

  test("excludes forms matching exclude selector", async ({ page }) => {
    await page.goto("/tests/fixtures/exclude-forms?utm_source=test");

    // Included form should have attribution fields
    const includeForm = page.locator("#include-form");
    await expect(includeForm.locator('input[name="utm_source"]')).toHaveValue(
      "test"
    );

    // Excluded forms should NOT have attribution fields
    const excludeForm = page.locator("#exclude-form");
    const anotherExclude = page.locator("#another-exclude");

    await expect(excludeForm.locator('input[name="utm_source"]')).toHaveCount(
      0
    );
    await expect(
      excludeForm.locator('input[data-form-attribution="true"]')
    ).toHaveCount(0);

    await expect(
      anotherExclude.locator('input[name="utm_source"]')
    ).toHaveCount(0);
    await expect(
      anotherExclude.locator('input[data-form-attribution="true"]')
    ).toHaveCount(0);
  });

  test("does not affect non-hidden form fields", async ({ page }) => {
    await page.goto("/tests/fixtures/basic-form?utm_source=test");

    const form = page.locator("#contact-form");

    // User input fields should remain unchanged
    await expect(form.locator('input[name="name"]')).toHaveAttribute(
      "type",
      "text"
    );
    await expect(form.locator('input[name="email"]')).toHaveAttribute(
      "type",
      "email"
    );

    // They should not have attribution markers
    await expect(form.locator('input[name="name"]')).not.toHaveAttribute(
      "data-form-attribution"
    );
    await expect(form.locator('input[name="email"]')).not.toHaveAttribute(
      "data-form-attribution"
    );
  });
});
