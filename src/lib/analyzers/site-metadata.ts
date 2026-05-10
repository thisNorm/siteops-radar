import { assertSafePublicUrl } from "@/lib/security/ssrf";

async function safeFetchText(url: string, timeoutMs = 5000) {
  await assertSafePublicUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "SiteOpsRadar/0.1 (+https://siteops-radar.local)",
        accept: "text/plain,text/xml,application/xml,text/html",
      },
    });

    return {
      ok: response.ok,
      status: response.status,
      text: response.ok ? await response.text() : "",
    };
  } catch {
    return {
      ok: false,
      status: 0,
      text: "",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function inspectRobotsAndSitemap(finalUrl: string) {
  const origin = new URL(finalUrl).origin;
  const robotsUrl = `${origin}/robots.txt`;
  const sitemapUrl = `${origin}/sitemap.xml`;

  const [robots, sitemap] = await Promise.all([
    safeFetchText(robotsUrl),
    safeFetchText(sitemapUrl),
  ]);

  return {
    robotsTxt: {
      checked: true,
      exists: robots.ok,
      hasSitemap: /sitemap:/i.test(robots.text),
    },
    sitemap: {
      checked: true,
      exists: sitemap.ok || /<urlset|<sitemapindex/i.test(sitemap.text),
    },
  };
}

export async function countBrokenAssets(finalUrl: string, assetUrls: string[]) {
  const origin = new URL(finalUrl).origin;
  const uniqueAssetUrls = [...new Set(assetUrls)]
    .slice(0, 12)
    .map((assetUrl) => new URL(assetUrl, origin).toString());

  const results = await Promise.all(
    uniqueAssetUrls.map(async (assetUrl) => {
      try {
        await assertSafePublicUrl(assetUrl);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch(assetUrl, {
            method: "HEAD",
            redirect: "follow",
            signal: controller.signal,
          });
          return response.ok;
        } finally {
          clearTimeout(timeout);
        }
      } catch {
        return false;
      }
    }),
  );

  return {
    checkedAssets: uniqueAssetUrls.length,
    brokenAssets: results.filter((ok) => !ok).length,
  };
}
