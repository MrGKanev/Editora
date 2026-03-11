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
    const stat = await fs.stat(filePath);
    const originalSize = stat.size;
    const meta = await sharp(filePath).metadata();
    const originalWidth = meta.width || 0;
    const originalHeight = meta.height || 0;

    let pipeline = sharp(filePath);

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

    outputPath = path.join(destDir, baseName + outputExt);

    // Avoid overwriting — add suffix if needed
    let counter = 1;
    while (true) {
      try {
        await fs.access(outputPath);
        outputPath = path.join(destDir, `${baseName}-${counter}${outputExt}`);
        counter++;
      } catch {
        break;
      }
    }

    await fs.mkdir(destDir, { recursive: true });
    const outputBuffer = await pipeline.toBuffer();
    await fs.writeFile(outputPath, outputBuffer);

    const outputMeta = await sharp(outputPath).metadata();

    return {
      originalPath: filePath,
      outputPath,
      originalSize,
      outputSize: outputBuffer.length,
      width: outputMeta.width || 0,
      height: outputMeta.height || 0,
      format: outputExt.slice(1),
    };
  }
}
