import { VectorDatabase } from "@/lib/vector-database";

// Use global to ensure singleton across Next.js hot reloads
declare global {
  var vectorDbInstance: VectorDatabase | undefined;
}

/**
 * Get or create the singleton vector database instance
 * This ensures all parts of the application use the same in-memory database
 */
export async function getVectorDatabaseInstance(): Promise<VectorDatabase> {
  if (!global.vectorDbInstance) {
    global.vectorDbInstance = new VectorDatabase();
    console.log('Vector database instance created.');
  }
  return global.vectorDbInstance;
}

/**
 * Reset the instance (useful for testing)
 */
export function resetVectorDatabaseInstance(): void {
  if (global.vectorDbInstance) {
    global.vectorDbInstance.clear();
  }
  global.vectorDbInstance = undefined;
}