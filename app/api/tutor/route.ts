import { type NextRequest, NextResponse } from "next/server"
import { tutorAgent } from "@/lib/tutor-agent"

export async function POST(request: NextRequest) {
  try {
    const { question, context, maxResults } = await request.json()

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required and must be a string" }, { status: 400 })
    }

    const response = await tutorAgent.answerQuestion({
      question,
      context,
      maxResults,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in tutor API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
