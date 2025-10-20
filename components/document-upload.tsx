"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { addDocument } from "@/lib/vector-database"

interface UploadedFile {
  file: File
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  error?: string
}

interface DocumentUploadProps {
  onDocumentProcessed?: (doc: any) => void;
}

export function DocumentUpload({ onDocumentProcessed }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    processFiles(selectedFiles)
  }, [])

  const processFiles = async (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => ({
      file,
      status: "uploading",
      progress: 0,
    }))

    setFiles((prev) => [...prev, ...uploadedFiles])

    // Process each file
    for (let i = 0; i < uploadedFiles.length; i++) {
      const fileIndex = files.length + i

      try {
        // Update status to processing
        setFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, status: "processing", progress: 25 } : f)))

  // Process document
  const { documentProcessorClient } = await import("@/lib/document-processor.client")
  const processedDoc = await documentProcessorClient.processDocument(uploadedFiles[i].file)
  if (onDocumentProcessed) onDocumentProcessed(processedDoc)

        setFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, progress: 50 } : f)))

        // Add to vector database
        await addDocument(processedDoc.id, processedDoc.chunks)

        setFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, progress: 75 } : f)))

        // Complete
        setFiles((prev) => prev.map((f, idx) => (idx === fileIndex ? { ...f, status: "completed", progress: 100 } : f)))
      } catch (error) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Processing failed",
                }
              : f,
          ),
        )
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-muted-foreground/25"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop network security documents here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">Supported formats: PDF, DOCX, PPTX, TXT</p>
            <input
              id="file-upload"
              name="fileUpload"
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Select Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Processing Status */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{file.file.name}</span>
                      <Badge
                        variant={
                          file.status === "completed"
                            ? "default"
                            : file.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {file.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {file.status === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
                    </div>
                  </div>

                  {file.status !== "completed" && file.status !== "error" && (
                    <Progress value={file.progress} className="h-2" />
                  )}

                  {file.error && <p className="text-sm text-red-600">{file.error}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
