import { describe, it, expect } from "vitest";

// We can't call registerLinkHandlers() directly (it depends on electron ipcMain),
// but we can test the regex patterns used for link extraction by reimplementing
// the extraction logic. Since the patterns are inline in the handler, we replicate them here.

const patterns = [
  /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,        // Markdown: [text](url) and ![alt](url)
  /<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi,            // HTML: <a href="url">
  /<img\s[^>]*src=["']([^"']+)["'][^>]*>/gi,           // HTML: <img src="url">
];

function extractLinks(content: string): { url: string; line: number }[] {
  const links: { url: string; line: number }[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    for (const regex of patterns) {
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;
      while ((match = regex.exec(lines[i])) !== null) {
        const url = match[1];
        if (url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("data:")) continue;
        links.push({ url, line: i + 1 });
      }
    }
  }

  return links;
}

describe("Link extraction patterns", () => {
  describe("markdown links", () => {
    it("extracts [text](url) links", () => {
      const links = extractLinks('[Click here](https://example.com)');
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://example.com");
      expect(links[0].line).toBe(1);
    });

    it("extracts image links ![alt](url)", () => {
      const links = extractLinks('![Logo](images/logo.png)');
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("images/logo.png");
    });

    it("extracts links with title text", () => {
      const links = extractLinks('[Link](https://example.com "Example Site")');
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://example.com");
    });

    it("extracts multiple links on the same line", () => {
      const links = extractLinks('[A](url1) and [B](url2)');
      expect(links).toHaveLength(2);
      expect(links[0].url).toBe("url1");
      expect(links[1].url).toBe("url2");
    });

    it("extracts internal relative links", () => {
      const links = extractLinks('[Guide](./docs/guide.md)');
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("./docs/guide.md");
    });

    it("extracts absolute path links", () => {
      const links = extractLinks('[Home](/index.html)');
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("/index.html");
    });
  });

  describe("HTML links", () => {
    it("extracts <a href> with double quotes", () => {
      const links = extractLinks('<a href="https://example.com">Click</a>');
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://example.com");
    });

    it("extracts <a href> with single quotes", () => {
      const links = extractLinks("<a href='https://example.com'>Click</a>");
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://example.com");
    });

    it("extracts <a> with additional attributes", () => {
      const links = extractLinks('<a class="btn" href="https://example.com" target="_blank">Link</a>');
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://example.com");
    });
  });

  describe("HTML images", () => {
    it("extracts <img src> with double quotes", () => {
      const links = extractLinks('<img src="images/photo.jpg" alt="Photo">');
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("images/photo.jpg");
    });

    it("extracts <img src> with single quotes", () => {
      const links = extractLinks("<img src='images/photo.jpg' alt='Photo'>");
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("images/photo.jpg");
    });

    it("extracts <img> with attributes before src", () => {
      const links = extractLinks('<img alt="Photo" src="images/photo.jpg" width="100">');
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("images/photo.jpg");
    });
  });

  describe("skipped URIs", () => {
    it("skips anchor-only links (#)", () => {
      const links = extractLinks('[Section](#heading)');
      expect(links).toHaveLength(0);
    });

    it("skips mailto: links", () => {
      const links = extractLinks('[Email](mailto:test@example.com)');
      expect(links).toHaveLength(0);
    });

    it("skips data: URIs", () => {
      const links = extractLinks('![img](data:image/png;base64,abc123)');
      expect(links).toHaveLength(0);
    });

    it("skips mailto in HTML links", () => {
      const links = extractLinks('<a href="mailto:test@example.com">Email</a>');
      expect(links).toHaveLength(0);
    });

    it("does not skip links with hash in the middle", () => {
      const links = extractLinks('[Page](https://example.com/page#section)');
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe("https://example.com/page#section");
    });
  });

  describe("line numbers", () => {
    it("reports correct line numbers", () => {
      const content = `First line
[Link1](url1)
Some text
[Link2](url2)`;
      const links = extractLinks(content);
      expect(links).toHaveLength(2);
      expect(links[0].line).toBe(2);
      expect(links[1].line).toBe(4);
    });
  });

  describe("mixed content", () => {
    it("extracts both markdown and HTML links from same content", () => {
      const content = `# Title

[MD Link](https://example.com)

<a href="https://other.com">HTML Link</a>

<img src="images/photo.jpg">`;
      const links = extractLinks(content);
      expect(links).toHaveLength(3);
      const urls = links.map((l) => l.url);
      expect(urls).toContain("https://example.com");
      expect(urls).toContain("https://other.com");
      expect(urls).toContain("images/photo.jpg");
    });
  });
});
