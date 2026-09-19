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

// Primary language subtags to keep locale files for. Everything else is
// stripped from the packaged Electron binary at build time (see afterExtract
// below): the app's own UI is English-only regardless, and Chromium falls
// back to en-US for any missing locale, so this only affects the language of
// native bits (Cut/Copy/Paste in context menus, the print dialog, etc).
// Add a subtag here if you want another language kept.
const KEEP_LOCALE_LANGS = new Set(["en", "bg"]);

function localeLang(fileName: string): string {
  return fileName
    .replace(/\.(lproj|pak)$/i, "")
    .replace(/_/g, "-")
    .split("-")[0]
    .toLowerCase();
}

function stripLocales(dir: string, extension: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    if (!entry.toLowerCase().endsWith(extension)) continue;
    if (KEEP_LOCALE_LANGS.has(localeLang(entry))) continue;
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
  }
}

const config: ForgeConfig = {
  packagerConfig: {
    name: "Editora",
    executableName: "editora",
    asar: {
      unpack: "{node_modules/@img/**,**/*.dylib}",
    },
    icon: "./assets/icons/icon",
    prune: true,
    // No `ignore` here on purpose. Setting one overrides the Vite plugin's
    // automatic filter, which ships only the built `.vite` output — the hand
    // written list above it used to let the entire dev dependency tree
    // (eslint, vitest, rolldown, forge itself) into app.asar.
    // The native modules the main bundle still needs at runtime are copied
    // back in by the afterPrune hook below.
    // Runs once per platform/arch on the freshly-extracted Electron binary,
    // before it's renamed/signed — the earliest safe place to delete files.
    afterExtract: [
      (buildPath, _electronVersion, platform, _arch, callback) => {
        try {
          if (platform === "darwin") {
            const appDir = fs.readdirSync(buildPath).find((f) => f.endsWith(".app"));
            if (appDir) {
              stripLocales(
                path.join(
                  buildPath, appDir, "Contents", "Frameworks",
                  "Electron Framework.framework", "Versions", "A", "Resources"
                ),
                ".lproj"
              );
            }
          } else {
            // Windows and Linux builds keep locale .pak files in a flat
            // "locales" folder at the root of the extracted binary.
            stripLocales(path.join(buildPath, "locales"), ".pak");
          }
          callback();
        } catch (err) {
          callback(err as Error);
        }
      },
    ],
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
          config: "vite.main.config.mts",
          target: "main",
        },
        {
          entry: "src/preload/index.ts",
          config: "vite.preload.config.mts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mts",
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
