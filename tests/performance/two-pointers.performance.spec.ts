import { expect, test } from "@playwright/test";

const LESSON = "/lessons/dsa/two-pointers/";

/**
 * A laboratory regression proxy, not a field measurement. These run against a
 * local preview server on one machine, so they catch a regression in the shape
 * of the page rather than predicting real-world numbers. The production
 * acceptance targets remain p75 LCP <= 2500 ms, INP <= 200 ms, CLS <= 0.1 once
 * field data exists.
 */
test("renders its largest content and stays visually stable", async ({
  page,
}) => {
  await page.goto(LESSON, { waitUntil: "load" });

  const metrics = await page.evaluate(
    async () =>
      new Promise<{ lcp: number; cls: number }>((resolve) => {
        let lcp = 0;
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) lcp = entry.startTime;
        }).observe({ buffered: true, type: "largest-contentful-paint" });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              hadRecentInput: boolean;
              value: number;
            };
            if (!shift.hadRecentInput) cls += shift.value;
          }
        }).observe({ buffered: true, type: "layout-shift" });

        setTimeout(() => {
          resolve({ cls, lcp });
        }, 2_500);
      }),
  );

  const measured = `LCP ${Math.round(metrics.lcp)}ms, CLS ${metrics.cls.toFixed(4)}`;
  console.log(`[performance] ${measured}`);

  expect(
    {
      clsWithinBudget: metrics.cls <= 0.1,
      lcpWithinBudget: metrics.lcp <= 2_500,
    },
    measured,
  ).toEqual({ clsWithinBudget: true, lcpWithinBudget: true });
});

test("answers the motion control within the interaction budget", async ({
  page,
}) => {
  await page.goto(LESSON);
  const control = page.getByRole("button", { name: /animation/ });
  await expect(control).toBeVisible();

  const latencies: number[] = [];
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const started = await page.evaluate(() => performance.now());
    await control.click();
    const finished = await page.evaluate(
      async () =>
        new Promise<number>((resolve) => {
          requestAnimationFrame(() => {
            resolve(performance.now());
          });
        }),
    );
    latencies.push(finished - started);
  }

  const worst = Math.max(...latencies);
  console.log(`[performance] worst control latency ${worst.toFixed(1)}ms`);

  expect(
    { worstWithinBudget: worst <= 200 },
    `worst ${worst.toFixed(1)}ms`,
  ).toEqual({ worstWithinBudget: true });
});

test("ships a lesson page small enough to stay within budget", async ({
  page,
}) => {
  let htmlBytes = 0;
  let scriptBytes = 0;
  page.on("response", async (response) => {
    const type = response.headers()["content-type"] ?? "";
    try {
      const size = (await response.body()).byteLength;
      if (type.includes("text/html")) htmlBytes += size;
      if (type.includes("javascript")) scriptBytes += size;
    } catch {
      /* Redirects and cached entries have no retrievable body. */
    }
  });

  await page.goto(LESSON, { waitUntil: "load" });

  console.log(
    `[performance] html ${(htmlBytes / 1024).toFixed(1)}kB, script ${(scriptBytes / 1024).toFixed(1)}kB`,
  );

  expect({
    htmlUnder150k: htmlBytes < 150_000,
    scriptUnder100k: scriptBytes < 100_000,
  }).toEqual({ htmlUnder150k: true, scriptUnder100k: true });
});
