import fs from "node:fs/promises";
import path from "node:path";
import Store from "electron-store";
import simpleGit from "simple-git";
import { Project } from "../../shared/types";

const store = new Store<{ recentProjects: Project[] }>({
  defaults: { recentProjects: [] },
});

export class ProjectManager {
  async validateAstroProject(projectPath: string): Promise<boolean> {
    const configNames = [
      "astro.config.mjs",
      "astro.config.ts",
      "astro.config.js",
      "astro.config.cjs",
    ];

    for (const name of configNames) {
      try {
        await fs.access(path.join(projectPath, name));
        return true;
      } catch {
        // Continue checking
      }
    }
    return false;
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

    const project: Project = {
      path: projectPath,
      name,
      lastOpened: Date.now(),
      isGitRepo,
      gitRemote,
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
