import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import fs from "node:fs";
import path from "node:path";

const config: ForgeConfig = {
  packagerConfig: {
    name: "Editora",
    executableName: "editora",
    asar: {
      unpack: "{node_modules/@img/**,**/*.dylib}",
    },
    icon: "./assets/icons/icon",
    prune: true,
    afterPrune: [
      (buildPath, _electronVersion, _platform, _arch, callback) => {
        try {
          const dirs = [
            "sharp", "@img", "detect-libc", "semver",
            "electron-squirrel-startup", "debug", "ms",
            "ajv", "ajv-formats",
          ];
          for (const dir of dirs) {
            const src = path.join(__dirname, "node_modules", dir);
            const dest = path.join(buildPath, "node_modules", dir);
            if (fs.existsSync(src)) {
              fs.cpSync(src, dest, { recursive: true });
            }
          }
          callback();
        } catch (err) {
          callback(err as Error);
        }
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ["darwin"]),
    new MakerDMG({}),
    new MakerDeb({
      options: {
        maintainer: "Editora",
        homepage: "https://github.com/MrGKanev/Editora",
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main/index.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload/index.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    new AutoUnpackNativesPlugin({}),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
    }),
  ],
};

export default config;
