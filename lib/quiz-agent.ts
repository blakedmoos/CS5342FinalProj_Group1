import type { DocumentChunk } from './document-processor';
import type { QuizQuestion, Citation } from './types';
import { ollamaLLM } from './llm';

export interface Quiz {
  topic?: string;
  questions: QuizQuestion[];
}

/**
 * Generate a quiz with random or topic-specific questions from document chunks.
 * @param chunks Array of document chunks to use as source material
 * @param numQuestions Number of questions to generate
 * @param topic Optional topic to focus questions
 */

// Helper to pick random elements
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// Helper to generate a multiple-choice question from a chunk using LLM
async function generateMultipleChoice(chunk: DocumentChunk, idx: number, difficulty: "easy" | "medium" | "hard"): Promise<QuizQuestion> {
  try {
    const llmResponse = await ollamaLLM.generateQuizQuestion(
      chunk.content, 
      'multiple-choice',
      { temperature: 0.8, maxTokens: 300, difficulty }
    );
    
    // Parse the LLM response - handle extra preamble text and multiline
    const cleanResponse = llmResponse.replace(/[\r\n]+/g, '\n');
    const questionMatch = cleanResponse.match(/Question:\s*([^\n]+)/);
    let question = questionMatch ? questionMatch[1].trim() : "Generated question";
    
    // Remove any leaked answer information from the question
    question = question.replace(/\s*Correct Answer:.*$/i, '').trim();
    question = question.replace(/\s*\([A-D]\)$/i, '').trim();
    
    const optionA = cleanResponse.match(/A\)\s*([^\n]+)/);
    const optionB = cleanResponse.match(/B\)\s*([^\n]+)/);
    const optionC = cleanResponse.match(/C\)\s*([^\n]+)/);
    const optionD = cleanResponse.match(/D\)\s*([^\n]+)/);
    const options = [
      optionA ? optionA[1].trim() : "Option A",
      optionB ? optionB[1].trim() : "Option B",
      optionC ? optionC[1].trim() : "Option C",
      optionD ? optionD[1].trim() : "Option D"
    ];
    
    const answerMatch = cleanResponse.match(/Correct Answer:\s*([A-D])/i);
    const correctLetter = answerMatch ? answerMatch[1].toUpperCase() : 'A';
    const correctIndex = correctLetter.charCodeAt(0) - 'A'.charCodeAt(0);
    const correctAnswer = options[correctIndex] || options[0];
    
    return {
      id: `mcq-${chunk.id}-${idx}`,
      type: "multiple-choice",
      question,
      options: options.length === 4 ? options : ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer,
      topic: chunk.metadata.topics?.[0] || "General",
      difficulty,
      citations: [{
        source: chunk.metadata.filename || "Unknown",
        page: chunk.metadata.pageNumber,
        type: "document",
        relevance: 1.0
      }],
    };
  } catch (error) {
    console.error('Error generating multiple choice question:', error);
    // Fallback to simple generation
    const sentences = chunk.content.split(/(?<=[.!?])\s+/);
    const question = sentences[0] || chunk.content;
    const correctAnswer = sentences[1] || "(See document)";
    const options = [correctAnswer, "Option A", "Option B", "Option C"];
    return {
      id: `mcq-${chunk.id}-${idx}`,
      type: "multiple-choice",
      question,
      options: options.sort(() => 0.5 - Math.random()),
      correctAnswer,
      topic: chunk.metadata.topics?.[0] || "General",
      difficulty,
      citations: [{
        source: chunk.metadata.filename || "Unknown",
        page: chunk.metadata.pageNumber,
        type: "document",
        relevance: 1.0
      }],
    };
  }
}

// Helper to generate a true/false question from a chunk using LLM
async function generateTrueFalse(chunk: DocumentChunk, idx: number, difficulty: "easy" | "medium" | "hard"): Promise<QuizQuestion> {
  try {
    const llmResponse = await ollamaLLM.generateQuizQuestion(
      chunk.content, 
      'true-false',
      { temperature: 0.8, maxTokens: 200, difficulty }
    );
    
    // Parse the LLM response
    const cleanResponse = llmResponse.replace(/[\r\n]+/g, '\n');
    const questionMatch = cleanResponse.match(/Question:\s*([^\n]+(?:\n(?!Correct Answer:)[^\n]+)*)/);
    let question = questionMatch ? questionMatch[1].trim().replace(/\n+/g, ' ') : "Generated true/false question";
    
    // Remove any "Correct Answer:" text that leaked into the question
    question = question.replace(/\s*Correct Answer:.*$/i, '').trim();
    
    const answerMatch = cleanResponse.match(/Correct Answer:\s*(True|False)/i);
    const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : "TRUE";
    
    return {
      id: `tf-${chunk.id}-${idx}`,
      type: "true-false",
      question,
      correctAnswer,
      topic: chunk.metadata.topics?.[0] || "General",
      difficulty,
      citations: [{
        source: chunk.metadata.filename || "Unknown",
        page: chunk.metadata.pageNumber,
        type: "document",
        relevance: 1.0
      }],
    };
  } catch (error) {
    console.error('Error generating true/false question:', error);
    // Fallback to simple generation
    const statement = chunk.content.split(/(?<=[.!?])\s+/)[0] || chunk.content;
    const isTrue = Math.random() > 0.5;
    return {
      id: `tf-${chunk.id}-${idx}`,
      type: "true-false",
      question: `True or False: ${statement}`,
      correctAnswer: isTrue ? "True" : "False",
      topic: chunk.metadata.topics?.[0] || "General",
      difficulty,
      citations: [{
        source: chunk.metadata.filename || "Unknown",
        page: chunk.metadata.pageNumber,
        type: "document",
        relevance: 1.0
      }],
    };
  }
}

// Helper to generate an open-ended question from a chunk using LLM
async function generateOpenEnded(chunk: DocumentChunk, idx: number, difficulty: "easy" | "medium" | "hard"): Promise<QuizQuestion> {
  try {
    const llmResponse = await ollamaLLM.generateQuizQuestion(
      chunk.content, 
      'open-ended',
      { temperature: 0.8, maxTokens: 300, difficulty }
    );
    
    // Parse the LLM response
    const cleanResponse = llmResponse.replace(/[\r\n]+/g, '\n');
    const questionMatch = cleanResponse.match(/Question:\s*([^\n]+(?:\n(?!Expected Answer:)[^\n]+)*)/);
    let question = questionMatch ? questionMatch[1].trim().replace(/\n+/g, ' ') : "Generated open-ended question";
    
    // Remove any leaked answer information from the question
    question = question.replace(/\s*Expected Answer:.*$/i, '').trim();
    question = question.replace(/\s*Correct Answer:.*$/i, '').trim();
    
    const answerMatch = cleanResponse.match(/Expected Answer:\s*(.+)$/);
    const correctAnswer = answerMatch ? answerMatch[1].trim() : "(See document)";
    
    return {
      id: `oe-${chunk.id}-${idx}`,
      type: "open-ended",
      question,
      correctAnswer,
      topic: chunk.metadata.topics?.[0] || "General",
      difficulty,
      citations: [{
        source: chunk.metadata.filename || "Unknown",
        page: chunk.metadata.pageNumber,
        type: "document",
        relevance: 1.0
      }],
    };
  } catch (error) {
    console.error('Error generating open-ended question:', error);
    // Fallback to simple generation
    const question = `Explain: ${chunk.content.split(/(?<=[.!?])\s+/)[0] || chunk.content}`;
    return {
      id: `oe-${chunk.id}-${idx}`,
      type: "open-ended",
      question,
      correctAnswer: "(See document)",
      topic: chunk.metadata.topics?.[0] || "General",
      difficulty,
      citations: [{
        source: chunk.metadata.filename || "Unknown",
        page: chunk.metadata.pageNumber,
        type: "document",
        relevance: 1.0
      }],
    };
  }
}

export async function generateQuiz(
  chunks: DocumentChunk[],
  numQuestions: number = 5,
  topic?: string,
  difficulty?: "easy" | "medium" | "hard"
): Promise<Quiz> {
  console.log("=== QUIZ GENERATION START ===");
  console.log("Chunks received:", chunks.length);
  console.log("Requested questions:", numQuestions);
  console.log("Topic:", topic);

  // Filter by topic if provided
  let filtered = topic
    ? chunks.filter((c) => c.metadata.topics && c.metadata.topics.includes(topic))
    : chunks;
  if (filtered.length === 0) filtered = chunks;

  console.log("Filtered chunks:", filtered.length);

  // Pick random chunks for questions
  const selectedChunks = pickRandom(filtered, Math.min(numQuestions, filtered.length));
  console.log("Selected chunks for questions:", selectedChunks.length);
  
  const questionPromises: Promise<QuizQuestion>[] = [];
  for (let i = 0; i < selectedChunks.length; i++) {
    const chunk = selectedChunks[i];
    // Cycle through types for variety
    if (i % 3 === 0) {
      console.log(`Generating MC question ${i + 1}/${selectedChunks.length}`);
      questionPromises.push(generateMultipleChoice(chunk, i,difficulty ?? "medium"));
    } else if (i % 3 === 1) {
      console.log(`Generating T/F question ${i + 1}/${selectedChunks.length}`);
      questionPromises.push(generateTrueFalse(chunk, i,difficulty ?? "medium"));
    } else {
      console.log(`Generating open-ended question ${i + 1}/${selectedChunks.length}`);
      questionPromises.push(generateOpenEnded(chunk, i,difficulty ?? "medium"));
    }
  }
  
  console.log("Waiting for all questions to generate...");
  // Await all questions to be generated
  const questions = await Promise.all(questionPromises);
  console.log("=== QUIZ GENERATION COMPLETE ===");
  console.log("Questions generated:", questions.length);
  
  return {
    topic,
    questions,
  };
}

// Additional helper functions for question generation will be added here.
