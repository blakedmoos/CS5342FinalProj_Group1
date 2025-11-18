/**
 * Local LLM Integration using Ollama
 * Provides interface to interact with locally running Ollama models
 */

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  difficulty?: "easy" | "medium" | "hard";
}

export interface LLMResponse {
  text: string;
  model: string;
  completionTokens?: number;
}

export class OllamaLLM {
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl: string = 'http://localhost:11434', defaultModel: string = 'llama3.2:3b') {
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  /**
   * Generate text completion from prompt
   */
  async generate(prompt: string, options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model || this.defaultModel;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: options?.temperature || 0.7,
            num_predict: options?.maxTokens || 500,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.response,
        model: data.model,
        completionTokens: data.eval_count,
      };
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw new Error('Failed to generate response from local LLM');
    }
  }

  /**
   * Generate answer with context (RAG pattern)
   */
  async generateWithContext(
    question: string,
    context: string[],
    options?: LLMOptions
  ): Promise<LLMResponse> {
    const contextText = context.join('\n\n---\n\n');
    
    const prompt = `You are a helpful AI assistant specializing in network security. Answer the following question based on the provided context. If the context doesn't contain enough information, say so.

Context:
${contextText}

Question: ${question}

Answer:`;

    return this.generate(prompt, options);
  }

  /**
   * Generate quiz question from content
   */
  async generateQuizQuestion(
    content: string,
    questionType: 'multiple-choice' | 'true-false' | 'open-ended',
    options?: LLMOptions
  ): Promise<string> {
    let prompt = '';

    switch (questionType) {
      case 'multiple-choice':
        prompt = `Based on the following content about network security, generate a multiple-choice question with 4 options (A, B, C, D). Mark the correct answer.  

Content:
${content}

IMPORTANT: Do NOT include the answer in the question text. Only provide it separately after the options.  Do not ask questions about specific images, models, or organizations (like NIST or RFC) in the database, only ask conceptual questions in which the information is provided in the database but not questions about a specific document.  Ensure that only one answer choice is correct and the other three are incorrect.

Generate the question in this exact format:
Question: [Your question here - DO NOT reveal the answer]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct Answer: [Letter]`;
        break;

      case 'true-false':
        prompt = `Based on the following content about network security, generate a true/false question.

Content:
${content}

IMPORTANT: Do NOT include the answer in the question statement. Only provide it separately.  Do not ask questions about specific images, models, or organizations (like NIST or RFC) in the database, only ask conceptual questions in which the information is provided in the database but not questions about a specific document.  Ensure that the question is clear in what it is asking and does not require context outside of the question.

Generate the question in this exact format:
Question: [Your statement here - DO NOT include the answer]
Correct Answer: [True or False]`;
        break;

      case 'open-ended':
        prompt = `Based on the following content about network security, generate a concise open-ended question that requires an explanation.  Make it only one question, not multiple.  Do not ask questions about specific images, models, or organizations (like NIST or RFC) in the database, only ask conceptual questions in which the information is provided in the database but not questions about a specific document.

Content:
${content}

Generate the question in this format:
Question: [Your question here]
Expected Answer: [Key points that should be in the answer]`;
        break;
    }

    const response = await this.generate(prompt, {
      ...options,
      temperature: 0.75, // Higher temperature for more variety
    });

    return response.text;
  }

  /**
   * Grade an open-ended answer
   */
  async gradeAnswer(
    question: string,
    userAnswer: string,
    correctAnswer: string,
    options?: LLMOptions
  ): Promise<{ score: number; feedback: string }> {
    const prompt = `You are grading a student's answer to a network security question. Compare their answer to the correct answer and provide a score from 0 to 100 and constructive feedback.  If the answer was incorrect, explain why the correct answer is correct.  Make sure if the user's answer is gibberish or completely irrelevant to give a score of 0.

Question: ${question}

Student's Answer: ${userAnswer}

Correct/Expected Answer: ${correctAnswer}

Provide your response in this exact format:
Score: [0-100]
Feedback: [Your detailed feedback explaining what was correct, what was missing, and suggestions for improvement]`;

    const response = await this.generate(prompt, {
      ...options,
      temperature: 0.3, // Lower temperature for consistent grading
    });

    // Parse the response
    const scoreMatch = response.text.match(/Score:\s*(\d+)/i);
    const feedbackMatch = response.text.match(/Feedback:\s*([\s\S]+)/i);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : response.text;

    return { score, feedback };
  }

  /**
   * Check if Ollama is running and model is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }
}

// Export singleton instance
export const ollamaLLM = new OllamaLLM();
