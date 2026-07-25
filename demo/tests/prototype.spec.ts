import { expect, test } from "@playwright/test";

test("defaults to MARTIN and keeps the name field above the keyboard", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "MARTIN，这是你的封面歌单" }),
  ).toBeVisible();
  const input = page.locator("#cover-name");
  await expect(input).toHaveValue("MARTIN");

  await input.click();
  await expect(page.getByTestId("keyboard-dock")).toHaveAttribute(
    "data-visible",
    "true",
  );
  await page.waitForTimeout(500);

  const assertDockAboveKeyboard = async () => {
    const layout = await page.evaluate(() => {
      const dock = document.querySelector<HTMLElement>(".command-dock")!;
      const keyboard = document.querySelector<HTMLElement>(
        '[data-testid="keyboard-dock"]',
      )!;
      const scroll = document.querySelector<HTMLElement>(
        '[data-testid="mobile-scroll"]',
      )!;

      return {
        dockBottom: dock.getBoundingClientRect().bottom,
        keyboardTop: keyboard.getBoundingClientRect().top,
        scrollBottom: scroll.getBoundingClientRect().bottom,
      };
    });

    expect(layout.keyboardTop - layout.dockBottom).toBeGreaterThanOrEqual(12);
    expect(layout.keyboardTop - layout.dockBottom).toBeLessThanOrEqual(16);
    expect(Math.abs(layout.scrollBottom - layout.keyboardTop)).toBeLessThanOrEqual(
      1,
    );
  };

  await assertDockAboveKeyboard();

  await input.fill("ALEXANDER");
  await page.waitForTimeout(500);
  await assertDockAboveKeyboard();
});
