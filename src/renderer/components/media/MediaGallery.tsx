import React, { useEffect, useState } from "react";
import { useProjectStore } from "../../store/project-store";
import { useEditorStore } from "../../store/editor-store";
import { MediaFile } from "../../../shared/types";
import { formatFileSize } from "../../utils/markdown";

export default function MediaGallery() {
  const project = useProjectStore((s) => s.currentProject);
  const { currentFile, setEditorContent, editorContent } = useEditorStore();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMedia = async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const files = await window.editora.listMedia(project.path, project.ssgId);
      setMediaFiles(files);
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [project]);

  const handleUpload = async () => {
    if (!project) return;
    // Trigger file dialog via IPC would be needed; for now we use a basic approach
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files) return;
      const paths = Array.from(input.files).map((f) => (f as File & { path: string }).path);
      await window.editora.uploadMedia(project.path, paths);
      loadMedia();
    };
    input.click();
  };

  const insertInEditor = (file: MediaFile) => {
    if (!currentFile) return;
    const mdImage = `![${file.name}](/${file.relativePath})`;
    setEditorContent(editorContent + "\n" + mdImage);
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    await window.editora.deleteMedia(file.path);
    loadMedia();
  };

  return (
    <div className="p-3 space-y-3">
      <button
        onClick={handleUpload}
        className="w-full px-3 py-2 text-sm bg-editor-accent/10 text-editor-accent
                   rounded-lg hover:bg-editor-accent/20 transition-colors"
      >
        Upload Image
      </button>

      {isLoading ? (
        <p className="text-sm text-editor-muted">Loading...</p>
      ) : mediaFiles.length === 0 ? (
        <p className="text-sm text-editor-muted">No media files found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {mediaFiles.map((file) => (
            <div
              key={file.path}
              className="group relative bg-editor-bg rounded-lg overflow-hidden border
                         hover:border-editor-accent transition-colors"
            >
              <img
                src={`local-file://${encodeURIComponent(file.path)}`}
                alt={file.name}
                className="w-full h-20 object-cover"
                loading="lazy"
              />
              <div className="p-1.5">
                <p className="text-xs truncate">{file.name}</p>
                <p className="text-xs text-editor-muted">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Actions overlay */}
              <div
                className="absolute inset-0 bg-editor-bg/80 opacity-0 group-hover:opacity-100
                            flex items-center justify-center gap-2 transition-opacity"
              >
                <button
                  onClick={() => insertInEditor(file)}
                  className="px-2 py-1 text-xs bg-editor-accent text-editor-bg rounded"
                  title="Insert in editor"
                >
                  Insert
                </button>
                <button
                  onClick={() => handleDelete(file)}
                  className="px-2 py-1 text-xs bg-editor-danger/20 text-editor-danger rounded"
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
