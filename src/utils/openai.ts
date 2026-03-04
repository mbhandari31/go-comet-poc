import OpenAI from 'openai';
import { schemaDescription } from '../data/sampleData';
import type { ExtractedDocument, LineItem } from '../types';

let openaiClient: OpenAI | null = null;

export function initOpenAI(apiKey: string): void {
  openaiClient = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // Required for client-side usage
  });
}

export function getOpenAIClient(): OpenAI | null {
  return openaiClient;
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    // Make a minimal API call to validate
    await client.models.list();
    return true;
  } catch {
    return false;
  }
}

interface QueryGenerationResult {
  sql: string;
  explanation: string;
  chartType: 'bar' | 'line' | 'pie' | 'table';
  chartConfig: {
    xKey: string;
    yKey: string;
    title: string;
  };
}

export async function generateSQLFromQuestion(
  question: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<QueryGenerationResult> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized');
  }

  const systemPrompt = `You are an expert SQL analyst. Your job is to convert natural language questions into SQL queries.

${schemaDescription}

IMPORTANT RULES:
1. Only generate SELECT queries - never INSERT, UPDATE, DELETE, or DROP
2. Always use the exact column and table names from the schema
3. For date filtering, the data covers October 2024 - December 2024
4. Format amounts in a readable way (the amounts are in INR)
5. If the question is ambiguous, make reasonable assumptions and explain them
6. If you cannot answer the question with the available data, explain why

Respond with a JSON object containing:
- sql: The SQL query (string)
- explanation: A brief explanation of what the query does (string)
- chartType: Recommended visualization type: "bar", "line", "pie", or "table" (string)
- chartConfig: Object with xKey, yKey, and title for the chart

Example response:
{
  "sql": "SELECT category, SUM(amount) as total_amount FROM vendor_spend GROUP BY category ORDER BY total_amount DESC",
  "explanation": "This query calculates the total spending by category, sorted from highest to lowest.",
  "chartType": "bar",
  "chartConfig": {
    "xKey": "category",
    "yKey": "total_amount",
    "title": "Spending by Category"
  }
}`;

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: question },
  ];

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsed = JSON.parse(content) as QueryGenerationResult;
    return parsed;
  } catch {
    throw new Error('Failed to parse OpenAI response as JSON');
  }
}

export async function generateAnswerFromData(
  question: string,
  sql: string,
  data: Record<string, unknown>[],
  explanation: string
): Promise<string> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized');
  }

  const dataPreview = data.slice(0, 20); // Limit data for context

  const prompt = `Based on the following SQL query and its results, provide a clear, concise answer to the user's question.

User Question: ${question}

SQL Query: ${sql}

Query Explanation: ${explanation}

Data Results (first ${Math.min(data.length, 20)} of ${data.length} rows):
${JSON.stringify(dataPreview, null, 2)}

Provide a natural language summary of the findings. Be specific with numbers and percentages where relevant.
Format amounts in Indian numbering (Lakhs/Crores) where appropriate.
Keep the response concise but informative (2-4 sentences).`;

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content || 'Unable to generate summary.';
}

export async function extractDocumentData(
  imageBase64: string,
  filename: string
): Promise<ExtractedDocument> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized');
  }

  const prompt = `Analyze this document image and extract structured information.

Extract the following fields:
1. Document type (invoice, receipt, contract, or other)
2. Vendor/Company name
3. Invoice/Document number
4. Total amount (in INR)
5. Date
6. Line items (description, quantity, unit price, amount for each item)

For each field, also provide a confidence score (0.0 to 1.0) based on how clearly the information is visible.

Respond with a JSON object in this exact format:
{
  "doc_type": "invoice",
  "vendor_name": "Company Name",
  "vendor_name_confidence": 0.95,
  "invoice_number": "INV-001",
  "invoice_number_confidence": 0.90,
  "amount": 50000,
  "amount_confidence": 0.98,
  "date": "2024-12-15",
  "date_confidence": 0.92,
  "line_items": [
    {
      "description": "Item description",
      "quantity": 1,
      "unit_price": 25000,
      "amount": 25000,
      "confidence": 0.85
    }
  ],
  "overall_confidence": 0.91
}

If a field cannot be extracted, use null for the value and 0.0 for confidence.`;

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsed = JSON.parse(content);

    // Calculate average confidence
    const confidenceValues = [
      parsed.vendor_name_confidence || 0,
      parsed.invoice_number_confidence || 0,
      parsed.amount_confidence || 0,
      parsed.date_confidence || 0,
    ];
    const avgConfidence = parsed.overall_confidence ||
      confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;

    const lineItems: LineItem[] = (parsed.line_items || []).map((item: {
      description?: string;
      quantity?: number;
      unit_price?: number;
      amount?: number;
      confidence?: number;
    }) => ({
      description: item.description || 'Unknown item',
      quantity: item.quantity || 1,
      unitPrice: item.unit_price || 0,
      amount: item.amount || 0,
      confidence: item.confidence || 0.5,
    }));

    const extractedDoc: ExtractedDocument = {
      id: crypto.randomUUID(),
      docType: parsed.doc_type || 'other',
      vendorName: parsed.vendor_name || 'Unknown Vendor',
      invoiceNumber: parsed.invoice_number || '',
      amount: parsed.amount || 0,
      date: parsed.date || new Date().toISOString().split('T')[0],
      lineItems,
      confidenceScore: avgConfidence,
      extractedAt: new Date(),
      sourceFilename: filename,
      status: 'pending',
    };

    return extractedDoc;
  } catch {
    throw new Error('Failed to parse extraction results');
  }
}

export async function handleOutOfScopeQuery(question: string): Promise<string> {
  if (!openaiClient) {
    return "I'm unable to process your request. Please ensure your API key is configured correctly.";
  }

  const prompt = `The user asked a question that cannot be answered with the available vendor spend data.

User Question: "${question}"

Available data covers: Vendor spending data from October-December 2024, including categories like IT Services, Marketing, Office Supplies, Travel, Consulting, Cloud Services, Legal, Logistics, HR Services, and Software.

Provide a helpful response that:
1. Acknowledges you cannot answer the specific question
2. Explains what data IS available
3. Suggests a related question they could ask instead

Keep the response concise and helpful.`;

  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content || "I'm sorry, I cannot answer that question with the available data.";
}
