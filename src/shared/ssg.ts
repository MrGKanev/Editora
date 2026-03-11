// Supported static site generators and their conventions

export interface SSGDefinition {
  id: string;
  name: string;
  /** Package names to look for in package.json (any match) */
  packages: string[];
  /** Config files to look for (any match) */
  configFiles: string[];
  /** Directories where content (markdown) lives, relative to project root */
  contentDirs: string[];
  /** Dev server command */
  devCommand: string[];
  /** Regex to extract the dev server URL from stdout */
  urlPattern: RegExp;
}

export const SSG_DEFINITIONS: SSGDefinition[] = [
  {
    id: "astro",
    name: "Astro",
    packages: ["astro"],
    configFiles: ["astro.config.mjs", "astro.config.ts", "astro.config.js", "astro.config.cjs"],
    contentDirs: ["src/content", "content"],
    devCommand: ["astro", "dev"],
    urlPattern: /localhost:(\d+)/,
  },
  {
    id: "hugo",
    name: "Hugo",
    packages: [],
    configFiles: ["hugo.toml", "hugo.yaml", "hugo.json", "config.toml", "config.yaml", "config.json"],
    contentDirs: ["content"],
    devCommand: ["hugo", "server"],
    urlPattern: /localhost:(\d+)/,
  },
  {
    id: "eleventy",
    name: "Eleventy",
    packages: ["@11ty/eleventy"],
    configFiles: [".eleventy.js", "eleventy.config.js", "eleventy.config.cjs", "eleventy.config.mjs"],
    contentDirs: ["src", "content", "posts", "_posts"],
    devCommand: ["eleventy", "--serve"],
    urlPattern: /localhost:(\d+)/,
  },
  {
    id: "jekyll",
    name: "Jekyll",
    packages: [],
    configFiles: ["_config.yml", "_config.yaml"],
    contentDirs: ["_posts", "_drafts", "collections"],
    devCommand: ["jekyll", "serve"],
    urlPattern: /Server address:\s*https?:\/\/[\w.]+:(\d+)/,
  },
  {
    id: "nextjs",
    name: "Next.js",
    packages: ["next"],
    configFiles: ["next.config.js", "next.config.mjs", "next.config.ts"],
    contentDirs: ["content", "posts", "_posts", "src/content"],
    devCommand: ["next", "dev"],
    urlPattern: /localhost:(\d+)/,
  },
  {
    id: "nuxt",
    name: "Nuxt",
    packages: ["nuxt", "@nuxt/content"],
    configFiles: ["nuxt.config.ts", "nuxt.config.js"],
    contentDirs: ["content"],
    devCommand: ["nuxt", "dev"],
    urlPattern: /localhost:(\d+)/,
  },
  {
    id: "gatsby",
    name: "Gatsby",
    packages: ["gatsby"],
    configFiles: ["gatsby-config.js", "gatsby-config.ts", "gatsby-config.mjs"],
    contentDirs: ["content", "src/content", "blog"],
    devCommand: ["gatsby", "develop"],
    urlPattern: /localhost:(\d+)/,
  },
  {
    id: "vitepress",
    name: "VitePress",
    packages: ["vitepress"],
    configFiles: [".vitepress/config.js", ".vitepress/config.ts", ".vitepress/config.mts"],
    contentDirs: ["docs", "src", "."],
    devCommand: ["vitepress", "dev"],
    urlPattern: /localhost:(\d+)/,
  },
  {
    id: "gridsome",
    name: "Gridsome",
    packages: ["gridsome"],
    configFiles: ["gridsome.config.js"],
    contentDirs: ["content", "blog"],
    devCommand: ["gridsome", "develop"],
    urlPattern: /localhost:(\d+)/,
  },
  {
    id: "hexo",
    name: "Hexo",
    packages: ["hexo"],
    configFiles: ["_config.yml"],
    contentDirs: ["source/_posts", "source/_drafts"],
    devCommand: ["hexo", "server"],
    urlPattern: /localhost:(\d+)/,
  },
];

export interface DetectedSSG {
  definition: SSGDefinition;
  confidence: "high" | "medium" | "low";
}
