// Chat & Analytics Types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sqlQuery?: string;
  data?: Record<string, unknown>[];
  chartType?: 'bar' | 'line' | 'pie' | 'table';
  chartConfig?: ChartConfig;
  source?: SourceCitation;
  isLoading?: boolean;
  error?: string;
}

export interface ChartConfig {
  xKey: string;
  yKey: string;
  title?: string;
  colors?: string[];
}

export interface SourceCitation {
  tableName: string;
  rowCount: number;
  dateRange?: string;
  columns?: string[];
}

// Document Extraction Types
export interface ExtractedDocument {
  id: string;
  docType: 'invoice' | 'receipt' | 'contract' | 'other';
  vendorName: string;
  invoiceNumber?: string;
  amount: number;
  date: string;
  lineItems: LineItem[];
  confidenceScore: number;
  extractedAt: Date;
  sourceFilename: string;
  status: 'pending' | 'approved' | 'rejected';
  rawText?: string;
}

export interface LineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  confidence: number;
}

export interface ExtractionField {
  key: string;
  value: string | number;
  confidence: number;
  editable: boolean;
}

// Data Lake Types
export interface VendorSpend {
  id: number;
  vendor_name: string;
  category: string;
  amount: number;
  transaction_date: string;
  department: string;
  payment_status: string;
  invoice_number?: string;
}

// App State Types
export interface AppState {
  apiKey: string | null;
  isApiKeyValid: boolean;
  activeTab: 'chat' | 'documents' | 'explorer';
  messages: Message[];
  extractedDocs: ExtractedDocument[];
  isLoading: boolean;
}

// API Types
export interface QueryResult {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
  sql?: string;
  explanation?: string;
  chartType?: 'bar' | 'line' | 'pie' | 'table';
  chartConfig?: ChartConfig;
}

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedDocument;
  error?: string;
}
