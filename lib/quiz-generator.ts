import type { QuizQuestion, Citation } from "./types"

export interface QuizGenerationOptions {
  topic?: string
  difficulty?: "easy" | "medium" | "hard"
  questionTypes?: ("multiple-choice" | "true-false" | "open-ended")[]
  count?: number
}

export interface QuizSession {
  id: string
  questions: QuizQuestion[]
  startTime: Date
  endTime?: Date
  score?: number
  results?: QuizResult[]
}

export interface QuizResult {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  feedback: string
  citations: Citation[]
  score: number
  timeSpent: number
}

export class QuizGenerator {
  private questionBank: QuizQuestion[] = []

  constructor() {
    this.initializeQuestionBank()
  }

  private initializeQuestionBank() {
    // Pre-populate with network security questions
    this.questionBank = [
      {
        id: "mc_001",
        type: "multiple-choice",
        question: "Which of the following is NOT a common type of network attack?",
        options: ["DDoS Attack", "Man-in-the-Middle Attack", "SQL Injection", "Memory Optimization"],
        correctAnswer: "Memory Optimization",
        topic: "Network Attacks",
        difficulty: "easy",
        citations: [{ source: "Network Security Fundamentals.pdf", page: 45, type: "document", relevance: 0.9 }],
      },
      {
        id: "tf_001",
        type: "true-false",
        question: "A firewall can only filter traffic based on IP addresses.",
        correctAnswer: "false",
        topic: "Firewalls",
        difficulty: "medium",
        citations: [{ source: "CS5342 Lecture Slides - Week 4", page: 8, type: "document", relevance: 0.85 }],
      },
      {
        id: "oe_001",
        type: "open-ended",
        question:
          "Explain the concept of defense in depth and provide three examples of how it can be implemented in network security.",
        topic: "Security Architecture",
        difficulty: "hard",
        citations: [
          { source: "Network Security Fundamentals.pdf", page: 123, type: "document", relevance: 0.95 },
          {
            source: "NIST Cybersecurity Framework",
            url: "https://nist.gov/cybersecurity",
            type: "web",
            relevance: 0.8,
          },
        ],
      },
      {
        id: "mc_002",
        type: "multiple-choice",
        question: "What is the primary purpose of encryption in network security?",
        options: [
          "To compress data",
          "To ensure data confidentiality",
          "To speed up transmission",
          "To reduce bandwidth usage",
        ],
        correctAnswer: "To ensure data confidentiality",
        topic: "Cryptography",
        difficulty: "easy",
        citations: [{ source: "Cryptography Textbook Chapter 5.pdf", page: 12, type: "document", relevance: 0.92 }],
      },
      {
        id: "tf_002",
        type: "true-false",
        question: "Symmetric encryption uses the same key for both encryption and decryption.",
        correctAnswer: "true",
        topic: "Cryptography",
        difficulty: "easy",
        citations: [{ source: "CS5342 Lecture Slides - Week 6", page: 15, type: "document", relevance: 0.88 }],
      },
      {
        id: "mc_003",
        type: "multiple-choice",
        question: "Which layer of the OSI model do most firewalls operate at?",
        options: ["Physical Layer", "Data Link Layer", "Network Layer", "Application Layer"],
        correctAnswer: "Network Layer",
        topic: "Firewalls",
        difficulty: "medium",
        citations: [{ source: "Network Protocols Quiz Bank.docx", page: 5, type: "document", relevance: 0.87 }],
      },
      {
        id: "oe_002",
        type: "open-ended",
        question:
          "Describe the differences between intrusion detection systems (IDS) and intrusion prevention systems (IPS). Include their advantages and disadvantages.",
        topic: "Intrusion Detection",
        difficulty: "hard",
        citations: [{ source: "Network Security Fundamentals.pdf", page: 178, type: "document", relevance: 0.93 }],
      },
      {
        id: "tf_003",
        type: "true-false",
        question: "A VPN always provides complete anonymity on the internet.",
        correctAnswer: "false",
        topic: "Network Protocols",
        difficulty: "medium",
        citations: [{ source: "CS5342 Lecture Slides - Week 8", page: 22, type: "document", relevance: 0.82 }],
      },
    ]
  }

  async generateQuiz(options: QuizGenerationOptions = {}): Promise<QuizQuestion[]> {
    const { topic, difficulty, questionTypes = ["multiple-choice", "true-false", "open-ended"], count = 5 } = options

    let filteredQuestions = [...this.questionBank]

    // Filter by topic
    if (topic) {
      filteredQuestions = filteredQuestions.filter((q) => q.topic.toLowerCase().includes(topic.toLowerCase()))
    }

    // Filter by difficulty
    if (difficulty) {
      filteredQuestions = filteredQuestions.filter((q) => q.difficulty === difficulty)
    }

    // Filter by question types
    filteredQuestions = filteredQuestions.filter((q) => questionTypes.includes(q.type))

    // If we don't have enough questions, generate more
    if (filteredQuestions.length < count) {
      const additionalQuestions = await this.generateAdditionalQuestions(count - filteredQuestions.length, {
        topic,
        difficulty,
        questionTypes,
      })
      filteredQuestions.push(...additionalQuestions)
    }

    // Shuffle and select the requested number of questions
    const shuffled = this.shuffleArray(filteredQuestions)
    return shuffled.slice(0, count)
  }

  private async generateAdditionalQuestions(count: number, options: QuizGenerationOptions): Promise<QuizQuestion[]> {
    // In a real implementation, this would use the local LLM to generate questions
    // based on the document content. For now, we'll create some additional mock questions.

    const additionalQuestions: QuizQuestion[] = []
    const topics = ["Network Attacks", "Cryptography", "Firewalls", "Authentication"]
    const difficulties: ("easy" | "medium" | "hard")[] = ["easy", "medium", "hard"]

    for (let i = 0; i < count; i++) {
      const questionType = options.questionTypes?.[i % options.questionTypes.length] || "multiple-choice"
      const topic = options.topic || topics[i % topics.length]
      const difficulty = options.difficulty || difficulties[i % difficulties.length]

      if (questionType === "multiple-choice") {
        additionalQuestions.push({
          id: `generated_mc_${Date.now()}_${i}`,
          type: "multiple-choice",
          question: `What is a key characteristic of ${topic.toLowerCase()}?`,
          options: [
            "Option A - Correct answer",
            "Option B - Incorrect",
            "Option C - Incorrect",
            "Option D - Incorrect",
          ],
          correctAnswer: "Option A - Correct answer",
          topic,
          difficulty,
          citations: [{ source: "Generated from knowledge base", type: "document", relevance: 0.75 }],
        })
      } else if (questionType === "true-false") {
        additionalQuestions.push({
          id: `generated_tf_${Date.now()}_${i}`,
          type: "true-false",
          question: `${topic} is an important aspect of network security.`,
          correctAnswer: "true",
          topic,
          difficulty,
          citations: [{ source: "Generated from knowledge base", type: "document", relevance: 0.75 }],
        })
      } else {
        additionalQuestions.push({
          id: `generated_oe_${Date.now()}_${i}`,
          type: "open-ended",
          question: `Explain the importance of ${topic.toLowerCase()} in network security and provide examples.`,
          topic,
          difficulty,
          citations: [{ source: "Generated from knowledge base", type: "document", relevance: 0.75 }],
        })
      }
    }

    return additionalQuestions
  }

  async gradeAnswer(question: QuizQuestion, userAnswer: string): Promise<QuizResult> {
    const startTime = Date.now()

    let isCorrect = false
    let feedback = ""
    let score = 0

    if (question.type === "multiple-choice" || question.type === "true-false") {
      isCorrect = userAnswer.toLowerCase() === question.correctAnswer?.toLowerCase()
      score = isCorrect ? 100 : 0

      if (isCorrect) {
        feedback = "Correct! Well done."
      } else {
        feedback = `Incorrect. The correct answer is: ${question.correctAnswer}`
      }
    } else if (question.type === "open-ended") {
      // For open-ended questions, we simulate LLM-based grading
      score = await this.gradeOpenEndedAnswer(question, userAnswer)
      isCorrect = score >= 70 // Consider 70% or above as correct

      if (score >= 90) {
        feedback = "Excellent answer! You demonstrated a comprehensive understanding of the topic."
      } else if (score >= 70) {
        feedback = "Good answer! You covered the main points well. Consider adding more specific examples or details."
      } else if (score >= 50) {
        feedback =
          "Partial answer. You touched on some key points but missed important aspects. Review the cited materials for more complete information."
      } else {
        feedback =
          "Incomplete answer. Please review the topic more thoroughly and try to address all aspects of the question."
      }
    }

    return {
      questionId: question.id,
      userAnswer,
      isCorrect,
      feedback,
      citations: question.citations,
      score,
      timeSpent: Date.now() - startTime,
    }
  }

  private async gradeOpenEndedAnswer(question: QuizQuestion, userAnswer: string): Promise<number> {
    // Simulate LLM-based grading
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simple keyword-based scoring for demonstration
    const keywords = this.extractKeywords(question.topic)
    const answerLower = userAnswer.toLowerCase()

    let score = 0
    let keywordMatches = 0

    for (const keyword of keywords) {
      if (answerLower.includes(keyword.toLowerCase())) {
        keywordMatches++
      }
    }

    // Base score on keyword coverage
    score = Math.min((keywordMatches / keywords.length) * 100, 100)

    // Adjust based on answer length (longer answers generally better for open-ended)
    const lengthBonus = Math.min(userAnswer.length / 200, 1) * 20
    score = Math.min(score + lengthBonus, 100)

    return Math.round(score)
  }

  private extractKeywords(topic: string): string[] {
    const keywordMap: Record<string, string[]> = {
      "Network Attacks": ["attack", "malware", "phishing", "ddos", "intrusion", "vulnerability"],
      Cryptography: ["encryption", "decryption", "key", "cipher", "hash", "algorithm"],
      Firewalls: ["firewall", "filter", "packet", "rule", "port", "protocol"],
      "Security Architecture": ["defense", "depth", "layer", "security", "control", "policy"],
      Authentication: ["authentication", "authorization", "identity", "credential", "access"],
      "Intrusion Detection": ["ids", "ips", "detection", "prevention", "monitoring", "alert"],
    }

    return keywordMap[topic] || ["security", "network", "protection"]
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  getAvailableTopics(): string[] {
    const topics = new Set(this.questionBank.map((q) => q.topic))
    return Array.from(topics).sort()
  }

  getQuestionStats() {
    const stats = {
      total: this.questionBank.length,
      byType: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      byTopic: {} as Record<string, number>,
    }

    this.questionBank.forEach((q) => {
      stats.byType[q.type] = (stats.byType[q.type] || 0) + 1
      stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1
      stats.byTopic[q.topic] = (stats.byTopic[q.topic] || 0) + 1
    })

    return stats
  }
}

export const quizGenerator = new QuizGenerator()
