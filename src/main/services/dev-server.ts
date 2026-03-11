import { ChildProcess, spawn } from "node:child_process";
import { DevServerState, DevServerStatus } from "../../shared/types";

export class DevServerService {
  private process: ChildProcess | null = null;
  private state: DevServerState = { status: "stopped" };

  async start(
    projectPath: string,
    onLog: (log: string) => void
  ): Promise<DevServerState> {
    if (this.process) {
      await this.stop();
    }

    this.state = { status: "starting" };

    return new Promise((resolve) => {
      // Use npx to run astro dev
      const isWin = process.platform === "win32";
      const cmd = isWin ? "npx.cmd" : "npx";

      this.process = spawn(cmd, ["astro", "dev"], {
        cwd: projectPath,
        shell: true,
        env: { ...process.env, FORCE_COLOR: "0" },
      });

      this.process.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        onLog(text);

        // Detect when server is ready
        const urlMatch = text.match(/localhost:(\d+)/);
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

      // Timeout: if server doesn't start in 30s, resolve with current state
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
