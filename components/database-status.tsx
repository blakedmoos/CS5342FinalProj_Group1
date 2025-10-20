"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"

export function DatabaseStatus() {
  const [status, setStatus] = useState<"loading" | "empty" | "initialized" | "error">("loading")
  const [stats, setStats] = useState<{ totalDocuments: number; totalChunks: number; topics: string[] } | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    try {
      setStatus("loading")
      const response = await fetch("/api/init")
      const data = await response.json()
      
      if (data.success && data.initialized) {
        setStatus("initialized")
        setStats(data.stats)
      } else {
        setStatus("empty")
      }
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Failed to check status")
    }
  }

  const initializeDatabase = async () => {
    try {
      setIsInitializing(true)
      setError(null)
      
      const response = await fetch("/api/init", { method: "POST" })
      const data = await response.json()
      
      if (data.success) {
        setStatus("initialized")
        setStats(data.stats)
      } else {
        setError(data.message || "Initialization failed")
        setStatus("error")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Initialization failed")
      setStatus("error")
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  if (status === "loading") {
    return (
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Checking Database Status...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (status === "initialized" && stats) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            Database Ready
          </CardTitle>
          <CardDescription>
            {stats.totalDocuments} documents loaded with {stats.totalChunks} knowledge chunks
          </CardDescription>
        </CardHeader>
        {stats.topics && stats.topics.length > 0 && (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                >
                  {topic}
                </span>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  if (status === "empty" || status === "error") {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
            {status === "error" ? "Database Error" : "Database Not Initialized"}
          </CardTitle>
          <CardDescription>
            {error || "The knowledge base needs to be loaded before you can use the tutor and quiz features."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={initializeDatabase}
            disabled={isInitializing}
            className="w-full"
          >
            {isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing... (This may take 2-3 minutes)
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Initialize Database
              </>
            )}
          </Button>
          {isInitializing && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Processing 12 PDF files and generating embeddings...
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}
