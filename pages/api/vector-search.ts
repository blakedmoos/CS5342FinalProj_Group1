import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';

const pythonScript = `
import sys
import json
from transformers import pipeline

# Initialize the model once and reuse it
qa_pipeline = pipeline('question-answering', model='deepset/roberta-base-squad2', device=-1)  # Use CPU

def handle_request():
    input_data = json.loads(sys.stdin.read())
    response = qa_pipeline(question=input_data['question'], context=input_data['context'])
    print(json.dumps(response))

if __name__ == '__main__':
    handle_request()
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, context } = req.body;

  if (!question || !context) {
    return res.status(400).json({ error: 'Missing question or context in request body' });
  }

  const pythonProcess = spawn(process.platform === 'win32' ? 'python' : 'python3', ['-c', pythonScript]);

  let output = '';
  let errorOutput = '';

  const timeout = setTimeout(() => {
    pythonProcess.kill();
    res.status(500).json({ error: 'Python process timed out' });
  }, 10000); // 10-second timeout

  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error('Python Error:', data.toString());
  });

  pythonProcess.on('close', (code) => {
    clearTimeout(timeout);
    if (code === 0) {
      try {
        const response = JSON.parse(output);
        res.status(200).json({ answer: response.answer });
      } catch (error) {
        res.status(500).json({ error: 'Failed to parse Python response' });
      }
    } else {
      res.status(500).json({ error: `Python script exited with code ${code}`, details: errorOutput });
    }
  });

  pythonProcess.stdin.write(JSON.stringify({ question, context }));
  pythonProcess.stdin.end();
}