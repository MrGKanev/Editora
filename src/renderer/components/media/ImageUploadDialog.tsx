import React, { useState, useEffect } from "react";
import { formatFileSize } from "../../utils/markdown";

interface ImageInfo {
  path: string;
  name: string;
  size: number;
  canOptimize: boolean;
  width: number;
  height: number;
  format: string;
}

interface OptimizeOptions {
  maxWidth: number;
  quality: number;
  convertToWebP: boolean;
}

interface UploadResult {
  name: string;
  relativePath: string;
  originalSize: number;
  outputSize: number;
}

interface ImageUploadDialogProps {
  isOpen: boolean;
  filePaths: string[];
  projectPath: string;
  onComplete: (results: UploadResult[]) => void;
  onCancel: () => void;
}

const STORAGE_KEY = "editora:image-optimize-settings";

function loadSavedSettings(): OptimizeOptions | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function saveSettings(options: OptimizeOptions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
}

function clearSavedSettings() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function ImageUploadDialog({
  isOpen,
  filePaths,
  projectPath,
  onComplete,
  onCancel,
}: ImageUploadDialogProps) {
  const savedSettings = loadSavedSettings();

  const [imageInfos, setImageInfos] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[] | null>(null);

  // Optimization settings
  const [optimize, setOptimize] = useState(true);
  const [maxWidth, setMaxWidth] = useState(savedSettings?.maxWidth ?? 1920);
  const [quality, setQuality] = useState(savedSettings?.quality ?? 80);
  const [convertToWebP, setConvertToWebP] = useState(savedSettings?.convertToWebP ?? true);
  const [remember, setRemember] = useState(!!savedSettings);

  // Fetch image info on open
  useEffect(() => {
    if (!isOpen || filePaths.length === 0) return;
    setLoading(true);
    setResults(null);

    window.editora.getImageInfo(filePaths).then((res: ImageInfo[] | { error: string }) => {
      if ("error" in res) {
        console.error(res.error);
        setImageInfos([]);
      } else {
        setImageInfos(res);
      }
      setLoading(false);
    });
  }, [isOpen, filePaths]);

  const optimizableCount = imageInfos.filter((i) => i.canOptimize).length;
  const needsResize = imageInfos.filter((i) => i.canOptimize && i.width > maxWidth);

  const handleUpload = async () => {
    setUploading(true);

    const options: OptimizeOptions | null = optimize
      ? { maxWidth, quality, convertToWebP }
      : null;

    if (remember && options) {
      saveSettings(options);
    } else if (!remember) {
      clearSavedSettings();
    }

    try {
      const res = await window.editora.optimizeUpload(projectPath, filePaths, options);
      if (res && "error" in res) {
        console.error(res.error);
        setUploading(false);
        return;
      }
      setResults(res.uploaded);
      onComplete(res.uploaded);
    } catch (err) {
      console.error("Upload failed:", err);
    }

    setUploading(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onCancel} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-editor-surface border rounded-lg shadow-2xl w-[500px] max-w-[90vw] max-h-[80vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-medium">
              Upload {filePaths.length} image{filePaths.length !== 1 ? "s" : ""}
            </h2>
            <button
              onClick={onCancel}
              className="text-editor-muted hover:text-editor-text text-lg leading-none px-1"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* File list */}
            {loading ? (
              <p className="text-sm text-editor-muted">Reading image info...</p>
            ) : (
              <div className="space-y-1">
                {imageInfos.map((img) => (
                  <div
                    key={img.path}
                    className="flex items-center justify-between text-xs p-2 bg-editor-bg rounded"
                  >
                    <div className="min-w-0">
                      <p className="text-editor-text truncate">{img.name}</p>
                      <p className="text-editor-muted">
                        {img.width}x{img.height} &middot; {img.format.toUpperCase()} &middot; {formatFileSize(img.size)}
                        {!img.canOptimize && (
                          <span className="ml-1 text-editor-warning">(skip optimization)</span>
                        )}
                      </p>
                    </div>
                    {img.canOptimize && img.width > maxWidth && optimize && (
                      <span className="text-[10px] text-editor-accent flex-shrink-0 ml-2">
                        &rarr; {maxWidth}px
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Optimize toggle */}
            {optimizableCount > 0 && !loading && (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={optimize}
                    onChange={(e) => setOptimize(e.target.checked)}
                    className="rounded border-editor-border bg-editor-bg"
                  />
                  <span className="text-editor-text">Optimize images</span>
                </label>

                {optimize && (
                  <div className="space-y-3 pl-6">
                    {/* Max width */}
                    <div className="space-y-1">
                      <label className="flex items-center justify-between text-xs text-editor-muted">
                        <span>Max width</span>
                        <span className="text-editor-text">{maxWidth}px</span>
                      </label>
                      <input
                        type="range"
                        min={320}
                        max={3840}
                        step={160}
                        value={maxWidth}
                        onChange={(e) => setMaxWidth(Number(e.target.value))}
                        className="w-full accent-[#89b4fa]"
                      />
                      <div className="flex justify-between text-[10px] text-editor-muted">
                        <span>320</span>
                        <span>1920</span>
                        <span>3840</span>
                      </div>
                      {needsResize.length > 0 && (
                        <p className="text-[11px] text-editor-accent">
                          {needsResize.length} image{needsResize.length !== 1 ? "s" : ""} will be resized
                        </p>
                      )}
                    </div>

                    {/* Quality */}
                    <div className="space-y-1">
                      <label className="flex items-center justify-between text-xs text-editor-muted">
                        <span>Quality</span>
                        <span className="text-editor-text">{quality}%</span>
                      </label>
                      <input
                        type="range"
                        min={30}
                        max={100}
                        step={5}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-[#89b4fa]"
                      />
                      <div className="flex justify-between text-[10px] text-editor-muted">
                        <span>30 (small)</span>
                        <span>80 (good)</span>
                        <span>100 (best)</span>
                      </div>
                    </div>

                    {/* WebP conversion */}
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={convertToWebP}
                        onChange={(e) => setConvertToWebP(e.target.checked)}
                        className="rounded border-editor-border bg-editor-bg"
                      />
                      <span className="text-editor-text">Convert to WebP</span>
                      <span className="text-editor-muted">(best size/quality for web)</span>
                    </label>

                    {/* Remember */}
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="rounded border-editor-border bg-editor-bg"
                      />
                      <span className="text-editor-text">Remember these settings</span>
                    </label>
                  </div>
                )}
              </>
            )}

            {/* Results */}
            {results && (
              <div className="space-y-1">
                <p className="text-xs text-editor-success font-medium">Uploaded successfully</p>
                {results.map((r) => (
                  <div key={r.name} className="text-xs text-editor-muted p-2 bg-editor-bg rounded">
                    {r.name}
                    {r.originalSize !== r.outputSize && (
                      <span className="ml-1 text-editor-success">
                        ({formatFileSize(r.originalSize)} &rarr; {formatFileSize(r.outputSize)},
                        {" "}{Math.round((1 - r.outputSize / r.originalSize) * 100)}% smaller)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-editor-muted hover:text-editor-text rounded transition-colors"
            >
              {results ? "Done" : "Cancel"}
            </button>
            {!results && (
              <button
                onClick={handleUpload}
                disabled={uploading || loading}
                className="px-3 py-1.5 text-xs bg-editor-accent text-editor-bg rounded
                           hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {uploading ? "Uploading..." : optimize ? "Optimize & Upload" : "Upload"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
