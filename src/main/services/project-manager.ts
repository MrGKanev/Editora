import fs from "node:fs/promises";
import path from "node:path";
import Store from "electron-store";
import simpleGit from "simple-git";
import { Project } from "../../shared/types";
import { SSG_DEFINITIONS, DetectedSSG, SSGDefinition } from "../../shared/ssg";

const store = new Store<{ recentProjects: Project[] }>({
  defaults: { recentProjects: [] },
});

export class ProjectManager {
  async detectSSG(projectPath: string): Promise<DetectedSSG | null> {
    // 1. Check package.json dependencies
    let deps: Record<string, string> = {};
    try {
      const pkgPath = path.join(projectPath, "package.json");
      const pkgRaw = await fs.readFile(pkgPath, "utf-8");
      const pkg = JSON.parse(pkgRaw);
      deps = { ...pkg.dependencies, ...pkg.devDependencies };
    } catch {
      // No package.json
    }

    for (const ssg of SSG_DEFINITIONS) {
      if (ssg.packages.length > 0 && ssg.packages.some((pkg) => deps[pkg])) {
        return { definition: ssg, confidence: "high" };
      }
    }

    // 2. Check config files
    for (const ssg of SSG_DEFINITIONS) {
      for (const configFile of ssg.configFiles) {
        try {
          await fs.access(path.join(projectPath, configFile));
          return { definition: ssg, confidence: "medium" };
        } catch {
          // Continue
        }
      }
    }

    // 3. Check for content directories with markdown files (generic fallback)
    const commonContentDirs = ["content", "src/content", "_posts", "posts", "blog", "docs"];
    for (const dir of commonContentDirs) {
      try {
        const fullPath = path.join(projectPath, dir);
        await fs.access(fullPath);
        const entries = await fs.readdir(fullPath);
        const hasMarkdown = entries.some((e) => e.endsWith(".md") || e.endsWith(".mdx"));
        if (hasMarkdown) {
          return {
            definition: {
              id: "generic",
              name: "Static Site",
              packages: [],
              configFiles: [],
              contentDirs: [dir],
              devCommand: [],
              urlPattern: /localhost:(\d+)/,
            },
            confidence: "low",
          };
        }
      } catch {
        // Continue
      }
    }

    return null;
  }

  async validateProject(projectPath: string): Promise<boolean> {
    const detected = await this.detectSSG(projectPath);
    return detected !== null;
  }

  async openProject(projectPath: string): Promise<Project> {
    const name = path.basename(projectPath);
    const isGitRepo = await this.checkGitRepo(projectPath);
    let gitRemote: string | undefined;

    if (isGitRepo) {
      try {
        const git = simpleGit(projectPath);
        const remotes = await git.getRemotes(true);
        gitRemote = remotes.find((r) => r.name === "origin")?.refs.fetch;
      } catch {
        // Not critical
      }
    }

    const detected = await this.detectSSG(projectPath);

    const project: Project = {
      path: projectPath,
      name,
      lastOpened: Date.now(),
      isGitRepo,
      gitRemote,
      ssgId: detected?.definition.id,
      ssgName: detected?.definition.name,
    };

    this.addToRecent(project);
    return project;
  }

  async cloneProject(url: string, dest: string): Promise<Project> {
    const git = simpleGit();
    await git.clone(url, dest);
    return this.openProject(dest);
  }

  getRecentProjects(): Project[] {
    return store.get("recentProjects", []);
  }

  getSSGDefinition(ssgId: string): SSGDefinition | undefined {
    if (ssgId === "generic") return undefined;
    return SSG_DEFINITIONS.find((s) => s.id === ssgId);
  }

  private addToRecent(project: Project) {
    const recent = store.get("recentProjects", []);
    const filtered = recent.filter((p) => p.path !== project.path);
    filtered.unshift(project);
    store.set("recentProjects", filtered.slice(0, 10));
  }

  private async checkGitRepo(projectPath: string): Promise<boolean> {
    try {
      await fs.access(path.join(projectPath, ".git"));
      return true;
    } catch {
      return false;
    }
  }
}
