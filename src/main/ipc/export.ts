import { ipcMain, dialog, BrowserWindow } from "electron";
import fs from "node:fs/promises";
import matter from "gray-matter";
import { IPC } from "../../shared/types";

/**
 * Simple markdown-to-HTML converter using regex replacements.
 * Handles headings, bold, italic, code, links, images, lists, blockquotes,
 * horizontal rules, and paragraphs.
 */
function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML entities (but preserve markdown syntax)
  // We'll do this selectively to avoid breaking markdown
  html = html.replace(/&/g, "&amp;");

  // Code blocks (fenced) — must be done before other transforms
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trimEnd()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, (_match, code) => {
    return `<code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`;
  });

  // Images (before links)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr />");
  html = html.replace(/^\*\*\*$/gm, "<hr />");

  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>");

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>\n$1</ul>\n");

  // Paragraphs: wrap remaining plain text lines
  const lines = html.split("\n");
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed === "" ||
      trimmed.startsWith("<h") ||
      trimmed.startsWith("<p") ||
      trimmed.startsWith("<ul") ||
      trimmed.startsWith("</ul") ||
      trimmed.startsWith("<ol") ||
      trimmed.startsWith("</ol") ||
      trimmed.startsWith("<li") ||
      trimmed.startsWith("<pre") ||
      trimmed.startsWith("</pre") ||
      trimmed.startsWith("<blockquote") ||
      trimmed.startsWith("<hr") ||
      trimmed.startsWith("<img")
    ) {
      result.push(line);
    } else {
      result.push(`<p>${line}</p>`);
    }
  }

  return result.join("\n");
}

function wrapInHtmlTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.7;
      color: #1a1a2e;
      background: #ffffff;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; color: #16213e; }
    h1 { font-size: 2em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.2em; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    pre { background: #f1f5f9; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    code { background: #f1f5f9; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #3b82f6; margin: 1em 0; padding: 0.5em 1em; color: #475569; background: #f8fafc; }
    img { max-width: 100%; height: auto; border-radius: 6px; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 2em 0; }
    ul, ol { padding-left: 1.5em; }
    li { margin: 0.3em 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e2e8f0; padding: 0.5em 1em; text-align: left; }
    th { background: #f1f5f9; }
    del { color: #94a3b8; }
    mark { background: #fef08a; padding: 0.1em 0.2em; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

export function registerExportHandlers() {
  ipcMain.handle(
    IPC.EXPORT_HTML,
    async (_event, filePath: string) => {
      try {
        const raw = await fs.readFile(filePath, "utf-8");
        const { content } = matter(raw);
        const bodyHtml = markdownToHtml(content.trim());
        const title = filePath.split("/").pop()?.replace(/\.\w+$/, "") || "Export";
        const fullHtml = wrapInHtmlTemplate(title, bodyHtml);

        const { canceled, filePath: savePath } = await dialog.showSaveDialog({
          title: "Export as HTML",
          defaultPath: filePath.replace(/\.\w+$/, ".html"),
          filters: [{ name: "HTML", extensions: ["html"] }],
        });

        if (canceled || !savePath) return { canceled: true };

        await fs.writeFile(savePath, fullHtml, "utf-8");
        return { success: true, path: savePath };
      } catch (err) {
        return { error: `Failed to export HTML: ${(err as Error).message}` };
      }
    }
  );

  ipcMain.handle(
    IPC.EXPORT_PDF,
    async (_event, filePath: string) => {
      try {
        const raw = await fs.readFile(filePath, "utf-8");
        const { content } = matter(raw);
        const bodyHtml = markdownToHtml(content.trim());
        const title = filePath.split("/").pop()?.replace(/\.\w+$/, "") || "Export";
        const fullHtml = wrapInHtmlTemplate(title, bodyHtml);

        const { canceled, filePath: savePath } = await dialog.showSaveDialog({
          title: "Export as PDF",
          defaultPath: filePath.replace(/\.\w+$/, ".pdf"),
          filters: [{ name: "PDF", extensions: ["pdf"] }],
        });

        if (canceled || !savePath) return { canceled: true };

        // Create a hidden BrowserWindow to render the HTML and print to PDF
        const win = new BrowserWindow({
          show: false,
          width: 800,
          height: 600,
          webPreferences: {
            offscreen: true,
          },
        });

        await win.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`
        );

        const pdfData = await win.webContents.printToPDF({
          printBackground: true,
          margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
        });

        win.close();

        await fs.writeFile(savePath, pdfData);
        return { success: true, path: savePath };
      } catch (err) {
        return { error: `Failed to export PDF: ${(err as Error).message}` };
      }
    }
  );
}
