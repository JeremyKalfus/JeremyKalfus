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

const PORTFOLIO_META_LABELS = [
  "iOS app",
  "Chrome extension",
  "Website",
  "PDF • 1 page",
  "PDF • 3 pages",
  "PDF • 15 pages",
  "PDF • 5 pages",
  "PDF • 10 pages",
  "PDF • 4 pages",
  "PDF • 6 pages",
  "PDF • 2 pages"
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
    await expect(
      page.getByText("These writing samples are here as evidence of my writing abilities")
    ).toHaveCount(0);
    await expect(portfolioPanel.getByRole("heading", { level: 2, name: "Projects" })).toBeVisible();
    await expect(portfolioPanel.getByRole("heading", { level: 2, name: "Research" })).toBeVisible();
    await expect(portfolioPanel.getByRole("heading", { level: 2, name: "Writings" })).toBeVisible();
    await expect(portfolioPanel.getByRole("heading", { level: 2, name: "Resume" })).toBeVisible();
    await expect(portfolioPanel.locator(".resource-description")).toHaveCount(0);
    await expect(portfolioPanel.locator(".resource-meta-row")).toHaveCount(0);
    await expect(portfolioPanel.locator(".resource-meta")).toHaveCount(0);
    await expect(portfolioPanel.locator(".resource-action")).toHaveCount(0);
  });

  test("uses semantic portfolio lists", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const portfolioPanel = page.locator("#portfolio-panel");
    await page.getByRole("tab", { name: "Portfolio" }).click();

    await expect(portfolioPanel.getByRole("list")).toHaveCount(5);
    await expect(portfolioPanel.getByRole("listitem")).toHaveCount(12);
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
    const portfolioPanel = page.locator("#portfolio-panel");
    await page.getByRole("tab", { name: "Portfolio" }).click();

    const links = await portfolioPanel.locator('a[href$=".pdf"]').evaluateAll((nodes) =>
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

  test("shows portfolio tree links for every entry", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const portfolioPanel = page.locator("#portfolio-panel");
    await page.getByRole("tab", { name: "Portfolio" }).click();

    await expect(portfolioPanel.getByRole("link", { name: "Zenith Legal app" })).toBeVisible();
    await expect(portfolioPanel.getByRole("link", { name: "Synthesize" })).toBeVisible();
    await expect(portfolioPanel.getByRole("link", { name: "Tau AI" })).toBeVisible();
    await expect(
      portfolioPanel.getByText("Alzheimer's Treatment", { exact: true })
    ).toBeVisible();
    await expect(portfolioPanel.getByRole("link", { name: "AD Treatment Research (Poster)" })).toBeVisible();
    await expect(portfolioPanel.getByRole("link", { name: "AD Treatment Research (Proposal)" })).toBeVisible();
    await expect(portfolioPanel.getByRole("link", { name: "DEGs among PTSD and AD" })).toBeVisible();
    await expect(portfolioPanel.getByRole("link", { name: "Early Women's Rights History (APUSH)" })).toBeVisible();
    await expect(portfolioPanel.getByRole("link", { name: "On Collective Punishment (School Newspaper Argument)" })).toBeVisible();
    await expect(portfolioPanel.getByRole("link", { name: "Laqueur Essay (Death and Dying)" })).toBeVisible();
    await expect(portfolioPanel.getByRole("link", { name: "On the Assessment of AI Consciousness (Philosophy of Mind Indep. Study)" })).toBeVisible();
    await expect(portfolioPanel.getByRole("link", { name: "View Resume (PDF)" })).toBeVisible();
  });

  test("renders metadata labels in the portfolio DOM", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const portfolioPanel = page.locator("#portfolio-panel");
    await page.getByRole("tab", { name: "Portfolio" }).click();

    for (const label of PORTFOLIO_META_LABELS) {
      await expect(portfolioPanel.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test("renders tree prefixes in the portfolio DOM", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const portfolioPanel = page.locator("#portfolio-panel");
    await page.getByRole("tab", { name: "Portfolio" }).click();

    const rowTexts = await portfolioPanel.locator("li").evaluateAll((nodes) =>
      nodes.map((node) => (node.textContent || "").trim())
    );

    expect(rowTexts).toHaveLength(12);
    expect(rowTexts.every((text) => /^[├└│]/.test(text))).toBeTruthy();
    expect(rowTexts.some((text) => text.includes("Alzheimer's Treatment"))).toBeTruthy();
    expect(
      rowTexts.some((text) => PORTFOLIO_META_LABELS.some((label) => text.includes(label)))
    ).toBeTruthy();
    expect(rowTexts.every((text) => !/Open PDF|description/i.test(text))).toBeTruthy();
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
