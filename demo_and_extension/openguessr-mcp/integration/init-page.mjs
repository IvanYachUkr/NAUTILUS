import initializeAdapter from "../browser/init-page.mjs";

export default async ({ page }) => {
  await initializeAdapter({ page });
  const url = process.env.NAUTILUS_OPENGUESSR_FIXTURE_URL;
  if (!url) throw new Error("NAUTILUS_OPENGUESSR_FIXTURE_URL is required.");
  await page.goto(url);
};
