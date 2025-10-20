import { queryVectorDatabase } from './vector-database';
import type { Citation, TutorResponse } from "./types";
import { VectorSearchResult } from "./vector-database";
import { ollamaLLM } from './llm';
import { getVectorDatabaseInstance } from './vector-database-instance';

export interface TutorQuery {
  question: string
  context?: string
  maxResults?: number
}

export class TutorAgent {
  private readonly MAX_CONTEXT_LENGTH = 2000
  private MIN_SIMILARITY_THRESHOLD: number = 0.3;

  async answerQuestion(query: TutorQuery): Promise<TutorResponse> {
    const startTime = Date.now()

    try {
      // Step 1: Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query.question);
      
      // Step 2: Retrieve relevant documents from vector database
      const vectorDb = await getVectorDatabaseInstance();
      const searchResults = await vectorDb.search(queryEmbedding, query.maxResults || 5);

      // Step 3: Filter results by similarity threshold
      const relevantResults = searchResults.filter((result: VectorSearchResult) => result.similarity >= this.MIN_SIMILARITY_THRESHOLD)

      if (relevantResults.length === 0) {
        return {
          answer:
            "I couldn't find relevant information in the knowledge base to answer your question. Please try rephrasing your question or ensure that relevant documents have been uploaded to the system.",
          citations: [],
          confidence: 0,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
        }
      }

      // Step 4: Prepare context from retrieved documents
      const contextChunks = relevantResults.map((result: VectorSearchResult) => result.content);

      // Step 5: Generate answer using Ollama LLM with context
      const llmResponse = await ollamaLLM.generateWithContext(
        query.question, 
        contextChunks,
        { temperature: 0.7, maxTokens: 500 }
      );
      
      const answer = llmResponse.text;

      // Step 6: Extract citations
      const citations = this.extractCitations(relevantResults)

      // Step 7: Calculate confidence score
      const confidence = this.calculateConfidence(relevantResults)

      return {
        answer,
        citations,
        confidence,
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
      console.error("Error in TutorAgent:", error)
      return {
        answer:
          "I encountered an error while processing your question. Please try again or contact support if the issue persists.",
        citations: [],
        confidence: 0,
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
      }
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Use Python to generate embedding with the same model used for documents
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const pythonProcess = spawn(process.platform === 'win32' ? 'python' : 'python3', ['-c', `
import sys
import json
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
text = sys.stdin.read().strip()
embedding = model.encode(text).tolist()
print(json.dumps(embedding))
`]);

      let output = '';
      pythonProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        console.error('Python Error:', data.toString());
      });

      pythonProcess.on('close', (code: number) => {
        if (code === 0) {
          try {
            const embedding = JSON.parse(output);
            resolve(embedding);
          } catch (error) {
            reject(new Error('Failed to parse embedding output'));
          }
        } else {
          reject(new Error(`Python script exited with code ${code}`));
        }
      });

      pythonProcess.stdin.write(text);
      pythonProcess.stdin.end();
    });
  }



  private extractCitations(results: VectorSearchResult[]): Citation[] {
    const citations: Citation[] = []
    const seenSources = new Set<string>()

    for (const result of results) {
      const sourceKey = `${result.metadata.filename}-${result.metadata.pageNumber || "unknown"}`

      if (!seenSources.has(sourceKey)) {
        seenSources.add(sourceKey)

        citations.push({
          source: result.metadata.filename,
          page: result.metadata.pageNumber,
          type: "document",
          relevance: result.similarity,
        })
      }
    }

    // Add some web citations for demonstration
    if (citations.length > 0) {
      citations.push({
        source: "NIST Cybersecurity Framework",
        url: "https://www.nist.gov/cyberframework",
        type: "web",
        relevance: 0.8,
      })
    }

    return citations.slice(0, 5) // Limit to top 5 citations
  }

  private calculateConfidence(results: VectorSearchResult[]): number {
    if (results.length === 0) return 0

    // Calculate confidence based on similarity scores and number of results
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length
    const resultCountFactor = Math.min(results.length / 3, 1) // Normalize to max of 3 results

    return Math.round(avgSimilarity * resultCountFactor * 100)
  }

  async getTopics(): Promise<string[]> {
    // Return common network security topics
    return [
      "Network Attacks",
      "Cryptography",
      "Firewalls",
      "Intrusion Detection",
      "Authentication",
      "Network Protocols",
      "Security Architecture",
      "Risk Management",
      "Incident Response",
      "Compliance",
    ]
  }

  async getSampleQuestions(): Promise<string[]> {
    return [
      "What is the difference between symmetric and asymmetric encryption?",
      "How do firewalls protect network infrastructure?",
      "What are the common types of network intrusion detection systems?",
      "Explain the concept of defense in depth in network security.",
      "What is a man-in-the-middle attack and how can it be prevented?",
      "How does SSL/TLS provide secure communication?",
      "What are the key components of a network security policy?",
      "How do VPNs ensure secure remote access?",
    ]
  }

  async processQuery(query: { question: string; maxResults?: number }): Promise<void> {
    const searchResults: VectorSearchResult[] = []; // Placeholder for actual results
    const relevantResults = searchResults.filter((result: VectorSearchResult) => result.similarity >= this.MIN_SIMILARITY_THRESHOLD);
    console.log(relevantResults);
  }
}

export const tutorAgent = new TutorAgent()

async function processResult(result: VectorSearchResult): Promise<void> {
  // Explicitly typed result parameter
  console.log(result);
}
