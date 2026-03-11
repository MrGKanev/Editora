import { ipcMain, net } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { IPC } from "../../shared/types";

export interface LinkCheckResult {
  url: string;
  type: "internal" | "external";
  status: "ok" | "broken" | "error";
  statusCode?: number;
  error?: string;
  line?: number;
}

async function checkInternalLink(
  url: string,
  filePath: string,
  projectPath: string
): Promise<LinkCheckResult> {
  // Resolve relative to the file's directory or project root
  let resolved: string;
  if (url.startsWith("/")) {
    resolved = path.join(projectPath, url);
  } else {
    resolved = path.join(path.dirname(filePath), url);
  }

  // Strip hash fragments
  resolved = resolved.split("#")[0];
  if (!resolved) return { url, type: "internal", status: "ok" };

  try {
    await fs.access(resolved);
    return { url, type: "internal", status: "ok" };
  } catch {
    // Try common extensions
    for (const ext of [".md", ".mdx", "/index.md", "/index.mdx"]) {
      try {
        await fs.access(resolved + ext);
        return { url, type: "internal", status: "ok" };
      } catch {
        // continue
      }
    }
    return { url, type: "internal", status: "broken", error: "File not found" };
  }
}

async function checkExternalLink(url: string): Promise<LinkCheckResult> {
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
      const { content, filePath, projectPath } = req;

      // Extract links from both markdown and HTML syntax
      const patterns = [
        /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,        // Markdown: [text](url) and ![alt](url)
        /<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi,            // HTML: <a href="url">
        /<img\s[^>]*src=["']([^"']+)["'][^>]*>/gi,           // HTML: <img src="url">
      ];
      const links: { url: string; line: number }[] = [];
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        for (const regex of patterns) {
          let match: RegExpExecArray | null;
          regex.lastIndex = 0;
          while ((match = regex.exec(lines[i])) !== null) {
            const url = match[1];
            // Skip anchors-only, mailto, and data URIs
            if (url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("data:")) continue;
            links.push({ url, line: i + 1 });
          }
        }
      }

      // Deduplicate by URL but keep first line number
      const seen = new Map<string, number>();
      const unique: { url: string; line: number }[] = [];
      for (const link of links) {
        if (!seen.has(link.url)) {
          seen.set(link.url, link.line);
          unique.push(link);
        }
      }

      // Check all links (external in parallel with concurrency limit)
      const results: LinkCheckResult[] = [];
      const external: { url: string; line: number }[] = [];

      for (const link of unique) {
        if (link.url.startsWith("http://") || link.url.startsWith("https://")) {
          external.push(link);
        } else {
          const result = await checkInternalLink(link.url, filePath, projectPath);
          result.line = link.line;
          results.push(result);
        }
      }

      // Check external links with concurrency of 5
      const chunks: { url: string; line: number }[][] = [];
      for (let i = 0; i < external.length; i += 5) {
        chunks.push(external.slice(i, i + 5));
      }

      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(async (link) => {
            const result = await checkExternalLink(link.url);
            result.line = link.line;
            return result;
          })
        );
        results.push(...chunkResults);
      }

      return results;
    }
  );
}
