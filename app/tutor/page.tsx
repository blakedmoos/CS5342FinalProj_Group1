"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, BookOpen, FileText, ExternalLink, Clock, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { TutorResponse } from "@/lib/types"
import Link from "next/link"

interface TutorData {
  topics: string[]
  sampleQuestions: string[]
}

export default function TutorPage() {
  const [question, setQuestion] = useState("")
  const [responses, setResponses] = useState<TutorResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [tutorData, setTutorData] = useState<TutorData | null>(null)

  useEffect(() => {
    // Load tutor data on component mount
    fetch("/api/tutor")
      .then((res) => res.json())
      .then((data) => setTutorData(data))
      .catch((err) => console.error("Failed to load tutor data:", err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const tutorResponse: TutorResponse = await response.json()
      setResponses((prev) => [tutorResponse, ...prev])
      setQuestion("")
    } catch (error) {
      console.error("Error getting tutor response:", error)
      // Add error response
      const errorResponse: TutorResponse = {
        answer: "I'm sorry, I encountered an error while processing your question. Please try again.",
        citations: [],
        confidence: 0,
        timestamp: new Date(),
        processingTime: 0,
      }
      setResponses((prev) => [errorResponse, ...prev])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSampleQuestion = (sampleQuestion: string) => {
    setQuestion(sampleQuestion)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">NetSec Tutor</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/quiz">
                <Button variant="outline" size="sm">
                  Quiz Bot
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Admin
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Q&A Tutor Agent</h1>
            <p className="text-muted-foreground">
              Ask questions about network security and get detailed answers with citations
            </p>
          </div>

          {/* Question Input */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Ask a Question
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., What are the main types of network attacks?"
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !question.trim()}>
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sample Questions */}
          {responses.length === 0 && tutorData && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Sample Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {tutorData.sampleQuestions.map((sampleQ, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="justify-start text-left h-auto p-3"
                      onClick={() => handleSampleQuestion(sampleQ)}
                    >
                      {sampleQ}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Topics */}
          {responses.length === 0 && tutorData && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Available Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tutorData.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Responses */}
          <div className="space-y-6">
            {responses.map((response, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Response</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {response.processingTime}ms
                      </Badge>
                      <Badge
                        variant={
                          response.confidence > 70 ? "default" : response.confidence > 40 ? "secondary" : "outline"
                        }
                      >
                        {response.confidence}% confidence
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{response.answer}</p>
                  </div>

                  {/* Confidence Indicator */}
                  {response.confidence > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Response Confidence</span>
                        <span>{response.confidence}%</span>
                      </div>
                      <Progress value={response.confidence} className="h-2" />
                    </div>
                  )}

                  {/* Citations */}
                  {response.citations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Citations
                      </h4>
                      <div className="space-y-2">
                        {response.citations.map((citation, citIndex) => (
                          <div key={citIndex} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {citation.type === "document" ? "DOC" : "WEB"}
                            </Badge>
                            <span>{citation.source}</span>
                            {citation.page && <span className="text-muted-foreground">(Page {citation.page})</span>}
                            {citation.url && (
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {Math.round(citation.relevance * 100)}% relevant
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Generated at {response.timestamp.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
