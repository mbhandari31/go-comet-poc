import { useState, useRef, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker - use unpkg CDN which works better with Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface VendorTransaction {
  id: number;
  vendor_name: string;
  category: string;
  amount: number;
  invoice_date: string;
  region: string;
  status: string;
}

interface ExtractedDocument {
  doc_id: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  currency: string;
  line_items: string;
  tax_amount: number;
  subtotal: number;
  confidence: number;
  uploaded_at: string;
  source_file: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  chartType?: string;
  rows?: Record<string, unknown>[];
  rowCount?: number;
  followupHint?: string;
  error?: string;
  isError?: boolean;
}

interface ExtractedFields {
  vendor_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  total_amount?: number;
  currency?: string;
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  tax_amount?: number;
  subtotal?: number;
  confidence?: number;
  notes?: string;
  error?: string;
}

// ─── CG VERIFICATION TYPES ──────────────────────────────────────────────────
interface VerificationField {
  fieldName: string;
  extractedValue: string;
  expectedValue: string;
  status: "match" | "mismatch" | "warning";
  confidence: number;
  source: string;
}

interface IncomingEmail {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  attachmentName: string;
  status: "processing" | "verified" | "pending_review";
  verificationResult?: VerificationResult;
}

interface VerificationResult {
  overallStatus: "approved" | "flagged" | "rejected";
  confidenceScore: number;
  fields: VerificationField[];
  processedAt: string;
}

interface DraftEmail {
  to: string;
  subject: string;
  body: string;
}

// Verified document for storage and analytics
interface VerifiedDocument {
  doc_id: string;
  document_type: string;
  sender_email: string;
  received_at: string;
  verified_at: string;
  overall_status: "approved" | "flagged" | "rejected";
  confidence_score: number;
  container_number?: string;
  consignee?: string;
  shipper?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
  gross_weight?: string;
  hs_code?: string;
  incoterms?: string;
  description_of_goods?: string;
  total_discrepancies: number;
  source_file: string;
  booking_reference: string;
}

// Customer reference data (booking/shipment requirements)
interface CustomerBooking {
  booking_id: string;
  customer_name: string;
  container_number: string;
  consignee: string;
  shipper: string;
  port_of_loading: string;
  port_of_discharge: string;
  gross_weight: string;
  hs_code: string;
  incoterms: string;
  description_of_goods: string;
  etd: string;
  eta: string;
}

// ─── DATASET ─────────────────────────────────────────────────────────────────
const VENDOR_TRANSACTIONS: VendorTransaction[] = [
  { id: 1, vendor_name: "Infosys Ltd", category: "IT", amount: 142000, invoice_date: "2024-01-12", region: "South", status: "paid" },
  { id: 2, vendor_name: "DHL Logistics", category: "Logistics", amount: 38500, invoice_date: "2024-01-18", region: "West", status: "paid" },
  { id: 3, vendor_name: "Dentsu India", category: "Marketing", amount: 95000, invoice_date: "2024-01-25", region: "North", status: "paid" },
  { id: 4, vendor_name: "JLL Facilities", category: "Facilities", amount: 27000, invoice_date: "2024-01-30", region: "South", status: "paid" },
  { id: 5, vendor_name: "Cyient Technologies", category: "IT", amount: 88000, invoice_date: "2024-02-05", region: "East", status: "paid" },
  { id: 6, vendor_name: "Blue Dart", category: "Logistics", amount: 22000, invoice_date: "2024-02-10", region: "West", status: "paid" },
  { id: 7, vendor_name: "Ogilvy & Mather", category: "Marketing", amount: 110000, invoice_date: "2024-02-14", region: "North", status: "paid" },
  { id: 8, vendor_name: "AZB Legal", category: "Legal", amount: 65000, invoice_date: "2024-02-20", region: "South", status: "paid" },
  { id: 9, vendor_name: "Infosys Ltd", category: "IT", amount: 155000, invoice_date: "2024-03-08", region: "South", status: "paid" },
  { id: 10, vendor_name: "CBRE Facilities", category: "Facilities", amount: 31000, invoice_date: "2024-03-15", region: "North", status: "paid" },
  { id: 11, vendor_name: "Flipkart B2B", category: "Logistics", amount: 18000, invoice_date: "2024-03-22", region: "East", status: "paid" },
  { id: 12, vendor_name: "Dentsu India", category: "Marketing", amount: 87000, invoice_date: "2024-03-28", region: "North", status: "paid" },
  { id: 13, vendor_name: "Wipro IT", category: "IT", amount: 210000, invoice_date: "2024-04-03", region: "West", status: "paid" },
  { id: 14, vendor_name: "DHL Logistics", category: "Logistics", amount: 44000, invoice_date: "2024-04-11", region: "West", status: "paid" },
  { id: 15, vendor_name: "Khaitan & Co", category: "Legal", amount: 78000, invoice_date: "2024-04-18", region: "South", status: "paid" },
  { id: 16, vendor_name: "JLL Facilities", category: "Facilities", amount: 29500, invoice_date: "2024-04-25", region: "South", status: "paid" },
  { id: 17, vendor_name: "Cyient Technologies", category: "IT", amount: 95000, invoice_date: "2024-05-02", region: "East", status: "paid" },
  { id: 18, vendor_name: "McCann Worldgroup", category: "Marketing", amount: 125000, invoice_date: "2024-05-09", region: "North", status: "paid" },
  { id: 19, vendor_name: "Blue Dart", category: "Logistics", amount: 19500, invoice_date: "2024-05-16", region: "West", status: "paid" },
  { id: 20, vendor_name: "CBRE Facilities", category: "Facilities", amount: 34000, invoice_date: "2024-05-23", region: "North", status: "paid" },
  { id: 21, vendor_name: "Infosys Ltd", category: "IT", amount: 168000, invoice_date: "2024-06-04", region: "South", status: "paid" },
  { id: 22, vendor_name: "AZB Legal", category: "Legal", amount: 52000, invoice_date: "2024-06-12", region: "South", status: "paid" },
  { id: 23, vendor_name: "Dentsu India", category: "Marketing", amount: 93000, invoice_date: "2024-06-19", region: "North", status: "paid" },
  { id: 24, vendor_name: "DHL Logistics", category: "Logistics", amount: 51000, invoice_date: "2024-06-27", region: "West", status: "pending" },
  { id: 25, vendor_name: "Wipro IT", category: "IT", amount: 198000, invoice_date: "2024-07-05", region: "West", status: "paid" },
  { id: 26, vendor_name: "JLL Facilities", category: "Facilities", amount: 26000, invoice_date: "2024-07-11", region: "South", status: "paid" },
  { id: 27, vendor_name: "McCann Worldgroup", category: "Marketing", amount: 108000, invoice_date: "2024-07-18", region: "North", status: "paid" },
  { id: 28, vendor_name: "Flipkart B2B", category: "Logistics", amount: 23000, invoice_date: "2024-07-25", region: "East", status: "paid" },
  { id: 29, vendor_name: "Cyient Technologies", category: "IT", amount: 112000, invoice_date: "2024-08-02", region: "East", status: "paid" },
  { id: 30, vendor_name: "Khaitan & Co", category: "Legal", amount: 91000, invoice_date: "2024-08-09", region: "South", status: "paid" },
  { id: 31, vendor_name: "CBRE Facilities", category: "Facilities", amount: 38500, invoice_date: "2024-08-16", region: "North", status: "paid" },
  { id: 32, vendor_name: "Infosys Ltd", category: "IT", amount: 175000, invoice_date: "2024-09-03", region: "South", status: "paid" },
  { id: 33, vendor_name: "Ogilvy & Mather", category: "Marketing", amount: 135000, invoice_date: "2024-09-10", region: "North", status: "paid" },
  { id: 34, vendor_name: "Blue Dart", category: "Logistics", amount: 28000, invoice_date: "2024-09-19", region: "West", status: "paid" },
  { id: 35, vendor_name: "AZB Legal", category: "Legal", amount: 44000, invoice_date: "2024-09-26", region: "South", status: "pending" },
  { id: 36, vendor_name: "Wipro IT", category: "IT", amount: 220000, invoice_date: "2024-10-04", region: "West", status: "paid" },
  { id: 37, vendor_name: "DHL Logistics", category: "Logistics", amount: 47000, invoice_date: "2024-10-11", region: "West", status: "paid" },
  { id: 38, vendor_name: "JLL Facilities", category: "Facilities", amount: 32000, invoice_date: "2024-10-18", region: "South", status: "paid" },
  { id: 39, vendor_name: "Dentsu India", category: "Marketing", amount: 102000, invoice_date: "2024-10-25", region: "North", status: "paid" },
  { id: 40, vendor_name: "Cyient Technologies", category: "IT", amount: 128000, invoice_date: "2024-11-01", region: "East", status: "paid" },
  { id: 41, vendor_name: "McCann Worldgroup", category: "Marketing", amount: 119000, invoice_date: "2024-11-08", region: "North", status: "paid" },
  { id: 42, vendor_name: "Khaitan & Co", category: "Legal", amount: 83000, invoice_date: "2024-11-15", region: "South", status: "paid" },
  { id: 43, vendor_name: "CBRE Facilities", category: "Facilities", amount: 41000, invoice_date: "2024-11-22", region: "North", status: "paid" },
  { id: 44, vendor_name: "Infosys Ltd", category: "IT", amount: 190000, invoice_date: "2024-12-03", region: "South", status: "paid" },
  { id: 45, vendor_name: "Blue Dart", category: "Logistics", amount: 31000, invoice_date: "2024-12-10", region: "West", status: "pending" },
  { id: 46, vendor_name: "Ogilvy & Mather", category: "Marketing", amount: 145000, invoice_date: "2024-12-17", region: "North", status: "paid" },
  { id: 47, vendor_name: "AZB Legal", category: "Legal", amount: 58000, invoice_date: "2024-12-20", region: "South", status: "paid" },
  { id: 48, vendor_name: "Wipro IT", category: "IT", amount: 235000, invoice_date: "2024-12-27", region: "West", status: "paid" },
];

// ─── SQL ENGINE ───────────────────────────────────────────────────────────────
function runSQL(
  sql: string,
  vendorData: VendorTransaction[],
  extractedDocs: ExtractedDocument[],
  verifiedDocs: VerifiedDocument[] = []
): { rows: Record<string, unknown>[]; rowCount: number; error: string | null } {
  try {
    const s = sql.trim().toLowerCase();
    const useVendor = s.includes("vendor_transactions");
    const useDocs = s.includes("extracted_documents");
    const useVerified = s.includes("verified_documents");
    let rows: Record<string, unknown>[] = [];

    if (useVerified && !useVendor && !useDocs) {
      // Query only verified_documents
      rows = verifiedDocs.map((r) => ({ ...r }));
    } else if (useVendor && !useDocs && !useVerified) {
      rows = vendorData.map((r) => ({ ...r }));
    } else if (useDocs && !useVendor && !useVerified) {
      rows = extractedDocs.map((r) => ({ ...r }));
    } else if (useVendor && useDocs) {
      rows = vendorData.map((v) => {
        const match = extractedDocs.find(
          (d) =>
            d.vendor_name &&
            v.vendor_name &&
            (d.vendor_name.toLowerCase().includes(v.vendor_name.split(" ")[0].toLowerCase()) ||
              v.vendor_name.toLowerCase().includes((d.vendor_name || "").split(" ")[0].toLowerCase()))
        );
        return {
          ...v,
          doc_amount: match ? match.total_amount : null,
          doc_date: match ? match.invoice_date : null,
          in_documents: match ? "Yes" : "No",
        };
      });
      if (s.includes("where") && s.includes("in_documents"))
        rows = rows.filter((r) => r.in_documents === "Yes");
    } else if (useVerified) {
      // If verified_documents is queried with other tables, return verified docs
      rows = verifiedDocs.map((r) => ({ ...r }));
    } else {
      rows = vendorData.map((r) => ({ ...r }));
    }

    if (s.includes("where")) {
      const wherePart = s.split("where")[1].split(/(group by|order by|limit|having)/)[0];
      const catMatch = wherePart.match(/category\s*=\s*'([^']+)'/);
      if (catMatch) rows = rows.filter((r) => ((r.category as string) || "").toLowerCase() === catMatch[1].toLowerCase());
      const regMatch = wherePart.match(/region\s*=\s*'([^']+)'/);
      if (regMatch) rows = rows.filter((r) => ((r.region as string) || "").toLowerCase() === regMatch[1].toLowerCase());
      const venMatch = wherePart.match(/vendor_name\s*(like|=)\s*'([^']+)'/);
      if (venMatch) {
        const v = venMatch[2].replace(/%/g, "");
        rows = rows.filter((r) => ((r.vendor_name as string) || "").toLowerCase().includes(v.toLowerCase()));
      }
      const stMatch = wherePart.match(/status\s*=\s*'([^']+)'/);
      if (stMatch) rows = rows.filter((r) => ((r.status as string) || "").toLowerCase() === stMatch[1].toLowerCase());
      if (wherePart.includes("q1"))
        rows = rows.filter((r) => {
          const m = new Date(r.invoice_date as string).getMonth();
          return m >= 0 && m <= 2;
        });
      else if (wherePart.includes("q2") || (wherePart.includes("04") && wherePart.includes("06")))
        rows = rows.filter((r) => {
          const m = new Date(r.invoice_date as string).getMonth();
          return m >= 3 && m <= 5;
        });
      else if (wherePart.includes("q3") || (wherePart.includes("07") && wherePart.includes("09")))
        rows = rows.filter((r) => {
          const m = new Date(r.invoice_date as string).getMonth();
          return m >= 6 && m <= 8;
        });
      else if (wherePart.includes("q4") || (wherePart.includes("10") && wherePart.includes("12")))
        rows = rows.filter((r) => {
          const m = new Date(r.invoice_date as string).getMonth();
          return m >= 9 && m <= 11;
        });
      const monthMatch = wherePart.match(/month[^=]*=\s*(\d+)/);
      if (monthMatch) {
        const mo = parseInt(monthMatch[1]) - 1;
        rows = rows.filter((r) => new Date(r.invoice_date as string).getMonth() === mo);
      }
      if (wherePart.includes("2024"))
        rows = rows.filter((r) => r.invoice_date && (r.invoice_date as string).startsWith("2024"));
      const amtGt = wherePart.match(/amount\s*>\s*(\d+)/);
      if (amtGt) rows = rows.filter((r) => ((r.amount as number) || 0) > parseInt(amtGt[1]));
      const amtLt = wherePart.match(/amount\s*<\s*(\d+)/);
      if (amtLt) rows = rows.filter((r) => ((r.amount as number) || 0) < parseInt(amtLt[1]));
      // verified_documents filters
      const overallStatusMatch = wherePart.match(/overall_status\s*=\s*'([^']+)'/);
      if (overallStatusMatch) rows = rows.filter((r) => ((r.overall_status as string) || "").toLowerCase() === overallStatusMatch[1].toLowerCase());
      const containerMatch = wherePart.match(/container_number\s*(like|=)\s*'([^']+)'/);
      if (containerMatch) {
        const c = containerMatch[2].replace(/%/g, "");
        rows = rows.filter((r) => ((r.container_number as string) || "").toLowerCase().includes(c.toLowerCase()));
      }
      const consigneeMatch = wherePart.match(/consignee\s*(like|=)\s*'([^']+)'/);
      if (consigneeMatch) {
        const c = consigneeMatch[2].replace(/%/g, "");
        rows = rows.filter((r) => ((r.consignee as string) || "").toLowerCase().includes(c.toLowerCase()));
      }
    }

    if (s.includes("group by")) {
      const groupMatch = s.match(/group by\s+(\w+)/);
      if (groupMatch) {
        const groupCol = groupMatch[1];
        const grouped: Record<string, { [key: string]: unknown; total_amount: number; count: number }> = {};
        rows.forEach((r) => {
          let key = (r[groupCol] as string) || "Unknown";
          if (s.includes("strftime") && s.includes("month"))
            key = new Date(r.invoice_date as string).toLocaleString("default", { month: "short", year: "numeric" });
          else if (s.includes("quarter") || groupCol === "quarter") {
            const m = new Date(r.invoice_date as string).getMonth();
            key = `Q${Math.floor(m / 3) + 1} 2024`;
          }
          if (!grouped[key]) grouped[key] = { [groupCol]: key, total_amount: 0, count: 0 };
          grouped[key].total_amount += ((r.amount as number) || (r.total_amount as number) || 0);
          grouped[key].count += 1;
        });
        rows = Object.values(grouped).map((g) => ({
          ...g,
          avg_amount: Math.round(g.total_amount / g.count),
        }));
      }
    }

    if (s.includes("order by")) {
      const ordMatch = s.match(/order by\s+(\w+)\s*(desc|asc)?/);
      if (ordMatch) {
        const col = ordMatch[1];
        const desc = ordMatch[2] === "desc";
        rows.sort((a, b) => (desc ? ((b[col] as number) || 0) - ((a[col] as number) || 0) : ((a[col] as number) || 0) - ((b[col] as number) || 0)));
      }
    }

    const limMatch = s.match(/limit\s+(\d+)/);
    if (limMatch) rows = rows.slice(0, parseInt(limMatch[1]));

    const sumMatch = s.match(/sum\((\w+)\)\s*(?:as\s+(\w+))?/);
    if (sumMatch && !s.includes("group by")) {
      const col = sumMatch[1];
      const alias = sumMatch[2] || "total_" + col;
      rows = [{ [alias]: rows.reduce((sum, r) => sum + ((r[col] as number) || 0), 0) }];
    }

    return { rows, rowCount: rows.length, error: null };
  } catch (e) {
    return { rows: [], rowCount: 0, error: (e as Error).message };
  }
}

// ─── CHART ────────────────────────────────────────────────────────────────────
const COLORS = ["#1A6FE8", "#00B8A9", "#F6A623", "#E84040", "#8B5CF6", "#06B6D4", "#F97316"];
const fmt = (v: unknown) => (typeof v === "number" ? (v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : v) : v);
const ttStyle = {
  background: "#fff",
  border: "1px solid #E5E9F0",
  borderRadius: 8,
  fontSize: 12,
  color: "#1A1F36",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

function SmartChart({ data, chartType }: { data: Record<string, unknown>[]; chartType: string }) {
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  const labelKey = keys.find((k) => typeof data[0][k] === "string") || keys[0];
  const valueKeys = keys.filter((k) => typeof data[0][k] === "number");
  if (!valueKeys.length) return null;

  if (chartType === "pie")
    return (
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKeys[0]}
            nameKey={labelKey}
            cx="50%"
            cy="50%"
            outerRadius={95}
            label={({ name, percent }: { name?: string; percent?: number }) => `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} contentStyle={ttStyle} />
        </PieChart>
      </ResponsiveContainer>
    );
  if (chartType === "line")
    return (
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F7" />
          <XAxis dataKey={labelKey} tick={{ fill: "#8D9BB5", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8D9BB5", fontSize: 11 }} tickFormatter={fmt as (value: number) => string} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} contentStyle={ttStyle} />
          {valueKeys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i]} strokeWidth={2.5} dot={{ fill: COLORS[i], r: 3, strokeWidth: 0 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F7" vertical={false} />
        <XAxis dataKey={labelKey} tick={{ fill: "#8D9BB5", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#8D9BB5", fontSize: 11 }} tickFormatter={fmt as (value: number) => string} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} contentStyle={ttStyle} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#8D9BB5" }} />
        {valueKeys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={COLORS[i]} radius={[4, 4, 0, 0]} maxBarSize={48} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");
  const [extractedDocs, setExtractedDocs] = useState<ExtractedDocument[]>([]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedFields, setExtractedFields] = useState<ExtractedFields | null>(null);
  const [docStored, setDocStored] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  // CG Verification states
  const [verificationView, setVerificationView] = useState<"inbox" | "result" | "discrepancy" | "draft">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<IncomingEmail | null>(null);
  const [selectedField, setSelectedField] = useState<VerificationField | null>(null);
  const [draftEmail, setDraftEmail] = useState<DraftEmail | null>(null);
  const [incomingEmails, setIncomingEmails] = useState<IncomingEmail[]>([]);
  const [verifiedDocuments, setVerifiedDocuments] = useState<VerifiedDocument[]>([]);
  const [cgUploading, setCgUploading] = useState(false);

  // Customer booking reference data (simulates data from booking system)
  const CUSTOMER_BOOKINGS: CustomerBooking[] = [
    {
      booking_id: "BK-2024-1847",
      customer_name: "Global Imports Inc",
      container_number: "MSKU7234521",
      consignee: "Global Imports Inc",
      shipper: "Acme Industries Ltd",
      port_of_loading: "Shanghai, China",
      port_of_discharge: "Long Beach, US",
      gross_weight: "18,500 KG",
      hs_code: "8471.30",
      incoterms: "CIF",
      description_of_goods: "Electronic Components - Computer Parts",
      etd: "2024-12-30",
      eta: "2025-01-15",
    },
    {
      booking_id: "BK-2024-1923",
      customer_name: "TechParts Manufacturing",
      container_number: "COSU4512876",
      consignee: "TechParts Manufacturing",
      shipper: "Shenzhen Electronics Co",
      port_of_loading: "Shenzhen, China",
      port_of_discharge: "Los Angeles, US",
      gross_weight: "22,000 KG",
      hs_code: "8542.31",
      incoterms: "FOB",
      description_of_goods: "Integrated Circuits and Semiconductors",
      etd: "2025-01-05",
      eta: "2025-01-20",
    },
  ];

  // Mock data for CG Verification demo (initial examples)
  const mockIncomingEmails: IncomingEmail[] = [
    {
      id: "email_001",
      from: "shipping@maersk.com",
      subject: "Bill of Lading - Container MSKU7234521",
      receivedAt: "2024-12-28T09:45:00Z",
      attachmentName: "BL_MSKU7234521.pdf",
      status: "verified",
      verificationResult: {
        overallStatus: "flagged",
        confidenceScore: 0.78,
        processedAt: "2024-12-28T09:46:12Z",
        fields: [
          { fieldName: "Container Number", extractedValue: "MSKU7234521", expectedValue: "MSKU7234521", status: "match", confidence: 0.99, source: "Booking #BK-2024-1847" },
          { fieldName: "Shipper Name", extractedValue: "Acme Industries Ltd", expectedValue: "Acme Industries Ltd.", status: "match", confidence: 0.95, source: "Booking #BK-2024-1847" },
          { fieldName: "Consignee", extractedValue: "Global Imports Inc", expectedValue: "Global Imports Inc", status: "match", confidence: 0.98, source: "Booking #BK-2024-1847" },
          { fieldName: "Port of Loading", extractedValue: "Shanghai, CN", expectedValue: "Shanghai, China", status: "match", confidence: 0.92, source: "Booking #BK-2024-1847" },
          { fieldName: "Port of Discharge", extractedValue: "Los Angeles, US", expectedValue: "Long Beach, US", status: "mismatch", confidence: 0.88, source: "Booking #BK-2024-1847" },
          { fieldName: "Gross Weight", extractedValue: "18,450 KG", expectedValue: "18,500 KG", status: "warning", confidence: 0.75, source: "Booking #BK-2024-1847" },
          { fieldName: "ETD", extractedValue: "2024-12-30", expectedValue: "2024-12-30", status: "match", confidence: 0.97, source: "Booking #BK-2024-1847" },
          { fieldName: "ETA", extractedValue: "2025-01-15", expectedValue: "2025-01-15", status: "match", confidence: 0.97, source: "Booking #BK-2024-1847" },
        ],
      },
    },
    {
      id: "email_002",
      from: "docs@evergreen-line.com",
      subject: "Commercial Invoice - Shipment EG-78432",
      receivedAt: "2024-12-28T08:30:00Z",
      attachmentName: "Invoice_EG78432.pdf",
      status: "pending_review",
      verificationResult: {
        overallStatus: "approved",
        confidenceScore: 0.96,
        processedAt: "2024-12-28T08:31:45Z",
        fields: [
          { fieldName: "Invoice Number", extractedValue: "INV-2024-78432", expectedValue: "INV-2024-78432", status: "match", confidence: 0.99, source: "PO #PO-2024-5521" },
          { fieldName: "Vendor Name", extractedValue: "TechParts Manufacturing", expectedValue: "TechParts Manufacturing", status: "match", confidence: 0.98, source: "PO #PO-2024-5521" },
          { fieldName: "Total Amount", extractedValue: "$45,280.00", expectedValue: "$45,280.00", status: "match", confidence: 0.99, source: "PO #PO-2024-5521" },
          { fieldName: "Currency", extractedValue: "USD", expectedValue: "USD", status: "match", confidence: 0.99, source: "PO #PO-2024-5521" },
          { fieldName: "Payment Terms", extractedValue: "Net 30", expectedValue: "Net 30", status: "match", confidence: 0.95, source: "PO #PO-2024-5521" },
        ],
      },
    },
    {
      id: "email_003",
      from: "operations@cosco.com",
      subject: "Packing List - Container COSU4512876",
      receivedAt: "2024-12-28T07:15:00Z",
      attachmentName: "PackingList_COSU4512876.pdf",
      status: "processing",
    },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const SCHEMA = `Tables:
1. vendor_transactions(id, vendor_name, category, amount, invoice_date, region, status)
   - category: 'IT','Logistics','Marketing','Facilities','Legal'
   - region: 'North','South','East','West'
   - status: 'paid','pending'
   - 48 rows, date range: 2024-01-01 to 2024-12-31
2. extracted_documents(doc_id, vendor_name, invoice_date, total_amount, line_items, confidence, uploaded_at)
   - ${extractedDocs.length} row(s) currently${extractedDocs.length > 0 ? ": " + extractedDocs.map((d) => d.vendor_name).join(", ") : ""}
3. verified_documents(doc_id, document_type, sender_email, received_at, verified_at, overall_status, confidence_score, container_number, consignee, shipper, port_of_loading, port_of_discharge, gross_weight, hs_code, incoterms, description_of_goods, total_discrepancies, source_file, booking_reference)
   - overall_status: 'approved','flagged','rejected'
   - ${verifiedDocuments.length} row(s) currently${verifiedDocuments.length > 0 ? ": " + verifiedDocuments.map((d) => d.container_number || d.consignee).join(", ") : ""}`;

  async function askAI(question: string, history: Message[]) {
    const sys = `You are a precise data analyst. Answer questions about vendor procurement data.
${SCHEMA}
Return ONLY valid JSON (no markdown): {"sql":"...","answer":"...","chart_type":"bar|line|pie|table","followup_hint":"..."}
- sql: valid SQLite using only schema columns above
- answer: 1-2 sentence plain English summary
- chart_type: bar=categories, line=time series, pie=proportions, table=detail
- followup_hint: one short suggested follow-up
- For quarters: CASE WHEN strftime('%m',invoice_date) IN ('01','02','03') THEN 'Q1 2024' WHEN strftime('%m',invoice_date) IN ('04','05','06') THEN 'Q2 2024' WHEN strftime('%m',invoice_date) IN ('07','08','09') THEN 'Q3 2024' ELSE 'Q4 2024' END as quarter
- If unanswerable: {"sql":"","answer":"I cannot answer this from the available data — [reason]","chart_type":"table","followup_hint":""}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1000,
        messages: [
          { role: "system", content: sys },
          ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: question },
        ],
      }),
    });
    const d = await res.json();
    console.log("API Response:", d);
    if (d.error) throw new Error(d.error.message);
    return JSON.parse(
      d.choices[0].message.content
        .trim()
        .replace(/```json|```/g, "")
        .trim()
    );
  }

  async function handleAsk() {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: q, id: Date.now() }]);
    try {
      const result = await askAI(q, messages);
      let qr = { rows: [] as Record<string, unknown>[], rowCount: 0, error: null as string | null };
      if (result.sql?.trim()) qr = runSQL(result.sql, VENDOR_TRANSACTIONS, extractedDocs, verifiedDocuments);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          id: Date.now() + 1,
          sql: result.sql,
          chartType: result.chart_type,
          rows: qr.rows,
          rowCount: qr.rowCount,
          followupHint: result.followup_hint,
          error: qr.error || undefined,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${(e as Error).message}`, id: Date.now() + 1, isError: true }]);
    }
    setLoading(false);
  }

  // Convert PDF to images using PDF.js
  async function pdfToImages(file: File): Promise<string[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    // Convert first 3 pages max (to avoid token limits)
    const maxPages = Math.min(pdf.numPages, 3);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const scale = 2; // Higher scale for better quality
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;

      // Convert canvas to base64 PNG
      const imageData = canvas.toDataURL("image/png");
      images.push(imageData);
    }

    return images;
  }

  // ─── CG VERIFICATION AGENT FUNCTIONS ────────────────────────────────────────

  // Extract trade document fields using vision AI
  async function extractTradeDocument(file: File): Promise<Record<string, { value: string; confidence: number }>> {
    const isImg = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    const extractPrompt = `Extract structured data from this trade/shipping document (Bill of Lading, Commercial Invoice, Packing List, etc.).
Return ONLY valid JSON with confidence scores (0.0-1.0) for each field:
{
  "document_type": {"value": "Bill of Lading|Commercial Invoice|Packing List|Certificate of Origin|Other", "confidence": 0.0},
  "container_number": {"value": "", "confidence": 0.0},
  "consignee": {"value": "", "confidence": 0.0},
  "shipper": {"value": "", "confidence": 0.0},
  "port_of_loading": {"value": "", "confidence": 0.0},
  "port_of_discharge": {"value": "", "confidence": 0.0},
  "gross_weight": {"value": "", "confidence": 0.0},
  "hs_code": {"value": "", "confidence": 0.0},
  "incoterms": {"value": "", "confidence": 0.0},
  "description_of_goods": {"value": "", "confidence": 0.0},
  "etd": {"value": "YYYY-MM-DD or empty", "confidence": 0.0},
  "eta": {"value": "YYYY-MM-DD or empty", "confidence": 0.0},
  "invoice_number": {"value": "", "confidence": 0.0},
  "total_amount": {"value": "", "confidence": 0.0}
}
For any field not found, use empty string and confidence 0. Be conservative with confidence - only use >0.9 if clearly legible.`;

    let content: Array<{ type: string; image_url?: { url: string }; text?: string }> = [];

    if (isImg) {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      content = [
        { type: "image_url", image_url: { url: base64 } },
        { type: "text", text: extractPrompt },
      ];
    } else if (isPdf) {
      const images = await pdfToImages(file);
      for (const img of images) {
        content.push({ type: "image_url", image_url: { url: img } });
      }
      content.push({ type: "text", text: extractPrompt });
    } else {
      throw new Error("Unsupported file type");
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1500,
        messages: [{ role: "user", content }],
      }),
    });

    const d = await res.json();
    if (d.error) throw new Error(d.error.message);

    return JSON.parse(
      d.choices[0].message.content
        .trim()
        .replace(/```json|```/g, "")
        .trim()
    );
  }

  // Compare extracted fields against customer booking requirements
  function compareWithBooking(
    extracted: Record<string, { value: string; confidence: number }>,
    booking: CustomerBooking
  ): VerificationField[] {
    const fields: VerificationField[] = [];
    const bookingRef = `Booking #${booking.booking_id}`;

    const fieldMappings: Array<{ fieldName: string; extractedKey: string; expectedKey: keyof CustomerBooking }> = [
      { fieldName: "Container Number", extractedKey: "container_number", expectedKey: "container_number" },
      { fieldName: "Consignee", extractedKey: "consignee", expectedKey: "consignee" },
      { fieldName: "Shipper", extractedKey: "shipper", expectedKey: "shipper" },
      { fieldName: "Port of Loading", extractedKey: "port_of_loading", expectedKey: "port_of_loading" },
      { fieldName: "Port of Discharge", extractedKey: "port_of_discharge", expectedKey: "port_of_discharge" },
      { fieldName: "Gross Weight", extractedKey: "gross_weight", expectedKey: "gross_weight" },
      { fieldName: "HS Code", extractedKey: "hs_code", expectedKey: "hs_code" },
      { fieldName: "Incoterms", extractedKey: "incoterms", expectedKey: "incoterms" },
      { fieldName: "Description of Goods", extractedKey: "description_of_goods", expectedKey: "description_of_goods" },
      { fieldName: "ETD", extractedKey: "etd", expectedKey: "etd" },
      { fieldName: "ETA", extractedKey: "eta", expectedKey: "eta" },
    ];

    for (const mapping of fieldMappings) {
      const extractedField = extracted[mapping.extractedKey];
      const extractedValue = extractedField?.value || "";
      const expectedValue = booking[mapping.expectedKey] || "";
      const confidence = extractedField?.confidence || 0;

      let status: "match" | "mismatch" | "warning" = "match";

      if (!extractedValue || confidence < 0.5) {
        // Low confidence or missing - flag as warning (uncertain)
        status = "warning";
      } else {
        // Normalize values for comparison
        const normalizedExtracted = extractedValue.toLowerCase().replace(/[.,\s]+/g, " ").trim();
        const normalizedExpected = expectedValue.toLowerCase().replace(/[.,\s]+/g, " ").trim();

        if (normalizedExtracted === normalizedExpected) {
          status = "match";
        } else if (
          normalizedExtracted.includes(normalizedExpected.split(" ")[0]) ||
          normalizedExpected.includes(normalizedExtracted.split(" ")[0])
        ) {
          // Partial match - might be formatting difference
          status = confidence >= 0.85 ? "match" : "warning";
        } else {
          status = "mismatch";
        }
      }

      fields.push({
        fieldName: mapping.fieldName,
        extractedValue: extractedValue || "(not found)",
        expectedValue,
        status,
        confidence,
        source: bookingRef,
      });
    }

    return fields;
  }

  // Find matching booking based on extracted container number or other identifiers
  function findMatchingBooking(extracted: Record<string, { value: string; confidence: number }>): CustomerBooking | null {
    const containerNum = extracted.container_number?.value;
    const consignee = extracted.consignee?.value;

    // Try to match by container number first
    if (containerNum) {
      const match = CUSTOMER_BOOKINGS.find(
        (b) => b.container_number.toLowerCase() === containerNum.toLowerCase()
      );
      if (match) return match;
    }

    // Try to match by consignee name
    if (consignee) {
      const match = CUSTOMER_BOOKINGS.find((b) =>
        b.consignee.toLowerCase().includes(consignee.toLowerCase().split(" ")[0]) ||
        consignee.toLowerCase().includes(b.consignee.toLowerCase().split(" ")[0])
      );
      if (match) return match;
    }

    // Return first booking as default for demo purposes
    return CUSTOMER_BOOKINGS[0];
  }

  // Process incoming document through the verification agent
  async function processIncomingDocument(file: File, senderEmail: string = "documents@supplier.com") {
    const emailId = `email_${Date.now()}`;
    const newEmail: IncomingEmail = {
      id: emailId,
      from: senderEmail,
      subject: `Document Verification - ${file.name}`,
      receivedAt: new Date().toISOString(),
      attachmentName: file.name,
      status: "processing",
    };

    // Add to inbox immediately as "processing"
    setIncomingEmails((prev) => [newEmail, ...prev]);
    setSelectedEmail(newEmail);
    setVerificationView("inbox");

    try {
      // Step 1: Extract fields from document
      const extracted = await extractTradeDocument(file);
      console.log("Extracted fields:", extracted);

      // Step 2: Find matching booking
      const booking = findMatchingBooking(extracted);
      if (!booking) {
        throw new Error("No matching booking found for this document");
      }

      // Step 3: Compare extracted vs expected
      const verificationFields = compareWithBooking(extracted, booking);

      // Step 4: Calculate overall status and confidence
      const mismatches = verificationFields.filter((f) => f.status === "mismatch").length;
      const warnings = verificationFields.filter((f) => f.status === "warning").length;
      const avgConfidence =
        verificationFields.reduce((sum, f) => sum + f.confidence, 0) / verificationFields.length;

      let overallStatus: "approved" | "flagged" | "rejected" = "approved";
      if (mismatches > 0) {
        overallStatus = mismatches >= 3 ? "rejected" : "flagged";
      } else if (warnings > 2 || avgConfidence < 0.7) {
        overallStatus = "flagged";
      }

      const verificationResult: VerificationResult = {
        overallStatus,
        confidenceScore: avgConfidence,
        fields: verificationFields,
        processedAt: new Date().toISOString(),
      };

      // Update email with verification result
      const updatedEmail: IncomingEmail = {
        ...newEmail,
        status: overallStatus === "approved" ? "pending_review" : "verified",
        verificationResult,
      };

      setIncomingEmails((prev) =>
        prev.map((e) => (e.id === emailId ? updatedEmail : e))
      );
      setSelectedEmail(updatedEmail);
      setVerificationView("result");
    } catch (error) {
      console.error("Verification error:", error);
      // Update email to show error state
      setIncomingEmails((prev) =>
        prev.map((e) =>
          e.id === emailId
            ? {
                ...e,
                status: "verified",
                verificationResult: {
                  overallStatus: "rejected",
                  confidenceScore: 0,
                  fields: [],
                  processedAt: new Date().toISOString(),
                },
              }
            : e
        )
      );
    }
  }

  // Store verified document for analytics
  function storeVerifiedDocument(email: IncomingEmail) {
    if (!email.verificationResult) return;

    const doc: VerifiedDocument = {
      doc_id: `vdoc_${Date.now()}`,
      document_type: email.verificationResult.fields.find((f) => f.fieldName === "Document Type")?.extractedValue || "Trade Document",
      sender_email: email.from,
      received_at: email.receivedAt,
      verified_at: email.verificationResult.processedAt,
      overall_status: email.verificationResult.overallStatus,
      confidence_score: email.verificationResult.confidenceScore,
      container_number: email.verificationResult.fields.find((f) => f.fieldName === "Container Number")?.extractedValue,
      consignee: email.verificationResult.fields.find((f) => f.fieldName === "Consignee")?.extractedValue,
      shipper: email.verificationResult.fields.find((f) => f.fieldName === "Shipper")?.extractedValue,
      port_of_loading: email.verificationResult.fields.find((f) => f.fieldName === "Port of Loading")?.extractedValue,
      port_of_discharge: email.verificationResult.fields.find((f) => f.fieldName === "Port of Discharge")?.extractedValue,
      gross_weight: email.verificationResult.fields.find((f) => f.fieldName === "Gross Weight")?.extractedValue,
      hs_code: email.verificationResult.fields.find((f) => f.fieldName === "HS Code")?.extractedValue,
      incoterms: email.verificationResult.fields.find((f) => f.fieldName === "Incoterms")?.extractedValue,
      description_of_goods: email.verificationResult.fields.find((f) => f.fieldName === "Description of Goods")?.extractedValue,
      total_discrepancies: email.verificationResult.fields.filter((f) => f.status !== "match").length,
      source_file: email.attachmentName,
      booking_reference: email.verificationResult.fields[0]?.source || "",
    };

    setVerifiedDocuments((prev) => [...prev, doc]);
    return doc;
  }

  async function handleExtract(file: File) {
    setExtracting(true);
    setExtractedFields(null);
    setDocStored(false);
    try {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      const extractPrompt = `Extract structured data from this invoice/document. Return ONLY valid JSON (no markdown): {"vendor_name":"","invoice_number":"","invoice_date":"YYYY-MM-DD","due_date":null,"total_amount":0,"currency":"INR","line_items":[{"description":"","quantity":1,"unit_price":0,"amount":0}],"tax_amount":0,"subtotal":0,"confidence":0.0,"notes":""}`;

      let content: Array<{ type: string; image_url?: { url: string }; text?: string }> = [];

      if (isImg) {
        // Handle image files directly
        const base64 = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        content = [
          { type: "image_url", image_url: { url: base64 } },
          { type: "text", text: extractPrompt },
        ];
      } else if (isPdf) {
        // Convert PDF pages to images
        console.log("Converting PDF to images...");
        const images = await pdfToImages(file);
        console.log(`Converted ${images.length} pages to images`);

        // Add all page images to content
        for (const img of images) {
          content.push({ type: "image_url", image_url: { url: img } });
        }
        content.push({ type: "text", text: extractPrompt });
      } else {
        throw new Error("Unsupported file type. Please upload a PDF or image.");
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          max_tokens: 1500,
          messages: [{ role: "user", content }],
        }),
      });
      const d = await res.json();
      console.log("Extract API Response:", d);
      if (d.error) throw new Error(d.error.message);
      setExtractedFields(
        JSON.parse(
          d.choices[0].message.content
            .trim()
            .replace(/```json|```/g, "")
            .trim()
        )
      );
    } catch (e) {
      console.error("Extraction error:", e);
      setExtractedFields({ error: (e as Error).message });
    }
    setExtracting(false);
  }

  function handleApprove() {
    if (!extractedFields) return;
    const doc: ExtractedDocument = {
      doc_id: `doc_${Date.now()}`,
      vendor_name: extractedFields.vendor_name || "",
      invoice_number: extractedFields.invoice_number || "",
      invoice_date: extractedFields.invoice_date || "",
      total_amount: extractedFields.total_amount || 0,
      currency: extractedFields.currency || "INR",
      line_items: JSON.stringify(extractedFields.line_items || []),
      tax_amount: extractedFields.tax_amount || 0,
      subtotal: extractedFields.subtotal || 0,
      confidence: extractedFields.confidence || 0,
      uploaded_at: new Date().toISOString(),
      source_file: docFile?.name || "document",
    };
    setExtractedDocs((prev) => [...prev, doc]);
    setDocStored(true);
  }

  function handleFileSelect(file: File) {
    if (!file) return;
    setDocFile(file);
    setDocStored(false);
    setExtractedFields(null);
    const reader = new FileReader();
    reader.onload = (e) => setDocPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    handleExtract(file);
  }

  const SUGGESTIONS = [
    "Show total vendor spend by category in 2024",
    "Which vendor had the highest total spend?",
    "Show monthly IT spend trend",
    "Compare spend across regions",
    "Which invoices are still pending?",
    "Top 5 vendors by spend amount",
    ...(verifiedDocuments.length > 0
      ? [
          "Show all verified documents",
          "Which verified documents were flagged?",
          "Show verified documents by port of discharge",
        ]
      : []),
  ];

  // GoComet color palette
  const GC = {
    blue: "#1A6FE8",
    blueDark: "#1458BC",
    blueLight: "#EBF2FD",
    blueMid: "#5A9BEE",
    green: "#00A67E",
    greenLight: "#E6F7F3",
    amber: "#F6A623",
    amberLight: "#FEF6E7",
    red: "#E84040",
    redLight: "#FEF0F0",
    gray50: "#F8F9FC",
    gray100: "#F0F2F7",
    gray200: "#E5E9F0",
    gray400: "#8D9BB5",
    gray600: "#4A5568",
    gray800: "#1A1F36",
    white: "#FFFFFF",
    border: "#E5E9F0",
  };

  const navTabs = [
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "documents", label: "Document Agent", icon: "📄" },
    { id: "crossquery", label: "Cross-Source Query", icon: "🔗" },
    { id: "verification", label: "CG Verification", icon: "✓" },
  ];

  // ── API KEY SCREEN ────────────────────────────────────────────────────────
  if (!apiKeySet)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: GC.gray50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter,system-ui,sans-serif",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;} input:focus,textarea:focus{outline:none;}`}</style>
        <div
          style={{
            width: 460,
            background: GC.white,
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(26,111,232,0.10)",
            overflow: "hidden",
          }}
        >
          <div style={{ background: `linear-gradient(135deg, ${GC.blue}, ${GC.blueDark})`, padding: "32px 36px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                🧠
              </div>
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>GoComet AI</div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>Agentic Analytics + Vision Intelligence</div>
              </div>
            </div>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              A POC demonstrating natural language analytics over a vendor spend data lake, combined with AI-powered invoice extraction.
            </p>
          </div>
          <div style={{ padding: "28px 36px 32px" }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: GC.gray600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              OpenAI API Key
            </label>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apiKey.startsWith("sk-") && setApiKeySet(true)}
              style={{
                width: "100%",
                border: `1.5px solid ${apiKey.startsWith("sk-") ? GC.blue : GC.border}`,
                borderRadius: 8,
                padding: "11px 14px",
                fontSize: 14,
                color: GC.gray800,
                background: GC.gray50,
                transition: "border-color 0.15s",
                marginBottom: 16,
                fontFamily: "Inter,sans-serif",
              }}
            />
            <button
              onClick={() => apiKey.startsWith("sk-") && setApiKeySet(true)}
              disabled={!apiKey.startsWith("sk-")}
              style={{
                width: "100%",
                padding: "12px",
                background: apiKey.startsWith("sk-") ? `linear-gradient(135deg,${GC.blue},${GC.blueDark})` : "#E5E9F0",
                border: "none",
                borderRadius: 8,
                color: apiKey.startsWith("sk-") ? "white" : GC.gray400,
                fontSize: 14,
                fontWeight: 600,
                cursor: apiKey.startsWith("sk-") ? "pointer" : "not-allowed",
                fontFamily: "Inter,sans-serif",
                transition: "all 0.15s",
              }}
            >
              Launch POC →
            </button>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {(
                [
                  ["📊", "Agentic Analytics — NL → SQL → Chart with citations"],
                  ["📄", "Vision Document Extraction — PDF & image to structured data"],
                  ["🔗", "Cross-source Query — Join documents + data lake seamlessly"],
                ] as const
              ).map(([icon, label]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    padding: "8px 0",
                    borderBottom: `1px solid ${GC.border}`,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: GC.gray600, lineHeight: 1.5 }}>{label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: GC.gray400, marginTop: 16, marginBottom: 0, textAlign: "center" }}>
              Key stored in browser memory only. Never shared.
            </p>
          </div>
        </div>
      </div>
    );

  // ── MAIN UI ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: GC.gray50, fontFamily: "Inter,system-ui,sans-serif", color: GC.gray800 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${GC.gray100}; }
        ::-webkit-scrollbar-thumb { background: ${GC.gray200}; border-radius: 4px; }
        input:focus, textarea:focus { outline: none; }
        .gc-btn-primary { background: linear-gradient(135deg,${GC.blue},${GC.blueDark}); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: Inter,sans-serif; transition: opacity 0.15s; }
        .gc-btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .gc-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .gc-chip:hover { background: ${GC.blueLight} !important; color: ${GC.blue} !important; border-color: ${GC.blue} !important; cursor: pointer; }
        .gc-row:hover { background: ${GC.gray50} !important; }
        .gc-tab:hover { color: ${GC.blue} !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.25s ease; }
      `}</style>

      {/* TOP NAV */}
      <div
        style={{
          background: GC.white,
          borderBottom: `1px solid ${GC.border}`,
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo area */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: `linear-gradient(135deg,${GC.blue},${GC.blueDark})`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              🧠
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16, color: GC.gray800, letterSpacing: "-0.3px" }}>GoComet</span>
              <span style={{ fontWeight: 400, fontSize: 16, color: GC.blue }}> AI</span>
              <span
                style={{
                  fontSize: 10,
                  color: GC.gray400,
                  marginLeft: 8,
                  background: GC.gray100,
                  padding: "2px 7px",
                  borderRadius: 10,
                  fontWeight: 500,
                }}
              >
                POC
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {navTabs.map((t) => (
              <button
                key={t.id}
                className="gc-tab"
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "8px 18px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: activeTab === t.id ? 600 : 400,
                  color: activeTab === t.id ? GC.blue : GC.gray400,
                  borderBottom: `2px solid ${activeTab === t.id ? GC.blue : "transparent"}`,
                  fontFamily: "Inter,sans-serif",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Status pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: GC.gray50,
              border: `1px solid ${GC.border}`,
              borderRadius: 20,
              padding: "6px 14px",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: GC.green,
                boxShadow: `0 0 5px ${GC.green}`,
              }}
            ></div>
            <span style={{ fontSize: 12, color: GC.gray600, fontWeight: 500 }}>
              {extractedDocs.length + verifiedDocuments.length} doc{(extractedDocs.length + verifiedDocuments.length) !== 1 ? "s" : ""} stored
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        {/* ══ ANALYTICS TAB ════════════════════════════════════════════════ */}
        {activeTab === "analytics" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, height: "calc(100vh - 108px)" }}>
            {/* Chat */}
            <div
              style={{
                background: GC.white,
                borderRadius: 12,
                border: `1px solid ${GC.border}`,
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${GC.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      background: GC.blueLight,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                    }}
                  >
                    📊
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: GC.gray800 }}>Agentic Analytics</div>
                    <div style={{ fontSize: 11, color: GC.gray400, marginTop: 1 }}>vendor_transactions · 48 rows · FY2024</div>
                  </div>
                </div>
                <button
                  onClick={() => setMessages([])}
                  style={{
                    fontSize: 12,
                    color: GC.gray400,
                    background: "none",
                    border: `1px solid ${GC.border}`,
                    borderRadius: 6,
                    padding: "4px 12px",
                    cursor: "pointer",
                    fontFamily: "Inter,sans-serif",
                  }}
                >
                  Clear
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                {messages.length === 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      gap: 20,
                      paddingBottom: 40,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        background: GC.blueLight,
                        borderRadius: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 28,
                      }}
                    >
                      🧠
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 17, color: GC.gray800, marginBottom: 6 }}>Ask your vendor data</div>
                      <div style={{ fontSize: 13, color: GC.gray400, maxWidth: 340, lineHeight: 1.6 }}>
                        Type a question in plain English. Get SQL, a data table, and an auto-generated chart — with source citations.
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 480 }}>
                      {SUGGESTIONS.map((s, i) => (
                        <span
                          key={i}
                          className="gc-chip"
                          onClick={() => setInput(s)}
                          style={{
                            fontSize: 12,
                            color: GC.gray600,
                            background: GC.gray50,
                            border: `1px solid ${GC.border}`,
                            borderRadius: 20,
                            padding: "6px 14px",
                            transition: "all 0.15s",
                            cursor: "pointer",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="fade-up"
                    style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}
                  >
                    {msg.role === "user" ? (
                      <div
                        style={{
                          maxWidth: "72%",
                          background: `linear-gradient(135deg,${GC.blue},${GC.blueDark})`,
                          borderRadius: "16px 16px 4px 16px",
                          padding: "11px 16px",
                          fontSize: 13,
                          color: "white",
                          lineHeight: 1.5,
                          fontWeight: 500,
                        }}
                      >
                        {msg.content}
                      </div>
                    ) : (
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                        {/* Answer card */}
                        <div
                          style={{
                            background: GC.gray50,
                            border: `1px solid ${GC.border}`,
                            borderRadius: "4px 16px 16px 16px",
                            padding: "13px 16px",
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              background: GC.blueLight,
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            🤖
                          </div>
                          <div style={{ fontSize: 13, lineHeight: 1.6, color: msg.isError ? GC.red : GC.gray800 }}>{msg.content}</div>
                        </div>

                        {/* SQL toggle */}
                        {msg.sql && (
                          <details>
                            <summary
                              style={{
                                fontSize: 12,
                                color: GC.blue,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                listStyle: "none",
                                cursor: "pointer",
                                userSelect: "none",
                                fontWeight: 500,
                              }}
                            >
                              <span
                                style={{
                                  background: GC.blueLight,
                                  color: GC.blue,
                                  borderRadius: 5,
                                  padding: "2px 9px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                SQL
                              </span>
                              View query used ›
                            </summary>
                            <div
                              style={{
                                marginTop: 8,
                                background: "#F6F9FE",
                                border: `1px solid ${GC.border}`,
                                borderRadius: 8,
                                padding: "13px 16px",
                                fontSize: 12,
                                color: "#2B5197",
                                lineHeight: 1.8,
                                whiteSpace: "pre-wrap",
                                fontFamily: "'Fira Code',monospace",
                              }}
                            >
                              {msg.sql}
                            </div>
                          </details>
                        )}

                        {/* Result table */}
                        {msg.rows && msg.rows.length > 0 && (
                          <div style={{ border: `1px solid ${GC.border}`, borderRadius: 10, overflow: "hidden" }}>
                            <div
                              style={{
                                padding: "8px 14px",
                                borderBottom: `1px solid ${GC.border}`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: GC.gray50,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: GC.gray600,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                }}
                              >
                                Result
                              </span>
                              <span style={{ fontSize: 11, color: GC.gray400 }}>
                                {msg.rowCount} row{msg.rowCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div style={{ overflowX: "auto", maxHeight: 180 }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                <thead>
                                  <tr style={{ background: GC.gray50 }}>
                                    {Object.keys(msg.rows[0]).map((k) => (
                                      <th
                                        key={k}
                                        style={{
                                          padding: "7px 14px",
                                          textAlign: "left",
                                          color: GC.gray400,
                                          fontWeight: 600,
                                          borderBottom: `1px solid ${GC.border}`,
                                          whiteSpace: "nowrap",
                                          fontSize: 11,
                                          textTransform: "uppercase",
                                          letterSpacing: "0.04em",
                                        }}
                                      >
                                        {k}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {msg.rows.slice(0, 8).map((row, i) => (
                                    <tr
                                      key={i}
                                      className="gc-row"
                                      style={{ borderBottom: `1px solid ${GC.gray100}`, transition: "background 0.1s" }}
                                    >
                                      {Object.values(row).map((v, j) => (
                                        <td key={j} style={{ padding: "8px 14px", color: GC.gray600, whiteSpace: "nowrap" }}>
                                          {typeof v === "number" && v >= 1000 ? `₹${Number(v).toLocaleString()}` : String(v ?? "")}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {msg.rows.length > 8 && (
                              <div style={{ padding: "6px 14px", fontSize: 11, color: GC.gray400, background: GC.gray50 }}>
                                +{msg.rows.length - 8} more rows
                              </div>
                            )}
                          </div>
                        )}

                        {/* Chart */}
                        {msg.rows && msg.rows.length > 0 && msg.chartType && msg.chartType !== "table" && (
                          <div style={{ border: `1px solid ${GC.border}`, borderRadius: 10, padding: "16px 12px 8px", background: GC.white }}>
                            <SmartChart data={msg.rows} chartType={msg.chartType} />
                          </div>
                        )}

                        {/* Citation */}
                        {msg.sql && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {[
                              `📋 ${
                                msg.sql.toLowerCase().includes("extracted_documents") && msg.sql.toLowerCase().includes("vendor_transactions")
                                  ? "vendor_transactions + extracted_documents"
                                  : msg.sql.toLowerCase().includes("extracted_documents")
                                  ? "extracted_documents"
                                  : "vendor_transactions"
                              }`,
                              msg.rowCount && msg.rowCount > 0 ? `${msg.rowCount} rows returned` : null,
                              "FY2024",
                            ]
                              .filter(Boolean)
                              .map((tag, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: 11,
                                    color: GC.gray400,
                                    background: GC.gray50,
                                    border: `1px solid ${GC.border}`,
                                    borderRadius: 20,
                                    padding: "3px 10px",
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Follow-up hint */}
                        {msg.followupHint && (
                          <div
                            className="gc-chip"
                            onClick={() => setInput(msg.followupHint!)}
                            style={{
                              alignSelf: "flex-start",
                              fontSize: 12,
                              color: GC.blue,
                              background: GC.blueLight,
                              border: `1px solid ${GC.blue}20`,
                              borderRadius: 8,
                              padding: "7px 12px",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              display: "inline-flex",
                              gap: 6,
                              fontWeight: 500,
                            }}
                          >
                            ↳ Try: {msg.followupHint}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div
                    className="fade-up"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 16px",
                      background: GC.gray50,
                      borderRadius: "4px 16px 16px 16px",
                      alignSelf: "flex-start",
                      border: `1px solid ${GC.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        border: `2px solid ${GC.blue}`,
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    ></div>
                    <span style={{ fontSize: 12, color: GC.gray400, fontWeight: 500 }}>Querying data lake...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  padding: "14px 16px",
                  borderTop: `1px solid ${GC.border}`,
                  display: "flex",
                  gap: 10,
                  background: GC.white,
                }}
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAsk();
                    }
                  }}
                  placeholder="Ask anything about your vendor spend data... (Enter to send)"
                  rows={2}
                  style={{
                    flex: 1,
                    background: GC.gray50,
                    border: `1.5px solid ${input ? GC.blue : GC.border}`,
                    borderRadius: 9,
                    padding: "10px 14px",
                    color: GC.gray800,
                    fontSize: 13,
                    fontFamily: "Inter,sans-serif",
                    resize: "none",
                    lineHeight: 1.5,
                    transition: "border-color 0.15s",
                  }}
                />
                <button
                  onClick={handleAsk}
                  disabled={!input.trim() || loading}
                  className="gc-btn-primary"
                  style={{
                    width: 44,
                    height: 44,
                    fontSize: 18,
                    padding: 0,
                    borderRadius: 9,
                    alignSelf: "flex-end",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  →
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  background: GC.white,
                  borderRadius: 12,
                  border: `1px solid ${GC.border}`,
                  padding: 18,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    color: GC.gray400,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 14,
                  }}
                >
                  Data Schema
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: GC.blue,
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: GC.blue, display: "inline-block" }}></span>
                    vendor_transactions
                  </div>
                  {["vendor_name", "category", "amount", "invoice_date", "region", "status"].map((c) => (
                    <div
                      key={c}
                      style={{
                        fontSize: 11,
                        color: GC.gray400,
                        padding: "3px 0 3px 14px",
                        borderLeft: `2px solid ${GC.gray100}`,
                      }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#8B5CF6",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8B5CF6", display: "inline-block" }}></span>
                    extracted_documents
                  </div>
                  {["vendor_name", "invoice_date", "total_amount", "line_items", "confidence"].map((c) => (
                    <div
                      key={c}
                      style={{
                        fontSize: 11,
                        color: GC.gray400,
                        padding: "3px 0 3px 14px",
                        borderLeft: `2px solid ${GC.gray100}`,
                      }}
                    >
                      {c}
                    </div>
                  ))}
                  <div
                    style={{
                      marginTop: 8,
                      padding: "6px 10px",
                      borderRadius: 6,
                      background: extractedDocs.length > 0 ? GC.greenLight : GC.gray50,
                      border: `1px solid ${extractedDocs.length > 0 ? "#00A67E30" : GC.border}`,
                      fontSize: 11,
                      color: extractedDocs.length > 0 ? GC.green : GC.gray400,
                      fontWeight: 500,
                    }}
                  >
                    {extractedDocs.length > 0 ? `✓ ${extractedDocs.length} document(s) stored` : "○ No documents yet"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ DOCUMENTS TAB ════════════════════════════════════════════════ */}
        {activeTab === "documents" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, minHeight: "calc(100vh - 108px)" }}>
            {/* Upload */}
            <div
              style={{
                background: GC.white,
                borderRadius: 12,
                border: `1px solid ${GC.border}`,
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${GC.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: "#F5F0FF",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                  }}
                >
                  📄
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Vision Document Agent</div>
                  <div style={{ fontSize: 11, color: GC.gray400, marginTop: 1 }}>Upload any invoice · PDF or image</div>
                </div>
              </div>
              <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Drop zone */}
                <div
                  ref={dragRef}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragRef.current) dragRef.current.style.borderColor = GC.blue;
                  }}
                  onDragLeave={() => {
                    if (dragRef.current) dragRef.current.style.borderColor = GC.border;
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragRef.current) dragRef.current.style.borderColor = GC.border;
                    const f = e.dataTransfer.files[0];
                    if (f) handleFileSelect(f);
                  }}
                  onClick={() => document.getElementById("fileInput")?.click()}
                  style={{
                    border: `2px dashed ${GC.border}`,
                    borderRadius: 12,
                    padding: "28px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                    background: GC.gray50,
                  }}
                >
                  <input
                    id="fileInput"
                    type="file"
                    accept=".pdf,image/*"
                    style={{ display: "none" }}
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  {docPreview && !docFile?.name?.endsWith(".pdf") ? (
                    <img
                      src={docPreview}
                      alt="preview"
                      style={{
                        maxHeight: 140,
                        maxWidth: "100%",
                        borderRadius: 8,
                        marginBottom: 10,
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{docFile ? "📄" : "⬆️"}</div>
                  )}
                  <div style={{ fontSize: 13, color: GC.gray600, fontWeight: 500 }}>
                    {docFile ? docFile.name : "Drop a PDF or image here"}
                  </div>
                  <div style={{ fontSize: 11, color: GC.gray400, marginTop: 4 }}>
                    {docFile ? `${(docFile.size / 1024).toFixed(0)} KB` : "or click to browse · PDF, JPG, PNG · max 20MB"}
                  </div>
                </div>

                {extracting && (
                  <div
                    style={{
                      padding: "14px 16px",
                      background: GC.blueLight,
                      border: `1px solid ${GC.blue}30`,
                      borderRadius: 9,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        border: `2px solid ${GC.blue}`,
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        flexShrink: 0,
                      }}
                    ></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: GC.blue }}>Extracting with vision model...</div>
                      <div style={{ fontSize: 11, color: GC.blueMid, marginTop: 2 }}>
                        Identifying vendor, dates, amounts and line items
                      </div>
                    </div>
                  </div>
                )}

                {docStored && (
                  <div
                    style={{
                      padding: "14px 16px",
                      background: GC.greenLight,
                      border: `1px solid ${GC.green}30`,
                      borderRadius: 9,
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: 18, marginTop: 1 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: GC.green }}>Document stored and queryable</div>
                      <div style={{ fontSize: 11, color: "#065f46", marginTop: 2 }}>
                        {extractedFields?.vendor_name} · ₹{(extractedFields?.total_amount || 0).toLocaleString()} · Switch to Cross-Source Query
                        tab
                      </div>
                    </div>
                  </div>
                )}

                {extractedDocs.length > 0 && (
                  <div style={{ border: `1px solid ${GC.border}`, borderRadius: 10, overflow: "hidden" }}>
                    <div
                      style={{
                        padding: "8px 14px",
                        borderBottom: `1px solid ${GC.border}`,
                        background: GC.gray50,
                        fontSize: 11,
                        fontWeight: 600,
                        color: GC.gray400,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Stored Documents ({extractedDocs.length})
                    </div>
                    {extractedDocs.map((d, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "9px 14px",
                          borderBottom: i < extractedDocs.length - 1 ? `1px solid ${GC.gray100}` : "none",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 500, color: GC.gray800 }}>{d.vendor_name}</span>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: GC.blue, fontWeight: 600 }}>₹{(d.total_amount || 0).toLocaleString()}</span>
                          <span style={{ fontSize: 11, color: GC.gray400 }}>{d.invoice_date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Extraction review */}
            <div
              style={{
                background: GC.white,
                borderRadius: 12,
                border: `1px solid ${GC.border}`,
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${GC.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: GC.greenLight,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                  }}
                >
                  🔍
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Extraction Review</div>
                  <div style={{ fontSize: 11, color: GC.gray400, marginTop: 1 }}>Review and edit extracted fields before storing</div>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                {!extractedFields && !extracting && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      gap: 12,
                      color: GC.gray400,
                      paddingBottom: 40,
                    }}
                  >
                    <div style={{ fontSize: 36 }}>📋</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: GC.gray600 }}>No document uploaded yet</div>
                    <div style={{ fontSize: 12, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
                      Upload an invoice or receipt on the left to see extracted fields here
                    </div>
                  </div>
                )}

                {extractedFields && !extractedFields.error && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Confidence */}
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 9,
                        background: (extractedFields.confidence || 0) >= 0.8 ? GC.greenLight : GC.amberLight,
                        border: `1px solid ${(extractedFields.confidence || 0) >= 0.8 ? GC.green + "40" : GC.amber + "40"}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: (extractedFields.confidence || 0) >= 0.8 ? GC.green : GC.amber,
                        }}
                      >
                        {(extractedFields.confidence || 0) >= 0.8 ? "✓ High confidence extraction" : "⚠ Low confidence — verify carefully"}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: (extractedFields.confidence || 0) >= 0.8 ? GC.green : GC.amber,
                        }}
                      >
                        {Math.round((extractedFields.confidence || 0) * 100)}%
                      </span>
                    </div>

                    {(
                      [
                        { key: "vendor_name", label: "Vendor Name" },
                        { key: "invoice_number", label: "Invoice Number" },
                        { key: "invoice_date", label: "Invoice Date" },
                        { key: "due_date", label: "Due Date" },
                        { key: "currency", label: "Currency" },
                        { key: "subtotal", label: "Subtotal" },
                        { key: "tax_amount", label: "Tax Amount" },
                        { key: "total_amount", label: "Total Amount" },
                      ] as const
                    ).map(({ key, label }) => (
                      <div
                        key={key}
                        style={{
                          borderRadius: 8,
                          border: `1px solid ${GC.border}`,
                          background: GC.gray50,
                          padding: "9px 13px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: GC.gray400,
                            marginBottom: 4,
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                          }}
                        >
                          {label}
                        </div>
                        <input
                          value={String(extractedFields[key] ?? "")}
                          onChange={(e) =>
                            setExtractedFields((p) => ({
                              ...p,
                              [key]: key === "total_amount" || key === "subtotal" || key === "tax_amount" ? Number(e.target.value) : e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            background: "none",
                            border: "none",
                            color: GC.gray800,
                            fontSize: 13,
                            fontFamily: "Inter,sans-serif",
                            padding: 0,
                            fontWeight: 500,
                          }}
                        />
                      </div>
                    ))}

                    {extractedFields.line_items && extractedFields.line_items.length > 0 && (
                      <div style={{ border: `1px solid ${GC.border}`, borderRadius: 9, overflow: "hidden" }}>
                        <div
                          style={{
                            padding: "8px 13px",
                            borderBottom: `1px solid ${GC.border}`,
                            background: GC.gray50,
                            fontSize: 11,
                            fontWeight: 600,
                            color: GC.gray400,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          Line Items ({extractedFields.line_items.length})
                        </div>
                        {extractedFields.line_items.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "8px 13px",
                              borderBottom: i < (extractedFields.line_items?.length || 0) - 1 ? `1px solid ${GC.gray100}` : "none",
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 12,
                            }}
                          >
                            <span style={{ color: GC.gray600 }}>{item.description}</span>
                            <span style={{ color: GC.blue, fontWeight: 600 }}>₹{(item.amount || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!docStored ? (
                      <button
                        onClick={handleApprove}
                        style={{
                          width: "100%",
                          padding: "13px",
                          background: GC.green,
                          border: "none",
                          borderRadius: 9,
                          color: "white",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "Inter,sans-serif",
                          marginTop: 4,
                          transition: "opacity 0.15s",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        ✓ Approve & Store Extraction
                      </button>
                    ) : (
                      <div
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: 13,
                          color: GC.green,
                          background: GC.greenLight,
                          borderRadius: 9,
                          border: `1px solid ${GC.green}30`,
                          fontWeight: 600,
                        }}
                      >
                        ✓ Stored — queryable in Cross-Source Query tab
                      </div>
                    )}
                  </div>
                )}

                {extractedFields?.error && (
                  <div
                    style={{
                      padding: 16,
                      background: GC.redLight,
                      border: `1px solid ${GC.red}30`,
                      borderRadius: 9,
                      color: GC.red,
                      fontSize: 13,
                    }}
                  >
                    <strong>Extraction failed:</strong> {extractedFields.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ CROSS-QUERY TAB ══════════════════════════════════════════════ */}
        {activeTab === "crossquery" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, minHeight: "calc(100vh - 108px)" }}>
            <div
              style={{
                background: GC.white,
                borderRadius: 12,
                border: `1px solid ${GC.border}`,
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${GC.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: "#F0EBFF",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                  }}
                >
                  🔗
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Cross-Source Query</div>
                  <div style={{ fontSize: 11, color: GC.gray400, marginTop: 1 }}>
                    vendor_transactions + extracted_documents · {extractedDocs.length} doc(s) loaded
                  </div>
                </div>
              </div>

              {extractedDocs.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    padding: 40,
                    color: GC.gray400,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      background: "#F5F0FF",
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                    }}
                  >
                    🔗
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: GC.gray800, marginBottom: 8 }}>No documents stored yet</div>
                    <div style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.7, color: GC.gray400 }}>
                      Upload and approve an invoice in the Document Agent tab first. Then return here to query across both data sources.
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("documents")}
                    className="gc-btn-primary"
                    style={{ padding: "10px 24px", fontSize: 13, borderRadius: 8 }}
                  >
                    → Go to Document Agent
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                    <div
                      style={{
                        padding: "11px 14px",
                        background: GC.blueLight,
                        border: `1px solid ${GC.blue}20`,
                        borderRadius: 9,
                        fontSize: 12,
                        color: GC.blue,
                        fontWeight: 500,
                      }}
                    >
                      🔗 Cross-source mode active — Claude can JOIN vendor_transactions with {extractedDocs.length} extracted doc(s){verifiedDocuments.length > 0 ? ` and ${verifiedDocuments.length} verified doc(s)` : ""}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {[
                        `Does ${extractedDocs[0]?.vendor_name?.split(" ")[0]} appear in our spend records?`,
                        "Show vendors present in both data lake and uploaded documents",
                        `Compare invoice amount for ${extractedDocs[0]?.vendor_name?.split(" ")[0]} vs lake records`,
                        "Which uploaded vendor has highest data lake spend?",
                        ...(verifiedDocuments.length > 0 ? ["Show all verified trade documents", "Which verified documents have discrepancies?"] : []),
                      ].map((s, i) => (
                        <span
                          key={i}
                          className="gc-chip"
                          onClick={() => setInput(s)}
                          style={{
                            fontSize: 12,
                            color: "#6D28D9",
                            background: "#F5F0FF",
                            border: "1px solid #DDD6FE",
                            borderRadius: 20,
                            padding: "5px 13px",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="fade-up"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                        }}
                      >
                        {msg.role === "user" ? (
                          <div
                            style={{
                              maxWidth: "72%",
                              background: `linear-gradient(135deg,${GC.blue},${GC.blueDark})`,
                              borderRadius: "16px 16px 4px 16px",
                              padding: "11px 16px",
                              fontSize: 13,
                              color: "white",
                              lineHeight: 1.5,
                              fontWeight: 500,
                            }}
                          >
                            {msg.content}
                          </div>
                        ) : (
                          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                            <div
                              style={{
                                background: GC.gray50,
                                border: `1px solid ${GC.border}`,
                                borderRadius: "4px 16px 16px 16px",
                                padding: "13px 16px",
                                display: "flex",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  background: "#F5F0FF",
                                  borderRadius: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 13,
                                  flexShrink: 0,
                                }}
                              >
                                🤖
                              </div>
                              <div style={{ fontSize: 13, lineHeight: 1.6, color: GC.gray800 }}>{msg.content}</div>
                            </div>
                            {msg.sql && (
                              <details>
                                <summary
                                  style={{
                                    fontSize: 12,
                                    color: GC.blue,
                                    listStyle: "none",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <span
                                    style={{
                                      background: GC.blueLight,
                                      color: GC.blue,
                                      borderRadius: 5,
                                      padding: "2px 9px",
                                      fontSize: 11,
                                      fontWeight: 600,
                                    }}
                                  >
                                    SQL
                                  </span>
                                  View query ›
                                </summary>
                                <div
                                  style={{
                                    marginTop: 8,
                                    background: "#F6F9FE",
                                    border: `1px solid ${GC.border}`,
                                    borderRadius: 8,
                                    padding: "13px 16px",
                                    fontSize: 12,
                                    color: "#2B5197",
                                    lineHeight: 1.8,
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "'Fira Code',monospace",
                                  }}
                                >
                                  {msg.sql}
                                </div>
                              </details>
                            )}
                            {msg.rows && msg.rows.length > 0 && (
                              <div style={{ border: `1px solid ${GC.border}`, borderRadius: 10, overflow: "hidden" }}>
                                <div
                                  style={{
                                    padding: "8px 14px",
                                    borderBottom: `1px solid ${GC.border}`,
                                    background: GC.gray50,
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: GC.gray400,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.06em",
                                    }}
                                  >
                                    Result
                                  </span>
                                  <span style={{ fontSize: 11, color: GC.gray400 }}>{msg.rowCount} rows</span>
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                    <thead>
                                      <tr style={{ background: GC.gray50 }}>
                                        {Object.keys(msg.rows[0]).map((k) => (
                                          <th
                                            key={k}
                                            style={{
                                              padding: "7px 14px",
                                              textAlign: "left",
                                              color: GC.gray400,
                                              fontWeight: 600,
                                              borderBottom: `1px solid ${GC.border}`,
                                              whiteSpace: "nowrap",
                                              fontSize: 11,
                                            }}
                                          >
                                            {k}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {msg.rows.slice(0, 8).map((row, i) => (
                                        <tr
                                          key={i}
                                          className="gc-row"
                                          style={{ borderBottom: `1px solid ${GC.gray100}`, transition: "background 0.1s" }}
                                        >
                                          {Object.values(row).map((v, j) => (
                                            <td key={j} style={{ padding: "8px 14px", color: GC.gray600, whiteSpace: "nowrap" }}>
                                              {typeof v === "number" && v >= 1000 ? `₹${Number(v).toLocaleString()}` : String(v ?? "")}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            {msg.rows && msg.rows.length > 0 && msg.chartType && msg.chartType !== "table" && (
                              <div style={{ border: `1px solid ${GC.border}`, borderRadius: 10, padding: "16px 12px 8px" }}>
                                <SmartChart data={msg.rows} chartType={msg.chartType} />
                              </div>
                            )}
                            {msg.sql && (
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#6D28D9",
                                    background: "#F5F0FF",
                                    border: "1px solid #DDD6FE",
                                    borderRadius: 20,
                                    padding: "3px 10px",
                                  }}
                                >
                                  🔗 {msg.sql.toLowerCase().includes("extracted_documents") ? "Cross-source JOIN" : "vendor_transactions"}
                                </span>
                                {msg.rowCount && msg.rowCount > 0 && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: GC.gray400,
                                      background: GC.gray50,
                                      border: `1px solid ${GC.border}`,
                                      borderRadius: 20,
                                      padding: "3px 10px",
                                    }}
                                  >
                                    {msg.rowCount} rows
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div
                    style={{
                      padding: "14px 16px",
                      borderTop: `1px solid ${GC.border}`,
                      display: "flex",
                      gap: 10,
                      background: GC.white,
                    }}
                  >
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAsk();
                        }
                      }}
                      placeholder="Ask a question across both data lake and uploaded documents..."
                      rows={2}
                      style={{
                        flex: 1,
                        background: GC.gray50,
                        border: `1.5px solid ${input ? "#8B5CF6" : GC.border}`,
                        borderRadius: 9,
                        padding: "10px 14px",
                        color: GC.gray800,
                        fontSize: 13,
                        fontFamily: "Inter,sans-serif",
                        resize: "none",
                        lineHeight: 1.5,
                        transition: "border-color 0.15s",
                      }}
                    />
                    <button
                      onClick={handleAsk}
                      disabled={!input.trim() || loading}
                      className="gc-btn-primary"
                      style={{
                        width: 44,
                        height: 44,
                        fontSize: 18,
                        padding: 0,
                        borderRadius: 9,
                        alignSelf: "flex-end",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      →
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  background: GC.white,
                  borderRadius: 12,
                  border: `1px solid ${GC.border}`,
                  padding: 18,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    color: GC.gray400,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 12,
                  }}
                >
                  Stored Documents
                </div>
                {extractedDocs.length === 0 ? (
                  <div style={{ fontSize: 12, color: GC.gray400, textAlign: "center", padding: "12px 0" }}>None stored yet</div>
                ) : (
                  extractedDocs.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 10,
                        padding: "10px 12px",
                        background: GC.gray50,
                        borderRadius: 9,
                        border: `1px solid ${GC.border}`,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: GC.gray800, marginBottom: 6 }}>{d.vendor_name}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {(
                          [
                            ["Amount", `₹${(d.total_amount || 0).toLocaleString()}`],
                            ["Date", d.invoice_date],
                            ["Confidence", `${Math.round((d.confidence || 0) * 100)}%`],
                          ] as const
                        ).map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                            <span style={{ color: GC.gray400 }}>{k}</span>
                            <span style={{ color: GC.gray600, fontWeight: 500 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div
                style={{
                  background: GC.white,
                  borderRadius: 12,
                  border: `1px solid ${GC.border}`,
                  padding: 18,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    color: GC.gray400,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 12,
                  }}
                >
                  How It Works
                </div>
                {(
                  [
                    ["1", "Upload invoice in Document Agent tab", "#EBF2FD", GC.blue],
                    ["2", "Claude extracts fields via vision model", "#F5F0FF", "#8B5CF6"],
                    ["3", "Review, edit, and approve to store", "#E6F7F3", GC.green],
                    ["4", "Ask cross-source questions here", "#EBF2FD", GC.blue],
                    ["5", "Claude JOINs both data sources", "#F5F0FF", "#8B5CF6"],
                  ] as const
                ).map(([n, s, bg, col]) => (
                  <div
                    key={n}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "6px 0",
                      alignItems: "flex-start",
                      borderBottom: `1px solid ${GC.gray100}`,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: col,
                        flexShrink: 0,
                      }}
                    >
                      {n}
                    </div>
                    <span style={{ fontSize: 12, color: GC.gray600, lineHeight: 1.5, paddingTop: 2 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ CG VERIFICATION TAB ══════════════════════════════════════════════ */}
        {activeTab === "verification" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, minHeight: "calc(100vh - 108px)" }}>
            {/* Left Panel - Inbox / Navigation */}
            <div
              style={{
                background: GC.white,
                borderRadius: 12,
                border: `1px solid ${GC.border}`,
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${GC.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: "#E6F7F3",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>CG Verification Inbox</div>
                  <div style={{ fontSize: 11, color: GC.gray400, marginTop: 1 }}>
                    {[...incomingEmails, ...mockIncomingEmails].filter(e => e.status === "processing").length} processing · {[...incomingEmails, ...mockIncomingEmails].filter(e => e.status === "verified" || e.status === "pending_review").length} ready
                  </div>
                </div>
              </div>

              {/* File Upload Trigger */}
              <div style={{ padding: "12px", borderBottom: `1px solid ${GC.border}` }}>
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px",
                    background: cgUploading ? GC.amberLight : GC.blueLight,
                    border: `2px dashed ${cgUploading ? GC.amber : GC.blue}`,
                    borderRadius: 10,
                    cursor: cgUploading ? "wait" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    style={{ display: "none" }}
                    disabled={cgUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCgUploading(true);
                        processIncomingDocument(file, "supplier@example.com").finally(() => setCgUploading(false));
                      }
                      e.target.value = "";
                    }}
                  />
                  {cgUploading ? (
                    <>
                      <span style={{ fontSize: 20, marginBottom: 6, animation: "spin 1s linear infinite" }}>⟳</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: GC.amber }}>Processing document...</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 20, marginBottom: 6 }}>📤</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: GC.blue }}>Upload Document</span>
                      <span style={{ fontSize: 10, color: GC.gray400, marginTop: 2 }}>Simulates incoming email from SU</span>
                    </>
                  )}
                </label>
              </div>

              {/* Email List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                {[...incomingEmails, ...mockIncomingEmails].map((email) => (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      setSelectedField(null);
                      setDraftEmail(null);
                      if (email.status === "processing") {
                        setVerificationView("inbox");
                      } else {
                        setVerificationView("result");
                      }
                    }}
                    style={{
                      padding: "14px 16px",
                      marginBottom: 8,
                      background: selectedEmail?.id === email.id ? GC.blueLight : GC.gray50,
                      border: `1px solid ${selectedEmail?.id === email.id ? GC.blue : GC.border}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: GC.gray800, lineHeight: 1.4, flex: 1 }}>
                        {email.subject}
                      </div>
                      {email.status === "processing" && (
                        <span
                          style={{
                            fontSize: 10,
                            background: GC.amberLight,
                            color: GC.amber,
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontWeight: 600,
                            marginLeft: 8,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                          Processing
                        </span>
                      )}
                      {email.status === "verified" && email.verificationResult?.overallStatus === "flagged" && (
                        <span
                          style={{
                            fontSize: 10,
                            background: GC.redLight,
                            color: GC.red,
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontWeight: 600,
                            marginLeft: 8,
                          }}
                        >
                          Flagged
                        </span>
                      )}
                      {email.status === "pending_review" && email.verificationResult?.overallStatus === "approved" && (
                        <span
                          style={{
                            fontSize: 10,
                            background: GC.greenLight,
                            color: GC.green,
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontWeight: 600,
                            marginLeft: 8,
                          }}
                        >
                          Verified
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: GC.gray400 }}>{email.from}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12 }}>📎</span>
                        <span style={{ fontSize: 11, color: GC.gray600 }}>{email.attachmentName}</span>
                      </div>
                      <span style={{ fontSize: 10, color: GC.gray400 }}>
                        {new Date(email.receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Dynamic Content */}
            <div
              style={{
                background: GC.white,
                borderRadius: 12,
                border: `1px solid ${GC.border}`,
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              {!selectedEmail ? (
                /* Empty State */
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    padding: 40,
                    color: GC.gray400,
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      background: "#E6F7F3",
                      borderRadius: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 36,
                    }}
                  >
                    ✓
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: GC.gray800, marginBottom: 8 }}>CG Document Verification</div>
                    <div style={{ fontSize: 13, maxWidth: 400, lineHeight: 1.7, color: GC.gray400 }}>
                      Select an incoming document from the inbox to view the AI-powered verification results. The agent extracts fields, compares against source data, and flags discrepancies.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    {(
                      [
                        ["📥", "Incoming", "Documents arrive from SU"],
                        ["🔍", "Verify", "Agent extracts & compares"],
                        ["⚠️", "Review", "CG reviews flagged fields"],
                        ["✉️", "Reply", "Draft response to customer"],
                      ] as const
                    ).map(([icon, title, desc]) => (
                      <div
                        key={title}
                        style={{
                          padding: "16px 14px",
                          background: GC.gray50,
                          borderRadius: 10,
                          border: `1px solid ${GC.border}`,
                          textAlign: "center",
                          width: 120,
                        }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: GC.gray800, marginBottom: 4 }}>{title}</div>
                        <div style={{ fontSize: 10, color: GC.gray400, lineHeight: 1.4 }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedEmail.status === "processing" ? (
                /* Processing State */
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 20,
                    padding: 40,
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      background: GC.amberLight,
                      borderRadius: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 36,
                      animation: "spin 2s linear infinite",
                    }}
                  >
                    ⟳
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: GC.gray800, marginBottom: 8 }}>Processing Document</div>
                    <div style={{ fontSize: 13, color: GC.gray400, marginBottom: 16 }}>{selectedEmail.attachmentName}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left", maxWidth: 300 }}>
                      {(
                        [
                          ["Extracting document fields...", true],
                          ["Matching against booking data...", true],
                          ["Verifying field values...", false],
                          ["Generating verification report...", false],
                        ] as const
                      ).map(([step, done], i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: done ? GC.green : GC.gray200,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              color: "white",
                            }}
                          >
                            {done ? "✓" : ""}
                          </span>
                          <span style={{ fontSize: 12, color: done ? GC.gray600 : GC.gray400 }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : verificationView === "result" && selectedEmail.verificationResult ? (
                /* Verification Result View */
                <>
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: `1px solid ${GC.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: selectedEmail.verificationResult.overallStatus === "flagged" ? GC.redLight : GC.greenLight,
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                        }}
                      >
                        {selectedEmail.verificationResult.overallStatus === "flagged" ? "⚠️" : "✓"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Verification Result</div>
                        <div style={{ fontSize: 11, color: GC.gray400, marginTop: 2 }}>
                          {selectedEmail.attachmentName} · Confidence: {Math.round(selectedEmail.verificationResult.confidenceScore * 100)}%
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          background: selectedEmail.verificationResult.overallStatus === "flagged" ? GC.redLight : GC.greenLight,
                          color: selectedEmail.verificationResult.overallStatus === "flagged" ? GC.red : GC.green,
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {selectedEmail.verificationResult.overallStatus === "flagged"
                          ? `${selectedEmail.verificationResult.fields.filter((f) => f.status !== "match").length} Discrepancies Found`
                          : "All Fields Verified"}
                      </span>
                    </div>
                  </div>

                  {/* Field-by-field view */}
                  <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: GC.gray400, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                        Field Verification Results
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {selectedEmail.verificationResult.fields.map((field, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              if (field.status !== "match") {
                                setSelectedField(field);
                                setVerificationView("discrepancy");
                              }
                            }}
                            style={{
                              padding: "14px 18px",
                              background: field.status === "match" ? GC.gray50 : field.status === "mismatch" ? GC.redLight : GC.amberLight,
                              border: `1px solid ${field.status === "match" ? GC.border : field.status === "mismatch" ? "#FECACA" : "#FED7AA"}`,
                              borderRadius: 10,
                              cursor: field.status !== "match" ? "pointer" : "default",
                              transition: "all 0.15s",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                                <span
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 7,
                                    background: field.status === "match" ? GC.green : field.status === "mismatch" ? GC.red : GC.amber,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  {field.status === "match" ? "✓" : field.status === "mismatch" ? "✗" : "!"}
                                </span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, fontSize: 13, color: GC.gray800, marginBottom: 4 }}>{field.fieldName}</div>
                                  <div style={{ fontSize: 12, color: GC.gray600 }}>
                                    <span style={{ fontWeight: 500 }}>Extracted:</span> {field.extractedValue}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 11, color: GC.gray400 }}>{Math.round(field.confidence * 100)}% confidence</span>
                                {field.status !== "match" && (
                                  <span style={{ fontSize: 12, color: GC.blue, fontWeight: 500 }}>View Details →</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div
                    style={{
                      padding: "16px 20px",
                      borderTop: `1px solid ${GC.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: GC.gray50,
                    }}
                  >
                    <div style={{ fontSize: 12, color: GC.gray400 }}>
                      Processed at {new Date(selectedEmail.verificationResult.processedAt).toLocaleString()}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {selectedEmail.verificationResult.overallStatus === "flagged" && (
                        <button
                          onClick={() => {
                            setDraftEmail({
                              to: selectedEmail.from,
                              subject: `Re: ${selectedEmail.subject} - Verification Required`,
                              body: `Dear Team,\n\nWe have reviewed the attached document (${selectedEmail.attachmentName}) and identified the following discrepancies that require clarification:\n\n${selectedEmail.verificationResult!.fields
                                .filter((f) => f.status !== "match")
                                .map(
                                  (f) =>
                                    `• ${f.fieldName}:\n  - Document shows: ${f.extractedValue}\n  - Our records show: ${f.expectedValue}`
                                )
                                .join("\n\n")}\n\nPlease review and provide updated documentation or clarification at your earliest convenience.\n\nBest regards,\nGoComet Control Group`,
                            });
                            setVerificationView("draft");
                          }}
                          className="gc-btn-primary"
                          style={{ padding: "10px 20px", fontSize: 13, borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}
                        >
                          ✉️ Draft Reply
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (selectedEmail) {
                            const storedDoc = storeVerifiedDocument(selectedEmail);
                            if (storedDoc) {
                              alert(`Document approved and stored!\n\nDoc ID: ${storedDoc.doc_id}\nContainer: ${storedDoc.container_number || "N/A"}\nConsignee: ${storedDoc.consignee || "N/A"}\n\nYou can now query this document in the Analytics tab using:\n"SELECT * FROM verified_documents"`);
                            }
                          }
                        }}
                        style={{
                          padding: "10px 20px",
                          fontSize: 13,
                          fontWeight: 600,
                          borderRadius: 8,
                          border: `1px solid ${GC.green}`,
                          background: GC.greenLight,
                          color: GC.green,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        ✓ Approve & Store
                      </button>
                    </div>
                  </div>
                </>
              ) : verificationView === "discrepancy" && selectedField ? (
                /* Discrepancy Detail View */
                <>
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: `1px solid ${GC.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        onClick={() => {
                          setVerificationView("result");
                          setSelectedField(null);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: `1px solid ${GC.border}`,
                          background: GC.white,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                        }}
                      >
                        ←
                      </button>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Discrepancy Detail</div>
                        <div style={{ fontSize: 11, color: GC.gray400, marginTop: 2 }}>{selectedField.fieldName}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "6px 12px",
                        background: selectedField.status === "mismatch" ? GC.redLight : GC.amberLight,
                        color: selectedField.status === "mismatch" ? GC.red : GC.amber,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {selectedField.status === "mismatch" ? "Mismatch Detected" : "Warning - Review Required"}
                    </span>
                  </div>

                  <div style={{ flex: 1, padding: 24 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 20, marginBottom: 30 }}>
                      {/* Found Value */}
                      <div
                        style={{
                          padding: 24,
                          background: selectedField.status === "mismatch" ? GC.redLight : GC.amberLight,
                          borderRadius: 12,
                          border: `2px solid ${selectedField.status === "mismatch" ? "#FECACA" : "#FED7AA"}`,
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 600, color: GC.gray400, textTransform: "uppercase", marginBottom: 12 }}>
                          📄 Found in Document
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: GC.gray800, marginBottom: 8 }}>{selectedField.extractedValue}</div>
                        <div style={{ fontSize: 12, color: GC.gray400 }}>{selectedEmail?.attachmentName}</div>
                      </div>

                      {/* Arrow */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: GC.gray100,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                          }}
                        >
                          ≠
                        </div>
                      </div>

                      {/* Expected Value */}
                      <div
                        style={{
                          padding: 24,
                          background: GC.blueLight,
                          borderRadius: 12,
                          border: `2px solid ${GC.blue}30`,
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 600, color: GC.gray400, textTransform: "uppercase", marginBottom: 12 }}>
                          📋 Expected from Source
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: GC.gray800, marginBottom: 8 }}>{selectedField.expectedValue}</div>
                        <div style={{ fontSize: 12, color: GC.blue }}>{selectedField.source}</div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div style={{ background: GC.gray50, borderRadius: 12, padding: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: GC.gray800, marginBottom: 16 }}>Analysis</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, color: GC.gray400, marginBottom: 4 }}>Extraction Confidence</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                flex: 1,
                                height: 8,
                                background: GC.gray200,
                                borderRadius: 4,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${selectedField.confidence * 100}%`,
                                  height: "100%",
                                  background: selectedField.confidence >= 0.9 ? GC.green : selectedField.confidence >= 0.7 ? GC.amber : GC.red,
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: GC.gray600 }}>{Math.round(selectedField.confidence * 100)}%</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: GC.gray400, marginBottom: 4 }}>Source Reference</div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: GC.blue }}>{selectedField.source}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 16, padding: 14, background: GC.white, borderRadius: 8, border: `1px solid ${GC.border}` }}>
                        <div style={{ fontSize: 12, color: GC.gray600, lineHeight: 1.6 }}>
                          {selectedField.status === "mismatch"
                            ? `The extracted value "${selectedField.extractedValue}" does not match the expected value "${selectedField.expectedValue}" from the source system. This discrepancy requires manual review and potentially communication with the sender.`
                            : `The extracted value "${selectedField.extractedValue}" differs slightly from the expected value "${selectedField.expectedValue}". This may be due to formatting differences or minor data variations. Please verify if this is acceptable.`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      padding: "16px 20px",
                      borderTop: `1px solid ${GC.border}`,
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 10,
                      background: GC.gray50,
                    }}
                  >
                    <button
                      onClick={() => {
                        setVerificationView("result");
                        setSelectedField(null);
                      }}
                      style={{
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: 8,
                        border: `1px solid ${GC.border}`,
                        background: GC.white,
                        color: GC.gray600,
                        cursor: "pointer",
                      }}
                    >
                      Back to Results
                    </button>
                    <button
                      onClick={() => alert("Field marked as acceptable")}
                      style={{
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: 8,
                        border: `1px solid ${GC.green}`,
                        background: GC.greenLight,
                        color: GC.green,
                        cursor: "pointer",
                      }}
                    >
                      Accept Anyway
                    </button>
                  </div>
                </>
              ) : verificationView === "draft" && draftEmail ? (
                /* Draft Reply View */
                <>
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: `1px solid ${GC.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        onClick={() => {
                          setVerificationView("result");
                          setDraftEmail(null);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: `1px solid ${GC.border}`,
                          background: GC.white,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                        }}
                      >
                        ←
                      </button>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Draft Reply</div>
                        <div style={{ fontSize: 11, color: GC.gray400, marginTop: 2 }}>AI-generated response for discrepancies</div>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "6px 12px",
                        background: GC.blueLight,
                        color: GC.blue,
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      ✨ AI Generated
                    </span>
                  </div>

                  <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Email Fields */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: GC.gray400, textTransform: "uppercase", letterSpacing: "0.07em" }}>To</label>
                      <input
                        type="text"
                        value={draftEmail.to}
                        onChange={(e) => setDraftEmail({ ...draftEmail, to: e.target.value })}
                        style={{
                          width: "100%",
                          marginTop: 6,
                          padding: "10px 14px",
                          border: `1px solid ${GC.border}`,
                          borderRadius: 8,
                          fontSize: 13,
                          color: GC.gray800,
                          background: GC.gray50,
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: GC.gray400, textTransform: "uppercase", letterSpacing: "0.07em" }}>Subject</label>
                      <input
                        type="text"
                        value={draftEmail.subject}
                        onChange={(e) => setDraftEmail({ ...draftEmail, subject: e.target.value })}
                        style={{
                          width: "100%",
                          marginTop: 6,
                          padding: "10px 14px",
                          border: `1px solid ${GC.border}`,
                          borderRadius: 8,
                          fontSize: 13,
                          color: GC.gray800,
                          background: GC.gray50,
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: GC.gray400, textTransform: "uppercase", letterSpacing: "0.07em" }}>Message</label>
                      <textarea
                        value={draftEmail.body}
                        onChange={(e) => setDraftEmail({ ...draftEmail, body: e.target.value })}
                        style={{
                          flex: 1,
                          width: "100%",
                          marginTop: 6,
                          padding: "14px",
                          border: `1px solid ${GC.border}`,
                          borderRadius: 8,
                          fontSize: 13,
                          color: GC.gray800,
                          background: GC.gray50,
                          resize: "none",
                          lineHeight: 1.6,
                          fontFamily: "Inter, sans-serif",
                          minHeight: 300,
                        }}
                      />
                    </div>

                    {/* AI suggestion pills */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: GC.gray400, paddingTop: 4 }}>Quick edits:</span>
                      {["Make more formal", "Add urgency", "Request call", "Shorten message"].map((action) => (
                        <button
                          key={action}
                          onClick={() => alert(`Applying: ${action}`)}
                          style={{
                            padding: "6px 12px",
                            fontSize: 11,
                            borderRadius: 20,
                            border: `1px solid ${GC.border}`,
                            background: GC.white,
                            color: GC.gray600,
                            cursor: "pointer",
                          }}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      padding: "16px 20px",
                      borderTop: `1px solid ${GC.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: GC.gray50,
                    }}
                  >
                    <button
                      onClick={() => {
                        setVerificationView("result");
                        setDraftEmail(null);
                      }}
                      style={{
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: 8,
                        border: `1px solid ${GC.border}`,
                        background: GC.white,
                        color: GC.gray600,
                        cursor: "pointer",
                      }}
                    >
                      Discard
                    </button>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => alert("Email saved as draft")}
                        style={{
                          padding: "10px 20px",
                          fontSize: 13,
                          fontWeight: 600,
                          borderRadius: 8,
                          border: `1px solid ${GC.border}`,
                          background: GC.white,
                          color: GC.gray600,
                          cursor: "pointer",
                        }}
                      >
                        Save Draft
                      </button>
                      <button
                        onClick={() => alert("Email sent to " + draftEmail.to)}
                        className="gc-btn-primary"
                        style={{ padding: "10px 24px", fontSize: 13, borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}
                      >
                        Send Email →
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
