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

test("saved poster keeps ten album covers on one row", async ({ page }) => {
  await page.goto("/?name=ABCDEFGHIJ&seed=0");
  await expect(
    page.getByRole("heading", { name: "ABCDEFGHIJ，这是你的封面歌单" }),
  ).toBeVisible();

  await page.evaluate(() => {
    const captureWindow = window as typeof window & {
      __coverTunePosterSize?: { width: number; height: number };
    };
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;

    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      captureWindow.__coverTunePosterSize = {
        width: this.width,
        height: this.height,
      };
      return originalToBlob.call(this, callback, type, quality);
    };
  });

  await page.getByRole("button", { name: "保存结果图片到本地" }).click();

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __coverTunePosterSize?: { width: number; height: number };
            }
          ).__coverTunePosterSize ?? null,
      ),
    )
    .toEqual({ width: 2392, height: 748 });
});
