import type { ProcessedDocument, DocumentChunk, DocumentMetadata, ChunkMetadata } from "./document-processor";

class DocumentProcessorClient {
  private readonly CHUNK_SIZE = 500;
  private readonly CHUNK_OVERLAP = 50;

  async processDocument(file: File): Promise<ProcessedDocument> {
    const content = await this.extractText(file);
    const chunks = this.createChunks(content);
    const metadata = await this.extractMetadata(file, content);

    return {
      id: this.generateId(),
      title: this.extractTitle(file.name),
      content,
      chunks,
      metadata,
    };
  }

  private async extractText(file: File): Promise<string> {
    const fileType = this.getFileType(file.name);
    switch (fileType) {
      case "pdf":
        return this.extractFromPDF(file);
      case "docx":
        return this.extractFromDocx(file);
      case "pptx":
        return this.extractFromPptx(file);
      case "txt":
        return this.extractFromText(file);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async extractFromPDF(file: File): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error("PDF extraction is only supported in the browser.");
    }
    const { extractTextFromPDF } = await import("./pdf-extract.client");
    return extractTextFromPDF(file);
  }

  private async extractFromDocx(file: File): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`CS5342 Network Security Quiz Bank\n\nQuestion 1: What is the primary purpose of a firewall?\nA) To encrypt data\nB) To filter network traffic\nC) To detect malware\nD) To backup data\n\nAnswer: B) To filter network traffic\n\nExplanation: Firewalls are network security devices that monitor and control incoming and outgoing network traffic based on predetermined security rules.`);
      }, 800);
    });
  }

  private async extractFromPptx(file: File): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`CS5342 Lecture 3: Cryptography Fundamentals\n\nSlide 1: Introduction to Cryptography\n- Definition: The practice of securing communication in the presence of adversaries\n- Goals: Confidentiality, Integrity, Authentication, Non-repudiation\n\nSlide 2: Symmetric vs Asymmetric Encryption\n- Symmetric: Same key for encryption and decryption\n- Asymmetric: Different keys (public/private key pairs)\n\nSlide 3: Common Algorithms\n- AES (Advanced Encryption Standard)\n- RSA (Rivest-Shamir-Adleman)\n- SHA (Secure Hash Algorithm)`);
      }, 600);
    });
  }

  private async extractFromText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private createChunks(content: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const words = content.split(/\s+/);
    for (let i = 0; i < words.length; i += this.CHUNK_SIZE - this.CHUNK_OVERLAP) {
      const chunkWords = words.slice(i, i + this.CHUNK_SIZE);
      const chunkContent = chunkWords.join(" ");
      chunks.push({
        id: this.generateId(),
        content: chunkContent,
        startIndex: i,
        endIndex: Math.min(i + this.CHUNK_SIZE, words.length),
        metadata: {
          chunkIndex: chunks.length,
          topics: this.extractTopics(chunkContent),
        },
      });
    }
    return chunks;
  }

  private async extractMetadata(file: File, content: string): Promise<DocumentMetadata> {
    const wordCount = content.split(/\s+/).length;
    const topics = this.extractTopics(content);
    return {
      filename: file.name,
      fileType: this.getFileType(file.name),
      uploadDate: new Date(),
      wordCount,
      topics,
    };
  }

  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    const topicKeywords = {
      "Network Attacks": ["attack", "malware", "phishing", "ddos", "intrusion"],
      Cryptography: ["encryption", "decryption", "cipher", "key", "hash", "aes", "rsa"],
      Firewalls: ["firewall", "packet filtering", "network security", "access control"],
      Authentication: ["authentication", "authorization", "identity", "credentials"],
      "Network Protocols": ["tcp", "ip", "http", "https", "ssl", "tls", "protocol"],
    };
    const lowerContent = content.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((keyword) => lowerContent.includes(keyword))) {
        topics.push(topic);
      }
    }
    return topics.length > 0 ? topics : ["General"];
  }

  private extractTitle(filename: string): string {
    return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
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
}

export const documentProcessorClient = new DocumentProcessorClient();
