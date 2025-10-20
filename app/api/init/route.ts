import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { getVectorDatabaseInstance } from '@/lib/vector-database-instance';
import path from 'path';
import fs from 'fs';

/**
 * Initialize the vector database by processing all PDFs in the public folder
 */
export async function POST() {
  try {
    console.log('Starting vector database initialization...');
    
    // Get vector database instance
    const vectorDb = await getVectorDatabaseInstance();
    
    // Check if already initialized
    const stats = vectorDb.getStats();
    if (stats.totalChunks > 0) {
      console.log(`Vector database already initialized with ${stats.totalChunks} chunks.`);
      return NextResponse.json({
        success: true,
        message: 'Vector database already initialized',
        stats
      });
    }
    
    // Process PDFs directly in this process
    console.log('Processing PDFs...');
    
    const { ServerDocumentProcessor } = await import('@/lib/document-processor.server');
    const { addDocument } = await import('@/lib/vector-database');
    
    const PUBLIC_DIR = path.join(process.cwd(), 'public');
    const pdfFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.pdf'));
    
    console.log(`Found ${pdfFiles.length} PDF files`);
    
    const processor = new ServerDocumentProcessor();
    let processedCount = 0;
    let failedCount = 0;
    
    for (const filename of pdfFiles) {
      try {
        console.log(`Processing: ${filename}`);
        const filePath = path.join(PUBLIC_DIR, filename);
        const fileBuffer = fs.readFileSync(filePath);
        
        // Process the document
        const processed = await processor.processDocument(fileBuffer, filename);
        
        // Add to vector database
        await addDocument(processed.id, processed.chunks);
        
        processedCount++;
        console.log(`✓ Processed ${filename} (${processed.chunks.length} chunks)`);
      } catch (error) {
        failedCount++;
        console.error(`✗ Failed to process ${filename}:`, error);
      }
    }
    
    const finalStats = vectorDb.getStats();
    console.log(`Processing complete: ${processedCount} succeeded, ${failedCount} failed`);
    console.log('Final stats:', finalStats);
    
    return NextResponse.json({
      success: true,
      message: 'Vector database initialized successfully',
      stats: finalStats,
      processed: processedCount,
      failed: failedCount
    });
    
  } catch (error) {
    console.error('Error initializing vector database:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get the current status of the vector database
 */
export async function GET() {
  try {
    const vectorDb = await getVectorDatabaseInstance();
    const stats = vectorDb.getStats();
    
    return NextResponse.json({
      success: true,
      initialized: stats.totalChunks > 0,
      stats
    });
  } catch (error) {
    console.error('Error getting vector database status:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Clear the vector database
 */
export async function DELETE() {
  try {
    const { resetVectorDatabaseInstance } = await import('@/lib/vector-database-instance');
    resetVectorDatabaseInstance();
    
    return NextResponse.json({
      success: true,
      message: 'Vector database cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing vector database:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
