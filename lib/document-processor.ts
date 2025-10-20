import { spawn } from 'child_process';

export interface ProcessedDocument {
  id: string
  title: string
  content: string
  chunks: DocumentChunk[]
  metadata: DocumentMetadata
  embeddings?: number[][]
}

export interface DocumentChunk {
  id: string
  content: string
  startIndex: number
  endIndex: number
  embedding?: number[]
  metadata: ChunkMetadata
}

export interface DocumentMetadata {
  filename: string
  fileType: "pdf" | "docx" | "txt" | "pptx"
  uploadDate: Date
  pageCount?: number
  wordCount: number
  topics: string[]
}

export interface ChunkMetadata {
  chunkIndex: number
  pageNumber?: number
  section?: string
  topics: string[]
  filename?: string
}

export class DocumentProcessor {
  private readonly CHUNK_SIZE = 500
  private readonly CHUNK_OVERLAP = 50

  async processDocument(file: File): Promise<ProcessedDocument> {
    const content = await this.extractText(file)
    const chunks = this.createChunks(content)
    const metadata = await this.extractMetadata(file, content)

    const embeddings = await this.generateEmbeddings(chunks);
    console.log("Generated embeddings:", embeddings); // Debugging log

    // Add embeddings to chunks
    const chunksWithEmbeddings = chunks.map((chunk, index) => ({
      id: chunk.id,
      content: chunk.content,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
      embedding: embeddings[index],
      metadata: chunk.metadata,
    }));

    return {
      id: this.generateId(),
      title: this.extractTitle(file.name),
      content,
      chunks: chunksWithEmbeddings,
      metadata,
    }
  }

  private async extractText(file: File): Promise<string> {
    // Simulate text extraction from different file types
    const fileType = this.getFileType(file.name)

    switch (fileType) {
      case "pdf":
        throw new Error("PDF extraction is only supported in the browser. Use document-processor.client.ts in client components.");
      case "docx":
        return this.extractFromDocx(file)
      case "pptx":
        return this.extractFromPptx(file)
      case "txt":
        return this.extractFromText(file)
      default:
        throw new Error(`Unsupported file type: ${fileType}`)
    }
  }


  private async extractFromDocx(file: File): Promise<string> {
    // Simulate DOCX extraction
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`CS5342 Network Security Quiz Bank

Question 1: What is the primary purpose of a firewall?
A) To encrypt data
B) To filter network traffic
C) To detect malware
D) To backup data

Answer: B) To filter network traffic

Explanation: Firewalls are network security devices that monitor and control incoming and outgoing network traffic based on predetermined security rules.`)
      }, 800)
    })
  }

  private async extractFromPptx(file: File): Promise<string> {
    // Simulate PowerPoint extraction
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`CS5342 Lecture 3: Cryptography Fundamentals

Slide 1: Introduction to Cryptography
- Definition: The practice of securing communication in the presence of adversaries
- Goals: Confidentiality, Integrity, Authentication, Non-repudiation

Slide 2: Symmetric vs Asymmetric Encryption
- Symmetric: Same key for encryption and decryption
- Asymmetric: Different keys (public/private key pairs)

Slide 3: Common Algorithms
- AES (Advanced Encryption Standard)
- RSA (Rivest-Shamir-Adleman)
- SHA (Secure Hash Algorithm)`)
      }, 600)
    })
  }

  private async extractFromText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  private createChunks(content: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    const words = content.split(/\s+/)

    for (let i = 0; i < words.length; i += this.CHUNK_SIZE - this.CHUNK_OVERLAP) {
      const chunkWords = words.slice(i, i + this.CHUNK_SIZE)
      const chunkContent = chunkWords.join(" ")

      chunks.push({
        id: this.generateId(),
        content: chunkContent,
        startIndex: i,
        endIndex: Math.min(i + this.CHUNK_SIZE, words.length),
        metadata: {
          chunkIndex: chunks.length,
          topics: this.extractTopics(chunkContent),
        },
      })
    }

    return chunks
  }

  private async extractMetadata(file: File, content: string): Promise<DocumentMetadata> {
    const wordCount = content.split(/\s+/).length
    const topics = this.extractTopics(content)

    return {
      filename: file.name,
      fileType: this.getFileType(file.name),
      uploadDate: new Date(),
      wordCount,
      topics,
    }
  }

  private extractTopics(content: string): string[] {
    const topics: string[] = []
    const topicKeywords = {
      "Network Attacks": ["attack", "malware", "phishing", "ddos", "intrusion"],
      Cryptography: ["encryption", "decryption", "cipher", "key", "hash", "aes", "rsa"],
      Firewalls: ["firewall", "packet filtering", "network security", "access control"],
      Authentication: ["authentication", "authorization", "identity", "credentials"],
      "Network Protocols": ["tcp", "ip", "http", "https", "ssl", "tls", "protocol"],
    }

    const lowerContent = content.toLowerCase()

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((keyword) => lowerContent.includes(keyword))) {
        topics.push(topic)
      }
    }

    return topics.length > 0 ? topics : ["General"]
  }

  private extractTitle(filename: string): string {
    return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
  }

  private getFileType(filename: string): DocumentMetadata["fileType"] {
    const extension = filename.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return "pdf"
      case "docx":
      case "doc":
        return "docx"
      case "pptx":
      case "ppt":
        return "pptx"
      case "txt":
        return "txt"
      default:
        return "txt"
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private async generateEmbeddings(chunks: DocumentChunk[]): Promise<number[][]> {
    const embeddings: number[][] = await this.runPythonEmbeddingScript(chunks.map(chunk => chunk.content));
    return embeddings;
  }

  private async runPythonEmbeddingScript(contents: string[]): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(process.platform === 'win32' ? 'python' : 'python3', ['-c', `
import sys
import json
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
contents = json.loads(sys.stdin.read())
embeddings = model.encode(contents).tolist()
print(json.dumps(embeddings))
`]);

      let output = '';
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error('Python Error:', data.toString());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(JSON.parse(output));
        } else {
          reject(new Error(`Python script exited with code ${code}`));
        }
      });

      pythonProcess.stdin.write(JSON.stringify(contents));
      pythonProcess.stdin.end();
    });
  }
}

export const documentProcessor = new DocumentProcessor()
