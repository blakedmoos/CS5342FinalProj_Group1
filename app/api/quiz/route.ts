import { type NextRequest, NextResponse } from "next/server";
import { queryVectorDatabase } from "@/lib/vector-database";
import { generateQuiz } from "@/lib/quiz-agent";

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case "generate":
        const { topic, count } = data;
        
        // Get real document chunks from vector database
        const { getVectorDatabaseInstance } = await import('@/lib/vector-database-instance');
        const vectorDb = await getVectorDatabaseInstance();
        
        // Get all chunks or filter by topic
        let chunks;
        const allChunks = vectorDb.getAllChunks();
        console.log(`Total chunks in database: ${allChunks.length}`);
        
        if (topic && topic !== 'all') {
          chunks = vectorDb.getChunksByTopic(topic);
          console.log(`Found ${chunks.length} chunks for topic: "${topic}"`);
          
          // Debug: show sample of first chunk
          if (chunks.length > 0) {
            console.log(`Sample chunk filename: ${chunks[0].metadata.filename}`);
            console.log(`Sample chunk topics: ${chunks[0].metadata.topics.join(', ')}`);
            console.log(`Sample chunk content preview: ${chunks[0].content.substring(0, 100)}...`);
          } else {
            console.log(`No chunks matched topic "${topic}". Falling back to all chunks.`);
            chunks = allChunks; // Fallback to all chunks if topic filter returns nothing
          }
        } else {
          chunks = allChunks;
          console.log(`Using all ${chunks.length} chunks`);
        }
        
        // Convert StoredChunk format to DocumentChunk format expected by generateQuiz
        const quizData = chunks.map(chunk => ({
          id: chunk.chunkId,
          content: chunk.content,
          startIndex: 0,
          endIndex: chunk.content.length,
          embedding: chunk.embedding,
          metadata: {
            chunkIndex: chunk.metadata.chunkIndex,
            topics: chunk.metadata.topics,
            filename: chunk.metadata.filename,
            pageNumber: chunk.metadata.pageNumber,
          },
        }));
        
        console.log(`Generating quiz with ${quizData.length} chunks, count: ${count}, topic: ${topic}`);
        
        if (quizData.length === 0) {
          return NextResponse.json({ 
            error: "No documents found. Please upload documents first.",
            questions: []
          }, { status: 404 });
        }
        
        const quiz = await generateQuiz(quizData, count || 5, topic !== 'all' ? topic : undefined);
        return NextResponse.json({ questions: quiz.questions });

      case "grade":
        const { question, userAnswer, correctAnswer, questionType } = data;
        
        if (!question || userAnswer === undefined) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        
        // For multiple-choice and true-false, do simple comparison
        if (questionType === "multiple-choice" || questionType === "true-false") {
          const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
          return NextResponse.json({
            score: isCorrect ? 100 : 0,
            isCorrect,
            feedback: isCorrect 
              ? "Correct! Well done." 
              : `Incorrect. The correct answer is: ${correctAnswer}`,
            citations: []
          });
        }
        
        // For open-ended questions, use LLM to grade
        if (questionType === "open-ended") {
          const { ollamaLLM } = await import('@/lib/llm');
          
          try {
            const gradingResult = await ollamaLLM.gradeAnswer(
              question,
              userAnswer,
              correctAnswer
            );
            
            return NextResponse.json(gradingResult);
          } catch (error) {
            console.error("Error grading with LLM:", error);
            return NextResponse.json({
              score: 50,
              feedback: "Unable to grade automatically. Please review your answer.",
              citations: []
            });
          }
        }
        
        return NextResponse.json({ error: "Invalid question type" }, { status: 400 });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in quiz API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get real stats from vector database
    const { getVectorDatabaseInstance } = await import('@/lib/vector-database-instance');
    const vectorDb = await getVectorDatabaseInstance();
    const dbStats = vectorDb.getStats();
    
    return NextResponse.json({ 
      topics: dbStats.topics,
      stats: { 
        totalQuestions: dbStats.totalChunks,
        totalTopics: dbStats.topics.length,
        totalDocuments: dbStats.totalDocuments
      }
    });
  } catch (error) {
    console.error('Error in GET /api/quiz:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
