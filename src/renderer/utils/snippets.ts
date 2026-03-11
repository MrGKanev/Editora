export interface Snippet {
  trigger: string; // e.g. "/callout", "/youtube", "/toc"
  label: string; // display name
  template: string; // markdown to insert (may have $1 placeholders)
}

export const builtinSnippets: Snippet[] = [
  { trigger: "/callout", label: "Callout Box", template: "> **Note:** $1\n" },
  { trigger: "/warning", label: "Warning Box", template: "> **Warning:** $1\n" },
  {
    trigger: "/youtube",
    label: "YouTube Embed",
    template:
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>\n',
  },
  {
    trigger: "/toc",
    label: "Table of Contents",
    template:
      "## Table of Contents\n\n- [Section 1](#section-1)\n- [Section 2](#section-2)\n$1",
  },
  {
    trigger: "/details",
    label: "Collapsible Section",
    template:
      "<details>\n<summary>$1Click to expand</summary>\n\nContent here.\n\n</details>\n",
  },
  {
    trigger: "/img",
    label: "Image with Caption",
    template:
      '<figure>\n  <img src="$1" alt="description" />\n  <figcaption>Caption here</figcaption>\n</figure>\n',
  },
  { trigger: "/code", label: "Code Block", template: "```$1\n\n```\n" },
  {
    trigger: "/link",
    label: "Link Card",
    template: '[$1](url "Title")\n',
  },
];
