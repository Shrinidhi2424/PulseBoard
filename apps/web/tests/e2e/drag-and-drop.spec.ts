import { test, expect } from "@playwright/test";

test.describe("Kanban Drag-and-Drop E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the board to finish hydrating and render main landmarks
    await expect(page.getByRole("region", { name: "To Do" })).toBeVisible();
    await expect(page.getByRole("region", { name: "In Progress" })).toBeVisible();

    // Ensure To Do column has at least one task to drag
    const todoCards = page.getByRole("region", { name: "To Do" }).getByRole("button", { name: /^Task:/ });
    const count = await todoCards.count();
    if (count === 0) {
      const uniqueTitle = `Automated E2E Task ${Date.now()}`;
      await page.getByRole("button", { name: "Add task to To Do" }).click();
      await page.locator("#new-task-title").fill(uniqueTitle);
      await page.getByRole("button", { name: "Create Task" }).click();
      await expect(
        page.getByRole("region", { name: "To Do" }).getByRole("button", { name: new RegExp(uniqueTitle, "i") })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("user can drag a task card from To Do to In Progress column", async ({ page }) => {
    const todoColumn = page.getByRole("region", { name: "To Do" });
    const inProgressColumn = page.getByRole("region", { name: "In Progress" });

    // Identify first available task card in To Do column
    const taskCard = todoColumn.getByRole("button", { name: /^Task:/ }).first();
    await expect(taskCard).toBeVisible();

    const cardLabel = await taskCard.getAttribute("aria-label");
    expect(cardLabel).toBeTruthy();

    const cardBox = await taskCard.boundingBox();
    const colBox = await inProgressColumn.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(colBox).not.toBeNull();

    // Move to center of card and initiate pointer drag
    await page.mouse.move(cardBox!.x + cardBox!.width / 2, cardBox!.y + cardBox!.height / 2);
    await page.mouse.down();

    // Exceed the 5px activation distance constraint
    await page.mouse.move(cardBox!.x + cardBox!.width / 2 + 15, cardBox!.y + cardBox!.height / 2 + 15, {
      steps: 5,
    });

    // Drag over In Progress column
    await page.mouse.move(colBox!.x + colBox!.width / 2, colBox!.y + 120, {
      steps: 15,
    });

    // Drop card
    await page.mouse.up();

    // Verify card has moved to the In Progress column
    await expect(
      inProgressColumn.getByRole("button", { name: cardLabel! }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("task position persists after page reload", async ({ page }) => {
    const todoColumn = page.getByRole("region", { name: "To Do" });
    const inProgressColumn = page.getByRole("region", { name: "In Progress" });

    // Identify a task card in In Progress, or move one if none present
    let inProgressCard = inProgressColumn.getByRole("button", { name: /^Task:/ }).first();
    const hasCard = await inProgressCard.isVisible().catch(() => false);

    if (!hasCard) {
      const taskCard = todoColumn.getByRole("button", { name: /^Task:/ }).first();
      await expect(taskCard).toBeVisible();
      const cardBox = await taskCard.boundingBox();
      const colBox = await inProgressColumn.boundingBox();
      if (cardBox && colBox) {
        await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(cardBox.x + cardBox.width / 2 + 15, cardBox.y + cardBox.height / 2 + 15, {
          steps: 5,
        });
        await page.mouse.move(colBox.x + colBox.width / 2, colBox.y + 120, {
          steps: 15,
        });
        await page.mouse.up();
      }
      inProgressCard = inProgressColumn.getByRole("button", { name: /^Task:/ }).first();
      await expect(inProgressCard).toBeVisible({ timeout: 5000 });
    }

    const cardLabel = await inProgressCard.getAttribute("aria-label");
    expect(cardLabel).toBeTruthy();

    // Hard reload page to verify persistence via IndexedDB / Server Sync
    await page.reload();

    await expect(
      page.getByRole("region", { name: "In Progress" }).getByRole("button", { name: cardLabel! }).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
