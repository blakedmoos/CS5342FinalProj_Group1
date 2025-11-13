import { type NextRequest, NextResponse } from "next/server"
import { tutorAgent } from "@/lib/tutor-agent"
import { sanitizeInput } from "@/lib/sanitize"

export async function POST(request: NextRequest) {
  try {
    const { question: rawQuestion, context, maxResults } = await request.json()

    if (!rawQuestion || typeof rawQuestion !== "string") {
      return NextResponse.json(
        { error: "Question is required and must be a string" },
        { status: 400 }
      )
    }

  console.log("=== Tutor API: Incoming question ===")
    console.log("RAW QUESTION:", rawQuestion)

    const question = sanitizeInput(rawQuestion)

    console.log("SANITIZED QUESTION:", question)
    console.log("TIMESTAMP:", new Date().toISOString())
    console.log("====================================")

    if (!question || question.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty question after sanitization" },
        { status: 400 }
      )
    }

    const response = await tutorAgent.answerQuestion({
      question,
      context,
      maxResults,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in tutor API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const [topics, sampleQuestions] = await Promise.all([tutorAgent.getTopics(), tutorAgent.getSampleQuestions()])

    return NextResponse.json({
      topics,
      sampleQuestions,
    })
  } catch (error) {
    console.error("Error getting tutor data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
