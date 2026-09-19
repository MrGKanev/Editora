import { ipcMain, net } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { IPC } from "../../shared/types";

export interface LinkCheckResult {
  url: string;
  type: "internal" | "external";
  kind: "link" | "image";
  status: "ok" | "broken" | "error";
  statusCode?: number;
  error?: string;
  line?: number;
}

// Content directories where SSGs typically store pages
const CONTENT_ROOTS = [
  "", // project root (e.g. pages in /public or root-level routes)
  "src/content",
  "src/pages",
  "content",
  "pages",
  "_posts",
  "posts",
  "blog",
  "docs",
  "source/_posts",
  "public",
];

const EXTENSIONS = [".md", ".mdx", ".astro", ".html", ".tsx", ".jsx"];

// Max simultaneous outbound HEAD requests when validating external links
const EXTERNAL_CONCURRENCY = 5;

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function checkInternalLink(
  url: string,
  filePath: string,
  projectPath: string
): Promise<Omit<LinkCheckResult, "kind">> {
  // Strip hash fragments and query strings
  const cleanUrl = url.split("#")[0].split("?")[0];
  if (!cleanUrl) return { url, type: "internal", status: "ok" };

  // Remove leading slash for path joining
  const slug = cleanUrl.replace(/^\//, "");

  // Strategy 1: Direct resolve (relative to file or project root)
  const directPaths = url.startsWith("/")
    ? [path.join(projectPath, cleanUrl)]
    : [path.join(path.dirname(filePath), cleanUrl)];

  for (const resolved of directPaths) {
    if (await fileExists(resolved)) return { url, type: "internal", status: "ok" };
    for (const ext of EXTENSIONS) {
      if (await fileExists(resolved + ext)) return { url, type: "internal", status: "ok" };
    }
    // Try as directory with index file
    for (const ext of EXTENSIONS) {
      if (await fileExists(path.join(resolved, `index${ext}`)))
        return { url, type: "internal", status: "ok" };
    }
  }

  // Strategy 2: Search content roots for matching slug
  // e.g. /glossary/multi-accounting → src/content/glossary/multi-accounting.md
  for (const root of CONTENT_ROOTS) {
    const base = path.join(projectPath, root, slug);
    if (await fileExists(base)) return { url, type: "internal", status: "ok" };
    for (const ext of EXTENSIONS) {
      if (await fileExists(base + ext)) return { url, type: "internal", status: "ok" };
    }
    for (const ext of EXTENSIONS) {
      if (await fileExists(path.join(base, `index${ext}`)))
        return { url, type: "internal", status: "ok" };
    }
  }

  // Strategy 3: Search for just the last segment (filename) anywhere in content
  // e.g. /glossary/multi-accounting → find multi-accounting.md in any collection
  const lastSegment = slug.split("/").pop();
  if (lastSegment) {
    for (const root of CONTENT_ROOTS) {
      const rootDir = path.join(projectPath, root);
      if (!(await fileExists(rootDir))) continue;
      // Check one level of subdirectories
      try {
        const entries = await fs.readdir(rootDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          for (const ext of EXTENSIONS) {
            if (await fileExists(path.join(rootDir, entry.name, lastSegment + ext)))
              return { url, type: "internal", status: "ok" };
          }
        }
      } catch {
        // skip
      }
    }
  }

  return { url, type: "internal", status: "broken", error: "File not found" };
}

async function checkInternalImage(
  url: string,
  filePath: string,
  projectPath: string
): Promise<Omit<LinkCheckResult, "kind">> {
  // Strip query strings
  const cleanUrl = url.split("?")[0].split("#")[0];
  if (!cleanUrl) return { url, type: "internal", status: "ok" };

  // Direct resolve (relative to file or project root)
  const candidates = url.startsWith("/")
    ? [path.join(projectPath, cleanUrl)]
    : [path.join(path.dirname(filePath), cleanUrl)];

  for (const resolved of candidates) {
    if (await fileExists(resolved)) return { url, type: "internal", status: "ok" };
  }

  // Also check public / static / assets directories
  const assetRoots = ["public", "static", "assets", "src/assets", "images", "img"];
  const slug = cleanUrl.replace(/^\//, "");
  for (const root of assetRoots) {
    const resolved = path.join(projectPath, root, slug);
    if (await fileExists(resolved)) return { url, type: "internal", status: "ok" };
  }

  // Check content roots too (some SSGs put images alongside content)
  for (const root of CONTENT_ROOTS) {
    const resolved = path.join(projectPath, root, slug);
    if (await fileExists(resolved)) return { url, type: "internal", status: "ok" };
  }

  return { url, type: "internal", status: "broken", error: "Image file not found" };
}

async function checkExternalLink(url: string): Promise<Omit<LinkCheckResult, "kind">> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ url, type: "external", status: "error", error: "Timeout (10s)" });
    }, 10000);

    try {
      const request = net.request({ url, method: "HEAD" });

      request.on("response", (response) => {
        clearTimeout(timeout);
        const code = response.statusCode;
        if (code >= 200 && code < 400) {
          resolve({ url, type: "external", status: "ok", statusCode: code });
        } else {
          resolve({ url, type: "external", status: "broken", statusCode: code });
        }
      });

      request.on("error", (err) => {
        clearTimeout(timeout);
        resolve({ url, type: "external", status: "error", error: err.message });
      });

      request.end();
    } catch (err) {
      clearTimeout(timeout);
      resolve({
        url,
        type: "external",
        status: "error",
        error: (err as Error).message,
      });
    }
  });
}

interface CheckLinksRequest {
  content: string;
  filePath: string;
  projectPath: string;
}

export function registerLinkHandlers() {
  ipcMain.handle(
    IPC.LINKS_CHECK,
    async (_event, req: CheckLinksRequest): Promise<LinkCheckResult[]> => {
      try {
      const { content, filePath, projectPath } = req;

      if (!content || typeof content !== "string") return [];

      // Extract links from both markdown and HTML syntax.
      // Match against full content (not line-by-line) because HTML tags
      // can span multiple lines, e.g. <a\n  href="...">.
      // Each pattern now also tracks what kind it is: link or image
      const patterns: { regex: RegExp; kind: "link" | "image" | "auto" }[] = [
        { regex: /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, kind: "auto" },          // Markdown: [text](url) and ![alt](url)
        { regex: /<a\s[^>]*?href=["']([^"']+)["'][^>]*?>/gis, kind: "link" },          // HTML: <a href="url">
        { regex: /<img\s[^>]*?src=["']([^"']+)["'][^>]*?>/gis, kind: "image" },        // HTML: <img src="url">
      ];
      const links: { url: string; line: number; kind: "link" | "image" }[] = [];

      // Build a line-offset lookup to map character offset → line number
      const lineOffsets: number[] = [0];
      for (let i = 0; i < content.length; i++) {
        if (content[i] === "\n") lineOffsets.push(i + 1);
      }
      const offsetToLine = (offset: number): number => {
        let lo = 0, hi = lineOffsets.length - 1;
        while (lo < hi) {
          const mid = (lo + hi + 1) >> 1;
          if (lineOffsets[mid] <= offset) lo = mid;
          else hi = mid - 1;
        }
        return lo + 1; // 1-based
      };

      for (const { regex, kind } of patterns) {
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;
        while ((match = regex.exec(content)) !== null) {
          const url = match[1];
          if (url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("data:")) continue;
          // For "auto" kind (markdown syntax), determine by checking if it starts with "!"
          const resolvedKind: "link" | "image" = kind === "auto"
            ? (match[0].startsWith("!") ? "image" : "link")
            : kind;
          links.push({ url, line: offsetToLine(match.index), kind: resolvedKind });
        }
      }

      // Deduplicate by URL, keeping the first line number and kind
      const seen = new Set<string>();
      const unique = links.filter((link) => {
        if (seen.has(link.url)) return false;
        seen.add(link.url);
        return true;
      });

      const isExternal = (url: string) =>
        url.startsWith("http://") || url.startsWith("https://");
      const external = unique.filter((l) => isExternal(l.url));
      const internal = unique.filter((l) => !isExternal(l.url));

      // Internal checks are fs.access probes — run them all at once.
      const internalResults = await Promise.all(
        internal.map(async (link) => {
          const result = link.kind === "image"
            ? await checkInternalImage(link.url, filePath, projectPath)
            : await checkInternalLink(link.url, filePath, projectPath);
          return { ...result, kind: link.kind, line: link.line } as LinkCheckResult;
        })
      );

      // External checks hit the network, so cap them at 5 in flight.
      const externalResults: LinkCheckResult[] = [];
      for (let i = 0; i < external.length; i += EXTERNAL_CONCURRENCY) {
        const chunk = external.slice(i, i + EXTERNAL_CONCURRENCY);
        externalResults.push(
          ...(await Promise.all(
            chunk.map(async (link) => {
              const result = await checkExternalLink(link.url);
              return { ...result, kind: link.kind, line: link.line } as LinkCheckResult;
            })
          ))
        );
      }

      return [...internalResults, ...externalResults];
      } catch (err) {
        console.error("Link check error:", err);
        return [];
      }
    }
  );
}
