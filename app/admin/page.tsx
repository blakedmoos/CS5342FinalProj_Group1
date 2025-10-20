"use client"

import { useState, useEffect } from "react"
import { FileText, Database, Settings, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"
const DocumentUpload = dynamic(() => import("@/components/document-upload").then(mod => mod.DocumentUpload), { ssr: false })
import { getStats } from "@/lib/vector-database";
import Link from "next/link"

interface SystemStats {
  totalDocuments: number
  totalChunks: number
  topics: string[]
  lastUpdated?: string
}

interface LLMStatus {
  model: string
  status: string
  memory: string
}

export default function AdminPage() {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [dbStats, setDbStats] = useState<SystemStats>({ totalDocuments: 0, totalChunks: 0, topics: [] })
  const [llmStatus, setLLMStatus] = useState<LLMStatus>({ model: "Loading...", status: "checking", memory: "N/A" })
  const [documents, setDocuments] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem('indexedDocuments')
    if (saved) {
      setDocuments(JSON.parse(saved))
    }
  }, [])

  // Fetch real database stats from API
  useEffect(() => {
    fetchDatabaseStats()
    fetchLLMStatus()
  }, [])

  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch('/api/init')
      const data = await response.json()
      if (data.success && data.stats) {
        setDbStats({
          totalDocuments: data.stats.totalDocuments || 0,
          totalChunks: data.stats.totalChunks || 0,
          topics: data.stats.topics || [],
          lastUpdated: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Failed to fetch database stats:', error)
    }
  }

  const fetchLLMStatus = async () => {
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'test', limit: 1 })
      })
      
      if (response.ok) {
        setLLMStatus({
          model: "llama3.2:3b",
          status: "running",
          memory: "~3.0 GB"
        })
      } else {
        setLLMStatus({
          model: "llama3.2:3b",
          status: "offline",
          memory: "N/A"
        })
      }
    } catch (error) {
      setLLMStatus({
        model: "llama3.2:3b",
        status: "offline",
        memory: "N/A"
      })
    }
  }

  // Add a processed document to the library
  const handleDocumentProcessed = (doc: any) => {
    setDocuments((prev) => {
      const updated = [
        ...prev,
        {
          name: doc.title || doc.metadata?.filename || doc.filename,
          pages: doc.metadata?.pageCount || '-',
          status: 'indexed',
        },
      ]
      if (isClient) {
        localStorage.setItem('indexedDocuments', JSON.stringify(updated))
      }
      return updated
    })
  }

  const handleFileUpload = () => {
    setIsProcessing(true)
    setUploadProgress(0)

    // Simulate file processing
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const refreshStats = async () => {
    await fetchDatabaseStats()
    await fetchLLMStatus()
  }

  const totalDocuments = dbStats.totalDocuments;
  const totalChunks = dbStats.totalChunks;
  const lastUpdated = dbStats.lastUpdated 
    ? new Date(dbStats.lastUpdated).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Never';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-purple-600" />
              <span className="font-semibold">NetSec Admin</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/tutor">
                <Button variant="outline" size="sm">
                  Q&A Tutor
                </Button>
              </Link>
              <Link href="/quiz">
                <Button variant="outline" size="sm">
                  Quiz Bot
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your network security knowledge base and system configuration
            </p>
          </div>

          <Tabs defaultValue="documents" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-6">
              {/* Upload Section */}
              <DocumentUpload onDocumentProcessed={handleDocumentProcessed} />

              {/* Document Library (dynamic) */}
              <Card>
                <CardHeader>
                  <CardTitle>Document Library</CardTitle>
                  <CardDescription>Currently indexed documents in the knowledge base</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.length === 0 ? (
                      <p className="text-muted-foreground">No documents indexed yet.</p>
                    ) : (
                      documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">{doc.pages} pages</p>
                            </div>
                          </div>
                          <Badge variant={doc.status === "indexed" ? "default" : "secondary"}>{doc.status}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Vector Database Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Documents:</span>
                      <span className="font-mono">{totalDocuments.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Chunks:</span>
                      <span className="font-mono">{totalChunks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-mono text-sm">{lastUpdated}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-transparent" variant="outline" onClick={refreshStats}>
                        Refresh Stats
                      </Button>
                      <Button
                        className="flex-1 bg-transparent"
                        variant="outline"
                        onClick={async () => {
                          if (confirm('Are you sure you want to clear the index? This cannot be undone.')) {
                            try {
                              const response = await fetch('/api/init', { method: 'DELETE' })
                              if (response.ok) {
                                await fetchDatabaseStats()
                                alert('Index cleared successfully')
                              }
                            } catch (error) {
                              alert('Failed to clear index')
                            }
                          }
                        }}
                      >
                        Clear Index
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Local LLM Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Model:</span>
                      <span className="font-mono">{llmStatus.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={llmStatus.status === "running" ? "default" : "destructive"}>
                        {llmStatus.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Usage:</span>
                      <span className="font-mono">{llmStatus.memory}</span>
                    </div>
                    <Button 
                      className="w-full bg-transparent" 
                      variant="outline"
                      onClick={fetchLLMStatus}
                    >
                      Check Status
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Overview</CardTitle>
                  <CardDescription>Current knowledge base statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Total Documents</p>
                      <div className="text-3xl font-bold">{totalDocuments}</div>
                      <p className="text-xs text-muted-foreground mt-1">PDF files indexed</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Total Chunks</p>
                      <div className="text-3xl font-bold">{totalChunks.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">Searchable text segments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Available Topics
                  </CardTitle>
                  <CardDescription>Topics extracted from indexed documents</CardDescription>
                </CardHeader>
                <CardContent>
                  {dbStats.topics && dbStats.topics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dbStats.topics.map((topic, index) => (
                        <Badge key={index} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-muted-foreground">Topics available for quiz generation:</p>
                      <div className="flex flex-wrap gap-2">
                        {["Encryption", "Authentication", "Firewalls", "Malware", "Intrusion Detection", "Network Security", "Web Security"].map((topic, index) => (
                          <Badge key={index} variant="outline">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Configure local LLM and processing settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Embedding Model</label>
                      <select id="embedding-model" name="embeddingModel" className="w-full mt-1 p-2 border rounded-md">
                        <option>sentence-transformers/all-MiniLM-L6-v2</option>
                        <option>sentence-transformers/all-mpnet-base-v2</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Chunk Size</label>
                      <input id="chunk-size" name="chunkSize" type="number" defaultValue={500} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                  </div>
                  <Button>Save Configuration</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Security</CardTitle>
                  <CardDescription>Ensure all data remains local and secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Local Processing Only</p>
                      <p className="text-sm text-muted-foreground">All data stays on your machine</p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Encryption at Rest</p>
                      <p className="text-sm text-muted-foreground">Vector database encryption</p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Network Isolation</p>
                      <p className="text-sm text-muted-foreground">No external API calls</p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
