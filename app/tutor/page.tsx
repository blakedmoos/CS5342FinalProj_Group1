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
import { sanitizeInput } from "@/lib/sanitize"

interface TutorData {
  topics: string[]
  sampleQuestions: string[]
}

// one simple chat array: user messages + tutor messages
type ChatMessage =
  | { id: string; role: "user"; text: string; timestamp: Date }
  | { id: string; role: "tutor"; text: string; response: TutorResponse }

export default function TutorPage() {
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
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
    const currentQuestion = sanitizeInput(question)
    if (!currentQuestion) return

    // 1) show the user message immediately
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: currentQuestion,
      timestamp: new Date(),
}
    setMessages((prev) => [...prev, userMsg])
    setQuestion("")

    setIsLoading(true)

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: currentQuestion }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const tutorResponse: TutorResponse = await response.json()

      // 2) add tutor reply as a separate chat message
      const tutorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "tutor",
        text: tutorResponse.answer,
        response: tutorResponse,
      }
      setMessages((prev) => [...prev, tutorMsg])
    } catch (error) {
      console.error("Error getting tutor response:", error)

      const errorResponse: TutorResponse = {
        answer:
          "I couldn't find relevant information in the knowledge base to answer your question. Please try rephrasing your question or ensure that relevant documents have been uploaded to the system.",
        citations: [],
        confidence: 0,
        timestamp: new Date(),
        processingTime: 0,
      }

      const tutorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "tutor",
        text: errorResponse.answer,
        response: errorResponse,
      }
      setMessages((prev) => [...prev, tutorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSampleQuestion = (sampleQuestion: string) => {
    setQuestion(sampleQuestion)
  }

  const hasAnyMessages = messages.length > 0

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
            <h1 className="text-3xl font-bold mb-2">Q&amp;A Tutor Agent</h1>
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
          {!hasAnyMessages && tutorData && (
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
          {!hasAnyMessages && tutorData && (
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

          {/* Chat messages */}
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              if (msg.role === "user") {
                // user bubble (right side)
                return (
                  <div key={msg.id} className="flex justify-end">
  <div className="max-w-[80%] rounded-2xl bg-blue-600 text-white px-4 py-2">
    <p className="text-[10px] uppercase tracking-wide opacity-70 mb-1">You</p>
    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

    {/* timestamp */}
    <p className="text-[10px] opacity-70 mt-1">
      {msg.timestamp.toLocaleString()}
    </p>
  </div>
</div>

                )
              }

              const r = msg.response
              // tutor bubble (left side)
              return (
                <div key={msg.id} className="flex justify-start">
                  <Card className="max-w-[80%] border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Tutor</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {r.processingTime}ms
                          </Badge>
                          <Badge
                            variant={
                              r.confidence > 70
                                ? "default"
                                : r.confidence > 40
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {r.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{r.answer}</p>
                      </div>

                      {r.confidence > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Response Confidence</span>
                            <span>{r.confidence}%</span>
                          </div>
                          <Progress value={r.confidence} className="h-2" />
                        </div>
                      )}

                      {r.citations.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Citations
                          </h4>
                          <div className="space-y-2">
                            {r.citations.map((citation, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Badge variant="outline" className="text-xs">
                                  {citation.type === "document" ? "DOC" : "WEB"}
                                </Badge>
                                <span>{citation.source}</span>
                                {citation.page && (
                                  <span className="text-muted-foreground">
                                    (Page {citation.page})
                                  </span>
                                )}
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
                                <Badge
                                  variant="secondary"
                                  className="text-xs ml-auto"
                                >
                                  {Math.round(citation.relevance * 100)}% relevant
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Generated at {r.timestamp.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
