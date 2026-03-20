const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 }
];

const EXPECTED_HEADINGS = ["About me"];
const EXPECTED_PDFS = [
  "projects/NIM811.pdf",
  "projects/Prospectus.pdf",
  "projects/DEG.pdf",
  "writings/APUSHWR.pdf",
  "writings/OCP.pdf",
  "writings/WOTD.pdf",
  "writings/OAIC.pdf",
  "resume/JK_Resume.pdf"
];

test.describe("homepage smoke checks", () => {
  test("loads without console or page errors", async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];

    await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/css",
        body: "",
      });
    });

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto("/", { waitUntil: "networkidle" });

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("renders the core headings", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Jeremy Kalfus" })).toBeVisible();

    for (const heading of EXPECTED_HEADINGS) {
      await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
    }
  });

  test("defaults to the about view and switches to portfolio", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const aboutTab = page.getByRole("tab", { name: "About me" });
    const portfolioTab = page.getByRole("tab", { name: "Portfolio" });
    const aboutPanel = page.locator("#about-panel");
    const portfolioPanel = page.locator("#portfolio-panel");

    await expect(aboutTab).toHaveAttribute("aria-selected", "true");
    await expect(portfolioTab).toHaveAttribute("aria-selected", "false");
    await expect(aboutPanel).toBeVisible();
    await expect(portfolioPanel).toBeHidden();

    await portfolioTab.click();

    await expect(aboutTab).toHaveAttribute("aria-selected", "false");
    await expect(portfolioTab).toHaveAttribute("aria-selected", "true");
    await expect(aboutPanel).toBeHidden();
    await expect(portfolioPanel).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Projects" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Writings" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Resume" })).toBeVisible();
  });

  test("uses semantic resource lists", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await page.getByRole("tab", { name: "Portfolio" }).click();

    await expect(page.getByRole("list")).toHaveCount(3);
    await expect(page.getByRole("listitem")).toHaveCount(8);
  });

  test("keeps the layout free of horizontal scrolling", async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto("/", { waitUntil: "networkidle" });

      const hasOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth;
      });

      expect(hasOverflow, `Unexpected horizontal overflow at ${viewport.width}px`).toBeFalsy();
    }
  });

  test("exposes valid PDF links", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Portfolio" }).click();

    const links = await page.locator('a[href$=".pdf"]').evaluateAll((nodes) =>
      nodes.map((node) => ({
        href: node.getAttribute("href"),
        rel: node.getAttribute("rel")
      }))
    );

    expect(links.map((link) => link.href)).toEqual(EXPECTED_PDFS);
    expect(links.every((link) => link.rel === "noopener noreferrer")).toBeTruthy();

    for (const { href } of links) {
      const response = await request.get(href);
      expect(response.ok(), `${href} should return a successful response`).toBeTruthy();
    }
  });

  test("shows resource metadata and actions on every card", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("tab", { name: "Portfolio" }).click();

    await expect(page.locator(".resource-title")).toHaveCount(8);
    await expect(page.locator(".resource-description")).toHaveCount(8);
    await expect(page.locator(".resource-meta")).toHaveCount(8);
    await expect(page.locator(".resource-action")).toHaveCount(8);
  });

  test("toggles the theme and persists the choice after reload", async ({ page }) => {
    await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/css",
        body: "",
      });
    });

    await page.goto("/", { waitUntil: "networkidle" });

    const toggle = page.locator(".theme-toggle-checkbox");
    const label = page.locator(".theme-label");
    const root = page.locator("html");

    await expect(toggle).toHaveCount(1);
    await expect(toggle).not.toBeChecked();
    await expect(root).toHaveAttribute("data-theme", "light");
    await expect(label).toHaveText("Light");

    await toggle.check();
    await expect(root).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toBeChecked();
    await expect(label).toHaveText("Dark");

    await page.reload({ waitUntil: "networkidle" });

    await expect(root).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toBeChecked();
    await expect(label).toHaveText("Dark");

    await page.getByRole("tab", { name: "Portfolio" }).click();
    await expect(page.locator("#portfolio-panel")).toBeVisible();

    await toggle.uncheck();
    await expect(root).toHaveAttribute("data-theme", "light");
    await expect(label).toHaveText("Light");
  });

  test("has no critical accessibility violations on the homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page }).analyze();
    const criticalViolations = results.violations.filter(
      (violation) => violation.impact === "critical"
    );

    expect(criticalViolations).toEqual([]);
  });
});
