"use client"

import { useState, useEffect } from "react"
import { Brain, Clock, CheckCircle, XCircle, RotateCcw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { QuizQuestion, QuizResult } from "@/lib/types"
import Link from "next/link"

interface QuizData {
  topics: string[]
  stats: {
    total: number
    byType: Record<string, number>
    byDifficulty: Record<string, number>
    byTopic: Record<string, number>
  }
}

interface QuizSettings {
  topic?: string
  difficulty?: "easy" | "medium" | "hard"
  questionTypes: ("multiple-choice" | "true-false" | "open-ended")[]
  count: number
}

export default function QuizPage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({
    topic: "all",
    difficulty: "medium",
    questionTypes: ["multiple-choice", "true-false", "open-ended"],
    count: 5,
  })
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<QuizResult[]>([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [dbStatus, setDbStatus] = useState<{ initialized: boolean; totalChunks: number } | null>(null)

  useEffect(() => {
    // Load quiz data on component mount
    fetch("/api/quiz")
      .then((res) => res.json())
      .then((data) => setQuizData(data))
      .catch((err) => console.error("Failed to load quiz data:", err))
  }, [])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

  const handleStartQuiz = async () => {
    setIsLoading(true)
    try {
      console.log("Quiz settings being sent:", quizSettings)
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          topic: quizSettings.topic || "all",
          difficulty: quizSettings.difficulty,
          count: quizSettings.count,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Quiz generation failed:", errorData)
        throw new Error(errorData.error || "Failed to generate quiz")
      }

      const data = await response.json()
      console.log("Quiz generated successfully:", data)
      
      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions were generated. The database may be empty.")
      }
      
      setQuestions(data.questions)
      setQuizStarted(true)
      setShowSettings(false)
    } catch (error) {
      console.error("Error generating quiz:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to generate quiz: ${errorMessage}\n\nPlease make sure the database is initialized by going to the home page and clicking "Initialize Database".`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      handleSubmitQuiz()
    }
  }

  const handleSubmitQuiz = async () => {
    setIsLoading(true)
    const quizResults: QuizResult[] = []

    try {
      for (const question of questions) {
        const userAnswer = answers[question.id] || ""

        console.log("Grading question:", {
          questionId: question.id,
          questionType: question.type,
          userAnswer,
          correctAnswer: question.correctAnswer
        })

        const response = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "grade",
            question: question.question,
            userAnswer,
            correctAnswer: question.correctAnswer,
            questionType: question.type,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log("Grading result:", data)
          quizResults.push({
            questionId: question.id,
            userAnswer,
            ...data
          })
        } else {
          console.error("Grading failed for question:", question.id, await response.text())
        }
      }

      console.log("All results:", quizResults)
      setResults(quizResults)
      setShowResults(true)
    } catch (error) {
      console.error("Error grading quiz:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResults(false)
    setResults([])
    setQuizStarted(false)
    setQuestions([])
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-green-600" />
                <span className="font-semibold">NetSec Quiz Bot</span>
              </Link>
              <nav className="flex items-center gap-4">
                <Link href="/tutor">
                  <Button variant="outline" size="sm">
                    Q&A Tutor
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

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Network Security Quiz</h1>
            <p className="text-muted-foreground mb-8 text-pretty">
              Test your knowledge with our adaptive quiz system. Get instant feedback and detailed explanations with
              citations.
            </p>

            {/* Quiz Settings */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quiz Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Topic (Optional)</Label>
                    <Select
                      value={quizSettings.topic || "all"}
                      onValueChange={(value) => setQuizSettings((prev) => ({ ...prev, topic: value === "all" ? undefined : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All topics" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All topics</SelectItem>
                        <SelectItem value="Encryption">Encryption</SelectItem>
                        <SelectItem value="Authentication">Authentication</SelectItem>
                        <SelectItem value="Firewalls">Firewalls</SelectItem>
                        <SelectItem value="Malware">Malware</SelectItem>
                        <SelectItem value="Intrusion Detection">Intrusion Detection</SelectItem>
                        <SelectItem value="Network Security">Network Security</SelectItem>
                        <SelectItem value="Web Security">Web Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Difficulty Level</Label>
                    <Select
                      value={quizSettings.difficulty || "medium"}
                      onValueChange={(value) =>
                        setQuizSettings((prev) => ({ ...prev, difficulty: value as "easy" | "medium" | "hard" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Medium" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Number of Questions</Label>
                    <Select
                      value={quizSettings.count.toString()}
                      onValueChange={(value) => setQuizSettings((prev) => ({ ...prev, count: Number.parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 questions</SelectItem>
                        <SelectItem value="5">5 questions</SelectItem>
                        <SelectItem value="10">10 questions</SelectItem>
                        <SelectItem value="15">15 questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button
                size="lg"
                onClick={handleStartQuiz}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Clock className="mr-2 h-5 w-5" />
                )}
                {isLoading ? "Generating Quiz..." : "Start Quiz"}
              </Button>
              <p className="text-xs text-muted-foreground">
                All processing happens locally. Your answers are not transmitted.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showResults) {
    const correctAnswers = results.filter((r) => r.isCorrect).length
    const totalScore = results.length > 0 ? results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length : 0

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-green-600" />
                <span className="font-semibold">NetSec Quiz Bot</span>
              </Link>
              <Button onClick={resetQuiz} variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                New Quiz
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Results Summary */}
            <Card className="mb-8">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
                <div className="text-4xl font-bold text-green-600 mt-2">{Math.round(totalScore)}%</div>
                <p className="text-muted-foreground">
                  You got {correctAnswers} out of {results.length} questions correct
                </p>
              </CardHeader>
            </Card>

            {/* Detailed Results */}
            <div className="space-y-6">
              {results.map((result, index) => {
                const question = questions.find((q) => q.id === result.questionId)!
                return (
                  <Card
                    key={result.questionId}
                    className={`border-l-4 ${result.isCorrect ? "border-l-green-500" : "border-l-red-500"}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.score >= 70 ? "default" : "destructive"}>{result.score}%</Badge>
                          {result.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-medium mb-2">{question.question}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{question.topic}</Badge>
                          <Badge variant="secondary">{question.difficulty}</Badge>
                          <Badge variant="outline">{question.type}</Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Your Answer:</p>
                        <p className="font-medium">{result.userAnswer || "No answer provided"}</p>
                      </div>

                      {question.correctAnswer && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
                          <p className="font-medium text-green-600">{question.correctAnswer}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Feedback:</p>
                        <p>{result.feedback}</p>
                      </div>

                      {result.citations && result.citations.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {result.citations.map((citation, citIndex) => (
                              <Badge key={citIndex} variant="secondary" className="text-xs">
                                {citation.source}
                                {citation.page && ` (p.${citation.page})`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-green-600" />
              <span className="font-semibold">NetSec Quiz Bot</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <Progress value={progress} className="w-32" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="outline">{currentQuestion?.topic ?? "No topic"}</Badge>
                  <Badge variant="secondary">{currentQuestion?.difficulty ?? "?"}</Badge>
                  <Badge variant="outline">{currentQuestion?.type ?? "?"}</Badge>
                </div>
              </div>
              <CardTitle className="text-xl">{currentQuestion?.question ?? "No question"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestion?.type === "multiple-choice" && (
                <RadioGroup value={answers[currentQuestion?.id] || ""} onValueChange={handleAnswerChange}>
                  {currentQuestion?.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion?.type === "true-false" && (
                <RadioGroup value={answers[currentQuestion?.id] || ""} onValueChange={handleAnswerChange}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="cursor-pointer">
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="cursor-pointer">
                      False
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {currentQuestion?.type === "open-ended" && (
                <Textarea
                  value={answers[currentQuestion?.id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  className="min-h-32"
                />
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                <Button onClick={handleNext} disabled={!answers[currentQuestion?.id] || isLoading}>
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  {currentQuestionIndex === questions.length - 1 ? (isLoading ? "Grading..." : "Submit Quiz") : "Next"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
