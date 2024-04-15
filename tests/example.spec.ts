import { test, expect } from "@playwright/test";
import consumers from "stream/consumers";

test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "English" }).click();
    await page.getByRole("button", { name: "Let's get started!" }).click();
    await page.getByText("Full Changelog").focus(); // Wait for the changelog frame to be loaded
    await page.keyboard.press("Escape"); // Dismiss the changelog
});

test("Load Blink example and check code", async ({ page }) => {
    await page.getByText("Leaphy Original").click();
    await page.getByText("Original Uno").click();

    // Open the blink example
    await page.getByRole("button", { name: "My projects" }).click();
    await page.getByRole("menuitem", { name: "Examples" }).click();
    await page
        .locator("div")
        .filter({ hasText: /^Blink$/ })
        .nth(1)
        .click();

    // Check code
    await page
        .locator("button")
        .filter({ hasText: /^code$/ })
        .click();
    await expect(page.locator(".view-lines")).toContainText(
        "void leaphyProgram() { while (true) { digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); }}void setup() {pinMode(13, OUTPUT); leaphyProgram();}void loop() {}",
    );

    // Modify delay to 500
    await page
        .getByLabel("Blockly Workspace")
        .getByText("1000")
        .first()
        .click();
    await page.locator("input").fill("500");
    await page.getByLabel("Blockly Workspace").getByText("1000").last().click(); // Use last as in headless mode it still finds the first one for some reason
    await page.locator("input").fill("500");

    // Check that the delays have been updated accordingly
    await expect(page.locator(".view-lines")).toContainText(
        "delay(500); digitalWrite(13, LOW); delay(500);",
    );

    // Save the robot
    await page.getByRole("button", { name: "Save" }).click();
    await page
        .getByPlaceholder("Give your download a name")
        .fill("MyModifiedBlink");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save" }).click();
    const download = await downloadPromise;

    // Check filename
    expect(download.suggestedFilename()).toBe("MyModifiedBlink.l_original_uno");

    // Check that the delay is now 500
    const data = await consumers.text(await download.createReadStream());
    expect(data).toContain('"fields":{"NUM":500}');
});

test("Double robot selection", async ({ page }) => {
    await page.getByText("Leaphy Original").click();
    await page.getByText("Original Uno").click();

    await expect(page.getByText("Original Uno")).toBeHidden();

    // For some reason it only happens the second time after entering. so reload the page.
    await page.reload();

    await page.getByText("Leaphy Original").click();
    await page.getByText("Original Uno").click();

    // There was a bug that the button shows up again after you are already in the editor
    await expect(page.getByText("Original Uno")).toBeHidden();
});
