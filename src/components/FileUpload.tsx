"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FolderOpen, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FileUploadModal } from "@/components/FileUploadModal";

type FileUploadProps = {
  onFilesUploaded: (files: Array<{ path: string; content: string; isFolder: boolean }>) => void;
  projectId?: string;
};

export function FileUpload({ onFilesUploaded, projectId }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Array<{ path: string; content: string; isFolder: boolean }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isPlayground, sessionToken } = useAuth();

  const processFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    const files: Array<{ path: string; content: string; isFolder: boolean }> = [];
    const filePromises: Promise<void>[] = [];

    // Process each file
    Array.from(fileList).forEach((file) => {
      const promise = new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          files.push({
            path: file.webkitRelativePath || file.name,
            content,
            isFolder: false,
          });
          resolve();
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
      filePromises.push(promise);
    });

    try {
      await Promise.all(filePromises);

      // Create folder structure
      const folderSet = new Set<string>();
      files.forEach((file) => {
        const parts = file.path.split("/");
        for (let i = 1; i < parts.length; i++) {
          const folderPath = parts.slice(0, i).join("/");
          if (!folderSet.has(folderPath)) {
            folderSet.add(folderPath);
            files.push({
              path: folderPath,
              content: "",
              isFolder: true,
            });
          }
        }
      });

      // Show modal for file preview instead of uploading directly
      setPendingFiles(files);
      setShowModal(true);
      setUploading(false);
    } catch (error) {
      console.error("Error processing files:", error);
      alert("Failed to process files. Please try again.");
      setUploading(false);
    }
  }, [onFilesUploaded, projectId, user, isPlayground, sessionToken]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Handle DataTransferItemList (directory structure)
    if (e.dataTransfer.items) {
      const items: DataTransferItem[] = Array.from(e.dataTransfer.items);
      
      // Check if we have directory support
      const hasDirectories = items.some((item) => item.webkitGetAsEntry && item.webkitGetAsEntry()?.isDirectory);
      
      if (hasDirectories) {
        // Process directory structure
        const files: Array<{ path: string; content: string; isFolder: boolean }> = [];
        const processEntries = async (entries: FileSystemEntry[], basePath: string = "") => {
          for (const entry of entries) {
            if (entry.isFile) {
              const fileEntry = entry as FileSystemFileEntry;
              await new Promise<void>((resolve, reject) => {
                fileEntry.file((file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const content = e.target?.result as string;
                    const path = basePath ? `${basePath}/${file.name}` : file.name;
                    files.push({ path, content, isFolder: false });
                    resolve();
                  };
                  reader.onerror = reject;
                  reader.readAsText(file);
                });
              });
            } else if (entry.isDirectory) {
              const dirEntry = entry as FileSystemDirectoryEntry;
              const dirPath = basePath ? `${basePath}/${dirEntry.name}` : dirEntry.name;
              files.push({ path: dirPath, content: "", isFolder: true });
              
              const reader = dirEntry.createReader();
              reader.readEntries(async (subEntries) => {
                await processEntries(Array.from(subEntries), dirPath);
              });
            }
          }
        };

        const entryPromises = items
          .filter((item) => item.webkitGetAsEntry)
          .map((item) => item.webkitGetAsEntry())
          .filter((entry): entry is FileSystemEntry => entry !== null)
          .map((entry) => processEntries([entry]));

        Promise.all(entryPromises).then(() => {
          // Create folder structure
          const folderSet = new Set<string>();
          files.forEach((file) => {
            const parts = file.path.split("/");
            for (let i = 1; i < parts.length; i++) {
              const folderPath = parts.slice(0, i).join("/");
              if (!folderSet.has(folderPath)) {
                folderSet.add(folderPath);
                files.push({
                  path: folderPath,
                  content: "",
                  isFolder: true,
                });
              }
            }
          });
          
          // Show modal for file preview
          setPendingFiles(files);
          setShowModal(true);
        });
      } else {
        // Fallback to regular file processing
        processFiles(e.dataTransfer.files);
      }
    } else {
      // Fallback to regular file processing
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles, isPlayground, projectId, user, sessionToken, onFilesUploaded]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [processFiles]);

  const handleConfirmUpload = useCallback(async (selectedFiles: Array<{ path: string; content: string; isFolder: boolean }>) => {
    setUploading(true);
    
    try {
      // If playground mode, just pass files to callback
      if (isPlayground || !projectId) {
        onFilesUploaded(selectedFiles);
        setUploading(false);
        return;
      }

      // For authenticated users, upload to server
      const formData = new FormData();
      formData.append("projectId", projectId);
      if (user?.id) {
        formData.append("userId", user.id);
      }
      formData.append("playground", String(isPlayground));

      selectedFiles.forEach((file) => {
        if (!file.isFolder) {
          const blob = new Blob([file.content], { type: "text/plain" });
          formData.append(file.path, blob, file.path.split("/").pop());
        }
      });

      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      onFilesUploaded(selectedFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [onFilesUploaded, projectId, user, isPlayground, sessionToken]);

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <FolderOpen className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? "Drop files here" : "Drag and drop a folder or files"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            {...({ webkitdirectory: '' } as any)}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Select Folder or Files"}
          </Button>
        </div>
      </div>
      
      <FileUploadModal
        open={showModal}
        onOpenChange={setShowModal}
        files={pendingFiles}
        onConfirm={handleConfirmUpload}
      />
    </>
  );
}

