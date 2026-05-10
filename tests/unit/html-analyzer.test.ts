import { describe, expect, it } from "vitest";
import { analyzeSnapshot, createSnapshot, extractAssetUrls } from "@/lib/analyzers/html";

function headers(values: Record<string, string>) {
  return new Headers(values);
}

describe("HTML analyzer", () => {
  it("extracts structured data, images, and asset summaries", () => {
    const html = `
      <html>
        <head>
          <title>Acme</title>
          <meta name="description" content="Acme website" />
          <link rel="canonical" href="https://example.com" />
          <link rel="stylesheet" href="/app.css" />
          <script src="https://cdn.example.com/tag.js"></script>
          <script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script>
        </head>
        <body>
          <h1>Acme</h1>
          <img src="/logo.png" />
          <img src="/hero.png" alt="Hero" />
        </body>
      </html>
    `;

    const snapshot = createSnapshot({
      sourceUrl: "https://example.com",
      finalUrl: "https://example.com",
      httpStatus: 200,
      html,
      headers: headers({
        "content-security-policy": "default-src 'self'",
        "strict-transport-security": "max-age=31536000",
        "referrer-policy": "strict-origin-when-cross-origin",
        "x-frame-options": "DENY",
      }),
      robotsTxt: { checked: true, exists: true, hasSitemap: true },
      sitemap: { checked: true, exists: true },
      brokenAssets: 0,
      checkedAssets: 2,
    });

    expect(snapshot.structuredDataTypes).toEqual(["Organization"]);
    expect(snapshot.imageSummary).toEqual({ total: 2, missingAlt: 1 });
    expect(snapshot.assetSummary.externalScripts).toBe(1);
    expect(extractAssetUrls(html, "https://example.com")).toEqual([
      "https://cdn.example.com/tag.js",
      "/app.css",
    ]);
  });

  it("creates findings for missing crawler and accessibility signals", () => {
    const snapshot = createSnapshot({
      sourceUrl: "https://example.com",
      finalUrl: "https://example.com",
      httpStatus: 200,
      html: "<html><body><h1>One</h1><h1>Two</h1><img src='/a.png'></body></html>",
      headers: headers({}),
      robotsTxt: { checked: true, exists: false, hasSitemap: false },
      sitemap: { checked: true, exists: false },
      brokenAssets: 1,
      checkedAssets: 1,
    });

    const result = analyzeSnapshot(snapshot);
    const ids = result.findings.map((finding) => finding.id);

    expect(ids).toContain("accessibility-image-alt-missing");
    expect(ids).toContain("technical-robots-missing");
    expect(ids).toContain("technical-sitemap-missing");
    expect(ids).toContain("technical-broken-assets");
  });
});
