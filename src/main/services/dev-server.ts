import { ChildProcess, spawn } from "node:child_process";
import { DevServerState } from "../../shared/types";
import { SSG_DEFINITIONS, SSGDefinition } from "../../shared/ssg";

export class DevServerService {
  private process: ChildProcess | null = null;
  private state: DevServerState = { status: "stopped" };

  async start(
    projectPath: string,
    onLog: (log: string) => void,
    ssgId?: string
  ): Promise<DevServerState> {
    if (this.process) {
      await this.stop();
    }

    const ssg = ssgId ? SSG_DEFINITIONS.find((s) => s.id === ssgId) : undefined;
    const devCommand = ssg?.devCommand;

    if (!devCommand || devCommand.length === 0) {
      // Try to detect from package.json scripts
      this.state = { status: "error", error: "No dev server command configured for this project type." };
      onLog("No dev command found. Try running your dev server manually.");
      return this.state;
    }

    const urlPattern = ssg?.urlPattern ?? /localhost:(\d+)/;

    this.state = { status: "starting" };

    return new Promise((resolve) => {
      const isWin = process.platform === "win32";
      const cmd = isWin ? "npx.cmd" : "npx";

      // For non-npm tools (Hugo, Jekyll), use the command directly
      const useNpx = ssg ? ssg.packages.length > 0 : true;
      const finalCmd = useNpx ? cmd : devCommand[0];
      const finalArgs = useNpx ? devCommand : devCommand.slice(1);

      this.process = spawn(finalCmd, finalArgs, {
        cwd: projectPath,
        shell: true,
        env: { ...process.env, FORCE_COLOR: "0" },
      });

      this.process.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        onLog(text);

        const urlMatch = text.match(urlPattern);
        if (urlMatch) {
          const port = parseInt(urlMatch[1], 10);
          this.state = {
            status: "running",
            url: `http://localhost:${port}`,
            port,
          };
          resolve(this.state);
        }
      });

      this.process.stderr?.on("data", (data: Buffer) => {
        onLog(data.toString());
      });

      this.process.on("error", (err) => {
        this.state = { status: "error", error: err.message };
        onLog(`Error: ${err.message}`);
        resolve(this.state);
      });

      this.process.on("close", (code) => {
        this.state = { status: "stopped" };
        onLog(`Server exited with code ${code}`);
        this.process = null;
      });

      setTimeout(() => {
        if (this.state.status === "starting") {
          this.state = { status: "error", error: "Server start timeout" };
          resolve(this.state);
        }
      }, 30000);
    });
  }

  async stop(): Promise<{ success: boolean }> {
    if (this.process) {
      this.process.kill("SIGTERM");
      this.process = null;
      this.state = { status: "stopped" };
    }
    return { success: true };
  }

  getState(): DevServerState {
    return this.state;
  }
}
