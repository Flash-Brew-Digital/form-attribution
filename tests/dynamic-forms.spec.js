// @ts-check
import { expect, test } from "@playwright/test";

test.describe("Dynamic Form Injection (MutationObserver)", () => {
  test("injects attribution into dynamically added forms", async ({ page }) => {
    await page.goto(
      "/tests/fixtures/dynamic-forms?utm_source=dynamic_test&utm_medium=observer"
    );

    // Initially no dynamic forms
    await expect(page.locator("#dynamic-form-1")).toHaveCount(0);

    // Add a form dynamically
    await page.click("#add-form-btn");

    // Wait for the form to appear
    const dynamicForm = page.locator("#dynamic-form-1");
    await expect(dynamicForm).toBeVisible();

    // Attribution fields should be injected
    await expect(dynamicForm.locator('input[name="utm_source"]')).toHaveValue(
      "dynamic_test"
    );
    await expect(dynamicForm.locator('input[name="utm_medium"]')).toHaveValue(
      "observer"
    );
    await expect(dynamicForm.locator('input[name="landing_page"]')).toHaveCount(
      1
    );
  });

  test("injects into multiple dynamically added forms", async ({ page }) => {
    await page.goto("/tests/fixtures/dynamic-forms?utm_source=multi_dynamic");

    // Add multiple forms
    await page.click("#add-form-btn");
    await page.click("#add-form-btn");
    await page.click("#add-form-btn");

    // All forms should have attribution
    for (let i = 1; i <= 3; i++) {
      const form = page.locator(`#dynamic-form-${i}`);
      await expect(form).toBeVisible();
      await expect(form.locator('input[name="utm_source"]')).toHaveValue(
        "multi_dynamic"
      );
    }
  });

  test("handles rapid form additions", async ({ page }) => {
    await page.goto("/tests/fixtures/dynamic-forms?utm_source=rapid_test");

    // Rapidly add forms
    await page.evaluate(() => {
      const btn = document.getElementById("add-form-btn");
      for (let i = 0; i < 5; i++) {
        btn?.click();
      }
    });

    // Wait a moment for microtask queue to flush
    await page.waitForTimeout(50);

    // All forms should be properly injected
    for (let i = 1; i <= 5; i++) {
      const form = page.locator(`#dynamic-form-${i}`);
      await expect(form.locator('input[name="utm_source"]')).toHaveValue(
        "rapid_test"
      );
    }
  });

  test("handles forms added via innerHTML", async ({ page }) => {
    await page.goto("/tests/fixtures/dynamic-forms?utm_source=innerhtml_test");

    // Add form via innerHTML (simulating CMS/AJAX content)
    await page.evaluate(() => {
      const container = document.getElementById("form-container");
      if (container) {
        const div = document.createElement("div");
        div.id = "inner-wrapper";

        const form = document.createElement("form");
        form.id = "innerhtml-form";
        form.action = "/submit";
        form.method = "post";

        const input = document.createElement("input");
        input.type = "text";
        input.name = "test";

        form.appendChild(input);
        div.appendChild(form);
        container.appendChild(div);
      }
    });

    const form = page.locator("#innerhtml-form");
    await expect(form).toBeVisible();
    await expect(form.locator('input[name="utm_source"]')).toHaveValue(
      "innerhtml_test"
    );
  });

  test("handles nested forms in dynamically added containers", async ({
    page,
  }) => {
    await page.goto("/tests/fixtures/dynamic-forms?utm_source=nested_test");

    // Add a container with a nested form
    await page.evaluate(() => {
      const container = document.getElementById("form-container");
      if (container) {
        const wrapper = document.createElement("div");
        wrapper.className = "form-wrapper";

        const form = document.createElement("form");
        form.id = "nested-form";
        form.action = "/submit";

        const input = document.createElement("input");
        input.type = "text";
        input.name = "nested-field";

        form.appendChild(input);
        wrapper.appendChild(form);
        container.appendChild(wrapper);
      }
    });

    const form = page.locator("#nested-form");
    await expect(form.locator('input[name="utm_source"]')).toHaveValue(
      "nested_test"
    );
  });
});
