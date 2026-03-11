// ===== Project =====

export interface Project {
  path: string;
  name: string;
  lastOpened: number;
  isGitRepo: boolean;
  gitRemote?: string;
  ssgId?: string;
  ssgName?: string;
}

// ===== Collections =====

export interface ContentCollection {
  name: string;
  path: string;
  files: ContentFile[];
  schema?: CollectionSchema;
}

export interface ContentFile {
  name: string;
  path: string;
  relativePath: string;
  frontmatter: Record<string, unknown>;
  body: string;
  lastModified: number;
}

export interface CollectionSchema {
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "array" | "enum";
  required: boolean;
  default?: unknown;
  options?: string[]; // for enum type
}

// ===== Media =====

export interface MediaFile {
  name: string;
  path: string;
  relativePath: string;
  size: number;
  type: string;
  lastModified: number;
}

// ===== Git =====

export interface GitStatus {
  isRepo: boolean;
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  staged: string[];
  untracked: string[];
}

export interface GitCommitResult {
  hash: string;
  message: string;
}

// ===== Dev Server =====

export type DevServerStatus = "stopped" | "starting" | "running" | "error";

export interface DevServerState {
  status: DevServerStatus;
  url?: string;
  port?: number;
  error?: string;
}

// ===== IPC Channels =====

export const IPC = {
  // Project
  PROJECT_OPEN: "project:open",
  PROJECT_CLONE: "project:clone",
  PROJECT_GET_RECENT: "project:get-recent",
  PROJECT_VALIDATE: "project:validate",

  // Collections
  COLLECTION_LIST: "collection:list",
  COLLECTION_GET_FILES: "collection:get-files",

  // Content
  CONTENT_READ: "content:read",
  CONTENT_WRITE: "content:write",
  CONTENT_CREATE: "content:create",
  CONTENT_DELETE: "content:delete",
  CONTENT_RENAME: "content:rename",
  CONTENT_DUPLICATE: "content:duplicate",

  // Media
  MEDIA_LIST: "media:list",
  MEDIA_UPLOAD: "media:upload",
  MEDIA_DELETE: "media:delete",
  MEDIA_GET_PATH: "media:get-path",
  MEDIA_IMAGE_INFO: "media:image-info",
  MEDIA_OPTIMIZE_UPLOAD: "media:optimize-upload",

  // Git
  GIT_STATUS: "git:status",
  GIT_COMMIT: "git:commit",
  GIT_PUSH: "git:push",
  GIT_PULL: "git:pull",
  GIT_BRANCHES: "git:branches",
  GIT_CHECKOUT: "git:checkout",
  GIT_REMOTE_URL: "git:remote-url",

  // Export
  EXPORT_HTML: "export:html",
  EXPORT_PDF: "export:pdf",

  // Links
  LINKS_CHECK: "links:check",

  // Dev Server
  SERVER_START: "server:start",
  SERVER_STOP: "server:stop",
  SERVER_STATUS: "server:status",
  SERVER_LOG: "server:log",
} as const;
