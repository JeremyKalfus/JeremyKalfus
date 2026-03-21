const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const homepageUi = require("../homepage-ui.js");
const homepageTheme = require("../theme-state.js");

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 }
];

const PORTFOLIO_SECTIONS = ["Projects", "Research", "Writings", "Resume"];
const REPRESENTATIVE_LINKS = [
  "Zenith Legal app",
  "AD Treatment Research (Poster)",
  "View Resume (PDF)"
];
const REQUIRED_PDFS = [
  "projects/DEG.pdf",
  "projects/NIM811.pdf",
  "projects/Prospectus.pdf",
  "resume/JK_Resume.pdf"
];

async function stubGoogleFonts(page) {
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/css",
      body: "",
    });
  });
}

async function openHomepage(page) {
  await page.goto("/", { waitUntil: "networkidle" });
}

async function openPortfolio(page) {
  await openHomepage(page);
  await page.getByRole("tab", { name: "Portfolio" }).click();
  await expect(page.locator("#portfolio-panel")).toBeVisible();
}

test.describe("homepage smoke checks", () => {
  test("exports an explicit theme service contract for homepage bootstraps", async () => {
    expect(homepageUi.readViewName("portfolio")).toBe("portfolio");
    expect(homepageUi.readViewName("missing")).toBeNull();
    expect(homepageUi.getThemeState({ homepageTheme })).toBe(homepageTheme);
    expect(() => homepageUi.getThemeState({})).toThrow(/theme-state\.js/);
  });

  test("normalizes theme state helpers even when storage access is blocked", async () => {
    const appliedClasses = new Set();
    const root = {
      dataset: {},
      classList: {
        toggle(className, shouldEnable) {
          if (shouldEnable) {
            appliedClasses.add(className);
            return;
          }

          appliedClasses.delete(className);
        }
      }
    };
    const failingStorage = {
      getItem() {
        throw { name: "SecurityError" };
      },
      setItem() {
        throw { name: "QuotaExceededError" };
      }
    };

    expect(homepageTheme.readStoredTheme(failingStorage)).toBe("light");
    expect(homepageTheme.persistTheme("dark", failingStorage)).toBe("dark");
    expect(homepageTheme.applyTheme("dark", root)).toBe("dark");
    expect(homepageTheme.resolveInitialTheme(root, failingStorage)).toBe("dark");
    expect(root.dataset.theme).toBe("dark");
    expect(appliedClasses.has("dark-mode")).toBeTruthy();
  });

  test("loads without console or page errors", async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];

    await stubGoogleFonts(page);

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await openHomepage(page);

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("renders the core headings", async ({ page }) => {
    await openHomepage(page);

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Jeremy Kalfus" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "About me" })).toBeVisible();
  });

  test("defaults to the about view and reveals the portfolio sections", async ({ page }) => {
    await openHomepage(page);

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

    for (const section of PORTFOLIO_SECTIONS) {
      await expect(portfolioPanel.getByRole("heading", { level: 2, name: section })).toBeVisible();
    }

    for (const linkName of REPRESENTATIVE_LINKS) {
      await expect(portfolioPanel.getByRole("link", { name: linkName })).toBeVisible();
    }
  });

  test("supports keyboard navigation across the homepage tabs", async ({ page }) => {
    await openHomepage(page);

    const aboutTab = page.getByRole("tab", { name: "About me" });
    const portfolioTab = page.getByRole("tab", { name: "Portfolio" });

    await aboutTab.focus();
    await aboutTab.press("ArrowRight");
    await expect(portfolioTab).toBeFocused();
    await expect(portfolioTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#portfolio-panel")).toBeVisible();

    await portfolioTab.press("ArrowLeft");
    await expect(aboutTab).toBeFocused();
    await expect(aboutTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#about-panel")).toBeVisible();

    await aboutTab.press("End");
    await expect(portfolioTab).toBeFocused();
    await expect(portfolioTab).toHaveAttribute("aria-selected", "true");

    await portfolioTab.press("Home");
    await expect(aboutTab).toBeFocused();
    await expect(aboutTab).toHaveAttribute("aria-selected", "true");
  });

  test("groups portfolio entries into accessible lists", async ({ page }) => {
    await openPortfolio(page);

    const portfolioPanel = page.locator("#portfolio-panel");
    const visibleLists = portfolioPanel.getByRole("list");
    const visibleItems = portfolioPanel.getByRole("listitem");

    await expect(visibleLists).toHaveCount(5);
    await expect(visibleItems).toHaveCount(12);
    await expect(portfolioPanel.getByText("Alzheimer's Treatment", { exact: true })).toBeVisible();
    await expect(portfolioPanel.locator(".tree-meta").first()).toBeVisible();
  });

  test("keeps the layout free of horizontal scrolling", async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await openHomepage(page);

      const hasOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth;
      });

      expect(hasOverflow, `Unexpected horizontal overflow at ${viewport.width}px`).toBeFalsy();
    }
  });

  test("serves working PDF links from the portfolio view", async ({ page, request }) => {
    await openPortfolio(page);

    const portfolioPanel = page.locator("#portfolio-panel");
    const links = await portfolioPanel.locator('a[href$=".pdf"]').evaluateAll((nodes) =>
      nodes.map((node) => ({
        href: node.getAttribute("href"),
        rel: node.getAttribute("rel")
      }))
    );

    expect(links.length).toBeGreaterThanOrEqual(REQUIRED_PDFS.length);
    expect(new Set(links.map((link) => link.href)).size).toBe(links.length);
    expect(links.every((link) => link.rel === "noopener noreferrer")).toBeTruthy();

    for (const requiredPdf of REQUIRED_PDFS) {
      expect(links.some((link) => link.href === requiredPdf)).toBeTruthy();
    }

    for (const { href } of links) {
      const response = await request.get(href);
      expect(response.ok(), `${href} should return a successful response`).toBeTruthy();
    }
  });

  test("toggles the theme and persists the choice after reload", async ({ page }) => {
    await stubGoogleFonts(page);
    await openHomepage(page);

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
  });

  test("keeps the homepage interactive when localStorage is unavailable", async ({ page }) => {
    const pageErrors = [];

    await page.addInitScript(() => {
      const error = () => new DOMException("Blocked", "SecurityError");
      const failingStorage = {
        getItem() {
          throw error();
        },
        setItem() {
          throw error();
        },
        removeItem() {
          throw error();
        },
        clear() {
          throw error();
        },
        key() {
          return null;
        },
        get length() {
          return 0;
        }
      };

      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: failingStorage
      });
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await openHomepage(page);

    const root = page.locator("html");
    const toggle = page.locator(".theme-toggle-checkbox");
    const label = page.locator(".theme-label");

    await expect(root).toHaveAttribute("data-theme", "light");
    await expect(label).toHaveText("Light");

    await toggle.check();
    await expect(root).toHaveAttribute("data-theme", "dark");
    await expect(label).toHaveText("Dark");

    await page.getByRole("tab", { name: "Portfolio" }).click();
    await expect(page.locator("#portfolio-panel")).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("has no critical accessibility violations on the homepage", async ({ page }) => {
    await openHomepage(page);

    const results = await new AxeBuilder({ page }).analyze();
    const criticalViolations = results.violations.filter(
      (violation) => violation.impact === "critical"
    );

    expect(criticalViolations).toEqual([]);
  });
});
