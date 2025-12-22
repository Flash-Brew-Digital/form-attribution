// @ts-check
import { expect, test } from "@playwright/test";

test.describe("UTM Parameter Capture", () => {
  test("captures all default UTM parameters from URL", async ({ page }) => {
    await page.goto(
      "/tests/fixtures/basic-form?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale&utm_term=shoes&utm_content=banner&utm_id=123&ref=partner"
    );

    const form = page.locator("#contact-form");

    // Check all default UTM params are injected
    await expect(form.locator('input[name="utm_source"]')).toHaveValue(
      "google"
    );
    await expect(form.locator('input[name="utm_medium"]')).toHaveValue("cpc");
    await expect(form.locator('input[name="utm_campaign"]')).toHaveValue(
      "spring_sale"
    );
    await expect(form.locator('input[name="utm_term"]')).toHaveValue("shoes");
    await expect(form.locator('input[name="utm_content"]')).toHaveValue(
      "banner"
    );
    await expect(form.locator('input[name="utm_id"]')).toHaveValue("123");
    await expect(form.locator('input[name="ref"]')).toHaveValue("partner");
  });

  test("captures partial UTM parameters", async ({ page }) => {
    await page.goto(
      "/tests/fixtures/basic-form?utm_source=newsletter&utm_medium=email"
    );

    const form = page.locator("#contact-form");

    await expect(form.locator('input[name="utm_source"]')).toHaveValue(
      "newsletter"
    );
    await expect(form.locator('input[name="utm_medium"]')).toHaveValue("email");

    // Missing params should not create fields
    await expect(form.locator('input[name="utm_campaign"]')).toHaveCount(0);
    await expect(form.locator('input[name="utm_term"]')).toHaveCount(0);
  });

  test("captures landing_page without query string", async ({ page }) => {
    await page.goto("/tests/fixtures/basic-form?utm_source=test");

    const form = page.locator("#contact-form");
    const landingPage = await form
      .locator('input[name="landing_page"]')
      .inputValue();

    expect(landingPage).toContain("/tests/fixtures/basic-form");
    expect(landingPage).not.toContain("?");
  });

  test("captures current_page without query string", async ({ page }) => {
    await page.goto("/tests/fixtures/basic-form?utm_source=test");

    const form = page.locator("#contact-form");
    const currentPage = await form
      .locator('input[name="current_page"]')
      .inputValue();

    expect(currentPage).toContain("/tests/fixtures/basic-form");
    expect(currentPage).not.toContain("?");
  });

  test("captures first_touch_timestamp as valid ISO date", async ({ page }) => {
    await page.goto("/tests/fixtures/basic-form?utm_source=test");

    const form = page.locator("#contact-form");
    const timestamp = await form
      .locator('input[name="first_touch_timestamp"]')
      .inputValue();

    // Should be a valid ISO date string
    const date = new Date(timestamp);
    expect(date.toString()).not.toBe("Invalid Date");
  });

  test("handles URL-encoded parameter values", async ({ page }) => {
    await page.goto(
      "/tests/fixtures/basic-form?utm_source=my%20source&utm_campaign=spring%2Fsale"
    );

    const form = page.locator("#contact-form");

    await expect(form.locator('input[name="utm_source"]')).toHaveValue(
      "my source"
    );
    await expect(form.locator('input[name="utm_campaign"]')).toHaveValue(
      "spring/sale"
    );
  });

  test("handles special characters safely (XSS prevention)", async ({
    page,
  }) => {
    await page.goto(
      '/tests/fixtures/basic-form?utm_source=<script>alert(1)</script>&utm_medium="onclick=alert(1)"'
    );

    const form = page.locator("#contact-form");

    // Values should be sanitized
    const source = await form.locator('input[name="utm_source"]').inputValue();
    const medium = await form.locator('input[name="utm_medium"]').inputValue();

    expect(source).not.toContain("<script>");
    expect(medium).not.toContain('"');
  });

  test("injects into all forms on the page", async ({ page }) => {
    await page.goto("/tests/fixtures/basic-form?utm_source=test");

    const contactForm = page.locator("#contact-form");
    const newsletterForm = page.locator("#newsletter-form");

    await expect(contactForm.locator('input[name="utm_source"]')).toHaveValue(
      "test"
    );
    await expect(
      newsletterForm.locator('input[name="utm_source"]')
    ).toHaveValue("test");
  });

  test("handles page without UTM parameters", async ({ page }) => {
    await page.goto("/tests/fixtures/basic-form");

    const form = page.locator("#contact-form");

    // Should still inject meta params
    await expect(form.locator('input[name="landing_page"]')).toHaveCount(1);
    await expect(form.locator('input[name="current_page"]')).toHaveCount(1);
    await expect(
      form.locator('input[name="first_touch_timestamp"]')
    ).toHaveCount(1);

    // UTM params should not be present
    await expect(form.locator('input[name="utm_source"]')).toHaveCount(0);
  });
});
