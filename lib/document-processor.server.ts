/**
 * Server-side Document Processor for Node.js environments
 * Uses pdf-parse for PDF extraction (works in Node.js)
 */

import { spawn } from 'child_process';

export interface ProcessedDocument {
  id: string;
  title: string;
  content: string;
  chunks: DocumentChunk[];
  metadata: DocumentMetadata;
}

export interface DocumentChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  embedding?: number[];
  metadata: ChunkMetadata;
}

export interface DocumentMetadata {
  filename: string;
  fileType: "pdf" | "docx" | "txt" | "pptx";
  uploadDate: Date;
  pageCount?: number;
  wordCount: number;
  topics: string[];
}

export interface ChunkMetadata {
  chunkIndex: number;
  topics: string[];
  filename: string;
  pageNumber?: number;
}

export class ServerDocumentProcessor {
  private readonly CHUNK_SIZE = 500; // words per chunk
  private readonly CHUNK_OVERLAP = 50;

  async processDocument(fileBuffer: Buffer, filename: string): Promise<ProcessedDocument> {
    const content = await this.extractText(fileBuffer, filename);
    const chunks = this.createChunks(content);
    const metadata = this.extractMetadata(filename, content);

    // Generate embeddings for all chunks
    const chunksWithEmbeddings = await this.generateEmbeddings(chunks, filename);

    return {
      id: this.generateId(),
      title: this.extractTitle(filename),
      content,
      chunks: chunksWithEmbeddings,
      metadata,
    };
  }

  private async extractText(fileBuffer: Buffer, filename: string): Promise<string> {
    const fileType = this.getFileType(filename);
    
    switch (fileType) {
      case "pdf":
        return this.extractFromPDF(fileBuffer);
      case "txt":
        return fileBuffer.toString('utf-8');
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async extractFromPDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(process.platform === 'win32' ? 'python' : 'python3', ['-c', `
import sys
import PyPDF2
from io import BytesIO

pdf_data = sys.stdin.buffer.read()
pdf_file = BytesIO(pdf_data)
reader = PyPDF2.PdfReader(pdf_file)

text = ""
for page in reader.pages:
    text += page.extract_text() + "\\n"

print(text)
      `]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`PDF extraction failed: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });

      pythonProcess.stdin.write(buffer);
      pythonProcess.stdin.end();
    });
  }

  private createChunks(content: string): DocumentChunk[] {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const chunks: DocumentChunk[] = [];
    let currentIndex = 0;

    while (currentIndex < words.length) {
      const chunkWords = words.slice(currentIndex, currentIndex + this.CHUNK_SIZE);
      const chunkText = chunkWords.join(' ');
      
      const startCharIndex = content.indexOf(chunkWords[0], currentIndex > 0 ? chunks[chunks.length - 1]?.endIndex || 0 : 0);
      const endCharIndex = startCharIndex + chunkText.length;

      chunks.push({
        id: this.generateId(),
        content: chunkText,
        startIndex: startCharIndex,
        endIndex: endCharIndex,
        metadata: {
          chunkIndex: chunks.length,
          topics: [],
          filename: '',
        },
      });

      currentIndex += this.CHUNK_SIZE - this.CHUNK_OVERLAP;
    }

    return chunks;
  }

  private extractMetadata(filename: string, content: string): DocumentMetadata {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const topics = this.extractTopics(content, filename);

    return {
      filename,
      fileType: this.getFileType(filename),
      uploadDate: new Date(),
      wordCount: words.length,
      topics,
    };
  }

  private extractTopics(content: string, filename: string): string[] {
    const topics: Set<string> = new Set();
    const lowerContent = content.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Network security topics
    const topicKeywords: { [key: string]: string[] } = {
      "Network Security": ["network security", "network attack", "network defense", "network threat"],
      "Encryption": ["encryption", "cryptography", "cipher", "decrypt", "encrypt", "aes", "rsa", "des"],
      "Firewalls": ["firewall", "packet filtering", "network filtering", "access control"],
      "Authentication": ["authentication", "password", "credential", "identity", "login", "access control"],
      "Malware": ["malware", "virus", "trojan", "worm", "ransomware", "spyware"],
      "Intrusion Detection": ["intrusion detection", "ids", "ips", "security monitoring"],
      "VPN": ["vpn", "virtual private network", "tunneling", "ipsec"],
      "SSL/TLS": ["ssl", "tls", "https", "certificate", "secure socket"],
      "DoS/DDoS": ["denial of service", "dos", "ddos", "flooding"],
      "Web Security": ["web security", "xss", "sql injection", "csrf", "web application"],
    };

    // Check filename for topic hints
    if (lowerFilename.includes('lecture')) {
      topics.add("Lecture");
    }
    if (lowerFilename.includes('homework') || lowerFilename.includes('hw')) {
      topics.add("Homework");
    }

    // Check content for topics
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        topics.add(topic);
      }
    }

    // Default topic if none found
    if (topics.size === 0) {
      topics.add("Network Security");
    }

    return Array.from(topics);
  }

  private extractTitle(filename: string): string {
    return filename.replace(/\.[^/.]+$/, ""); // Remove extension
  }

  private getFileType(filename: string): DocumentMetadata["fileType"] {
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "pdf";
      case "docx":
      case "doc":
        return "docx";
      case "pptx":
      case "ppt":
        return "pptx";
      case "txt":
        return "txt";
      default:
        return "txt";
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private async generateEmbeddings(chunks: DocumentChunk[], filename: string): Promise<DocumentChunk[]> {
    console.log(`   ⏳ Generating embeddings for ${chunks.length} chunks...`);
    
    try {
      const embeddings: number[][] = await this.runPythonEmbeddingScript(chunks.map(chunk => chunk.content));
      
      return chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index],
        metadata: {
          ...chunk.metadata,
          filename,
        },
      }));
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
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

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
        } else {
          try {
            const embeddings = JSON.parse(stdout);
            resolve(embeddings);
          } catch (error) {
            reject(new Error(`Failed to parse embeddings: ${error}`));
          }
        }
      });

      pythonProcess.stdin.write(JSON.stringify(contents));
      pythonProcess.stdin.end();
    });
  }
}
