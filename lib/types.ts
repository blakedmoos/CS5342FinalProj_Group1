export interface Document {
  id: string
  title: string
  filename: string
  content: string
  uploadDate: Date
  status: "processing" | "indexed" | "error"
  metadata: {
    fileType: string
    pageCount?: number
    wordCount: number
    topics: string[]
  }
}

export interface Citation {
  source: string
  page?: number
  url?: string
  type: "document" | "web"
  relevance: number
}

export interface QuizQuestion {
  id: string
  type: "multiple-choice" | "true-false" | "open-ended"
  question: string
  options?: string[]
  correctAnswer?: string
  topic: string
  difficulty: "easy" | "medium" | "hard"
  citations: Citation[]
}

export interface QuizResult {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  feedback: string
  citations: Citation[]
  score: number
}

export interface TutorResponse {
  answer: string
  citations: Citation[]
  confidence: number
  timestamp: Date
  processingTime: number
}
