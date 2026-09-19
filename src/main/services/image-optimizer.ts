import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";

export interface OptimizeOptions {
  maxWidth: number;
  quality: number;
  convertToWebP: boolean;
}

export interface OptimizeResult {
  originalPath: string;
  outputPath: string;
  originalSize: number;
  outputSize: number;
  width: number;
  height: number;
  format: string;
}

const OPTIMIZABLE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".tiff"]);

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export class ImageOptimizer {
  async getImageInfo(filePath: string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    const stat = await fs.stat(filePath);
    const meta = await sharp(filePath).metadata();
    return {
      width: meta.width || 0,
      height: meta.height || 0,
      format: meta.format || path.extname(filePath).slice(1),
      size: stat.size,
    };
  }

  canOptimize(filePath: string): boolean {
    return OPTIMIZABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
  }

  async optimize(
    filePath: string,
    destDir: string,
    options: OptimizeOptions
  ): Promise<OptimizeResult> {
    // One decode handle for both the metadata read and the transform
    const image = sharp(filePath);
    const [stat, meta] = await Promise.all([fs.stat(filePath), image.metadata()]);
    const originalSize = stat.size;
    const originalWidth = meta.width || 0;

    let pipeline = image;

    // Resize if wider than maxWidth
    if (originalWidth > options.maxWidth) {
      pipeline = pipeline.resize(options.maxWidth, null, {
        withoutEnlargement: true,
        fit: "inside",
      });
    }

    // Determine output format and filename
    const baseName = path.basename(filePath, path.extname(filePath));
    let outputExt: string;
    let outputPath: string;

    if (options.convertToWebP) {
      pipeline = pipeline.webp({ quality: options.quality });
      outputExt = ".webp";
    } else {
      const ext = path.extname(filePath).toLowerCase();
      outputExt = ext;
      switch (ext) {
        case ".png":
          pipeline = pipeline.png({ quality: options.quality });
          break;
        case ".jpg":
        case ".jpeg":
          pipeline = pipeline.jpeg({ quality: options.quality });
          break;
        case ".webp":
          pipeline = pipeline.webp({ quality: options.quality });
          break;
        case ".avif":
          pipeline = pipeline.avif({ quality: options.quality });
          break;
        default:
          pipeline = pipeline.webp({ quality: options.quality });
          outputExt = ".webp";
      }
    }

    // Create the directory before probing it for name collisions
    await fs.mkdir(destDir, { recursive: true });

    outputPath = path.join(destDir, baseName + outputExt);

    // Avoid overwriting — add suffix if needed
    let counter = 1;
    while (await exists(outputPath)) {
      outputPath = path.join(destDir, `${baseName}-${counter}${outputExt}`);
      counter++;
    }

    // resolveWithObject gives us the output dimensions from the encode we just
    // ran, instead of re-reading and re-decoding the file we wrote.
    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    await fs.writeFile(outputPath, data);

    return {
      originalPath: filePath,
      outputPath,
      originalSize,
      outputSize: info.size,
      width: info.width,
      height: info.height,
      format: outputExt.slice(1),
    };
  }
}
