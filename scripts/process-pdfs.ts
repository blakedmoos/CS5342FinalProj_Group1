/**
 * Script to process all PDFs in the /public folder and add them to the vector database
 * Run this script with: npx tsx scripts/process-pdfs.ts
 */

import fs from 'fs';
import path from 'path';
import { ServerDocumentProcessor } from '../lib/document-processor.server';
import { addDocument } from '../lib/vector-database';
import { getVectorDatabaseInstance } from '../lib/vector-database-instance';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

async function processAllPDFs() {
  console.log('🚀 Starting PDF processing...\n');
  console.log(`📂 Scanning directory: ${PUBLIC_DIR}\n`);

  // Get vector database instance
  const vectorDb = await getVectorDatabaseInstance();
  console.log('✅ Vector database initialized\n');

  // Find all PDF files in public folder
  const files = fs.readdirSync(PUBLIC_DIR);
  const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

  console.log(`📄 Found ${pdfFiles.length} PDF files:\n`);
  pdfFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  console.log('\n');

  const processor = new ServerDocumentProcessor();
  let successCount = 0;
  let errorCount = 0;

  for (const pdfFile of pdfFiles) {
    const filePath = path.join(PUBLIC_DIR, pdfFile);
    console.log(`\n📖 Processing: ${pdfFile}`);
    console.log(`   Path: ${filePath}`);

    try {
      // Read the file
      const fileBuffer = fs.readFileSync(filePath);

      // Process the document
      console.log(`   ⏳ Extracting text and generating embeddings...`);
      const processedDoc = await processor.processDocument(fileBuffer, pdfFile);

      console.log(`   ✓ Extracted ${processedDoc.chunks.length} chunks`);
      console.log(`   ✓ Document ID: ${processedDoc.id}`);
      console.log(`   ✓ Topics: ${processedDoc.metadata.topics.join(', ')}`);

      // Add to vector database
      console.log(`   ⏳ Adding to vector database...`);
      await addDocument(processedDoc.id, processedDoc.chunks);

      console.log(`   ✅ Successfully processed: ${pdfFile}`);
      successCount++;

    } catch (error) {
      console.error(`   ❌ Error processing ${pdfFile}:`, error);
      errorCount++;
    }
  }

  // Print final statistics
  console.log('\n' + '='.repeat(60));
  console.log('📊 Processing Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Successfully processed: ${successCount} files`);
  console.log(`❌ Failed: ${errorCount} files`);
  
  const stats = vectorDb.getStats();
  console.log(`\n📚 Vector Database Statistics:`);
  console.log(`   - Total Documents: ${stats.totalDocuments}`);
  console.log(`   - Total Chunks: ${stats.totalChunks}`);
  console.log(`   - Topics: ${stats.topics.join(', ')}`);
  console.log('\n✨ Done!\n');
}

// Run the script
processAllPDFs().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
