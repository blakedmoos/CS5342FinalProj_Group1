import axios from 'axios';

export interface VectorSearchResult {
  documentId: string;
  chunkId: string;
  content: string;
  similarity: number;
  metadata: {
    filename: string;
    pageNumber?: number;
    topics: string[];
  };
}

export async function queryVectorDatabase(question: string, context: string): Promise<string> {
  try {
    const response = await axios.post('http://localhost:3000/api/vector-search', { question, context });
    return response.data.answer;
  } catch (error) {
    console.error('Error querying vector database API:', error);
    throw new Error('Failed to query vector database API');
  }
}

export function getStats() {
  return {
    totalDocuments: 0, // Placeholder value
    totalChunks: 0,    // Placeholder value
  };
}

export async function addDocument(documentId: string, chunks: any[]): Promise<void> {
  try {
    const { getVectorDatabaseInstance } = await import('@/lib/vector-database-instance');
    const vectorDatabase = await getVectorDatabaseInstance();
    
    // Extract embeddings, metadata, and contents from chunks
    const embeddings = chunks.map(chunk => chunk.embedding || []);
    const metadata = chunks.map(chunk => chunk.metadata || {});
    const contents = chunks.map(chunk => chunk.content || '');
    
    // Validate that we have embeddings
    if (embeddings.some(emb => !emb || emb.length === 0)) {
      console.warn(`Some chunks in document ${documentId} are missing embeddings. Skipping those chunks.`);
    }
    
    // Filter out chunks without embeddings
    const validIndices = embeddings
      .map((emb, idx) => emb && emb.length > 0 ? idx : -1)
      .filter(idx => idx !== -1);
    
    if (validIndices.length === 0) {
      throw new Error(`No valid embeddings found for document ${documentId}`);
    }
    
    const validEmbeddings = validIndices.map(i => embeddings[i]);
    const validMetadata = validIndices.map(i => metadata[i]);
    const validContents = validIndices.map(i => contents[i]);

    await vectorDatabase.add({
      documentId,
      embeddings: validEmbeddings,
      metadata: validMetadata,
      contents: validContents,
    });
    
    console.log(`Successfully added document ${documentId} with ${validIndices.length} chunks to vector database.`);
  } catch (error) {
    console.error('Error adding document to vector database:', error);
    throw new Error('Failed to add document to vector database');
  }
}

interface StoredChunk {
  documentId: string;
  chunkId: string;
  content: string;
  embedding: number[];
  metadata: {
    filename: string;
    pageNumber?: number;
    topics: string[];
    chunkIndex: number;
  };
}

export class VectorDatabase {
  private chunks: StoredChunk[] = [];

  /**
   * Add document chunks with embeddings to the vector database
   */
  async add(document: { 
    documentId: string; 
    embeddings: number[][]; 
    metadata: any[];
    contents: string[];
  }): Promise<void> {
    console.log(`Adding document ${document.documentId} with ${document.embeddings.length} chunks to vector database.`);
    
    for (let i = 0; i < document.embeddings.length; i++) {
      const chunk: StoredChunk = {
        documentId: document.documentId,
        chunkId: `${document.documentId}_chunk_${i}`,
        content: document.contents[i] || '',
        embedding: document.embeddings[i],
        metadata: {
          filename: document.metadata[i]?.filename || 'unknown',
          pageNumber: document.metadata[i]?.pageNumber,
          topics: document.metadata[i]?.topics || [],
          chunkIndex: i,
        }
      };
      this.chunks.push(chunk);
    }
    
    console.log(`Vector database now contains ${this.chunks.length} total chunks.`);
  }

  /**
   * Search for similar chunks using cosine similarity
   */
  async search(queryEmbedding: number[], topK: number = 5): Promise<VectorSearchResult[]> {
    if (this.chunks.length === 0) {
      console.log('Vector database is empty. No results to return.');
      return [];
    }

    // Calculate cosine similarity for each chunk
    const similarities = this.chunks.map(chunk => ({
      chunk,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Sort by similarity (highest first) and take top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, topK);

    // Convert to VectorSearchResult format
    return topResults.map(({ chunk, similarity }) => ({
      documentId: chunk.documentId,
      chunkId: chunk.chunkId,
      content: chunk.content,
      similarity,
      metadata: {
        filename: chunk.metadata.filename,
        pageNumber: chunk.metadata.pageNumber,
        topics: chunk.metadata.topics,
      }
    }));
  }

  /**
   * Get all chunks (useful for quiz generation)
   */
  getAllChunks(): StoredChunk[] {
    return this.chunks;
  }

  /**
   * Get chunks filtered by topic
   * Searches in: metadata topics, chunk content, and filename
   */
  getChunksByTopic(topic: string): StoredChunk[] {
    const topicLower = topic.toLowerCase();
    
    return this.chunks.filter(chunk => {
      // Check metadata topics
      const hasTopicInMetadata = chunk.metadata.topics.some(t => 
        t.toLowerCase().includes(topicLower)
      );
      
      // Check content for topic keywords
      const contentLower = chunk.content.toLowerCase();
      const hasTopicInContent = contentLower.includes(topicLower);
      
      // Check filename
      const filenameLower = chunk.metadata.filename.toLowerCase();
      const hasTopicInFilename = filenameLower.includes(topicLower);
      
      return hasTopicInMetadata || hasTopicInContent || hasTopicInFilename;
    });
  }

  /**
   * Get database statistics
   */
  getStats(): { totalDocuments: number; totalChunks: number; topics: string[] } {
    const uniqueDocuments = new Set(this.chunks.map(c => c.documentId));
    const allTopics = new Set<string>();
    
    this.chunks.forEach(chunk => {
      chunk.metadata.topics.forEach(topic => allTopics.add(topic));
    });

    return {
      totalDocuments: uniqueDocuments.size,
      totalChunks: this.chunks.length,
      topics: Array.from(allTopics),
    };
  }

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.chunks = [];
    console.log('Vector database cleared.');
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length for cosine similarity calculation');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }
}
