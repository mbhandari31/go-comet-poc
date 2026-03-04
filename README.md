# GoComet AI - Agentic Analytics + Vision Document Intelligence POC

A proof-of-concept demonstrating **natural language analytics** over a vendor spend data lake, combined with **AI-powered document extraction** using vision models.

**Live Demo:** [https://mbhandari31.github.io/go-comet-poc/](https://mbhandari31.github.io/go-comet-poc/)

---

## Features

| Feature | Description |
|---------|-------------|
| **Agentic Analytics** | Ask questions in plain English → AI generates SQL → Executes query → Returns data table + auto-generated chart with source citations |
| **Vision Document Agent** | Upload PDF or image invoices → AI extracts structured data (vendor, amounts, line items, dates) → Review and approve |
| **Cross-Source Query** | Query across both the data lake AND extracted documents seamlessly |

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Charts:** Recharts
- **AI:** Anthropic Claude API (claude-sonnet-4-5-20250514)
- **Deployment:** GitHub Pages via GitHub Actions
- **Architecture:** Client-side only (no backend required)

---

## Setup & Run Instructions

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm 9+
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/mbhandari31/go-comet-poc.git
cd go-comet-poc

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# Navigate to http://localhost:5173/go-comet-poc/
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## How to Use

### Step 1: Enter API Key
When you first open the app, you'll see an API key screen. Enter your Anthropic API key (starts with `sk-ant-...`) and click **"Launch POC"**.

> **Note:** The API key is stored only in browser memory and is never sent anywhere except to Anthropic's API.

### Step 2: Choose a Tab
- **Analytics** - Query the vendor spend data lake
- **Document Agent** - Extract data from invoices
- **Cross-Source Query** - Query across both sources

---

## Sample Questions for Testing

### Analytics Tab (Vendor Spend Data)

| Question | What it demonstrates |
|----------|---------------------|
| `Show total vendor spend by category in 2024` | GROUP BY aggregation + Bar chart |
| `Which vendor had the highest total spend?` | MAX aggregation + sorting |
| `Show monthly IT spend trend` | Time series + Line chart |
| `Compare spend across regions` | Regional breakdown + Pie chart |
| `Which invoices are still pending?` | WHERE filtering on status |
| `Top 5 vendors by spend amount` | ORDER BY + LIMIT |
| `What is the total spend in Q4 2024?` | Quarter-based filtering |
| `Show all logistics transactions above 30000` | Amount filtering |
| `Average spend per transaction by category` | AVG aggregation |

### Cross-Source Query Tab (After uploading a document)

| Question | What it demonstrates |
|----------|---------------------|
| `Does [Vendor Name] appear in our spend records?` | Cross-source matching |
| `Show vendors present in both data lake and uploaded documents` | JOIN operation |
| `Compare invoice amount for [Vendor] vs lake records` | Data reconciliation |
| `Which uploaded vendor has highest data lake spend?` | Cross-source aggregation |

---

## Sample Documents for Testing

You can use **any invoice or receipt** (PDF or image) for testing. The Vision Document Agent will extract:

- Vendor name
- Invoice number
- Invoice date & due date
- Line items with descriptions and amounts
- Subtotal, tax, and total amount
- Confidence score

### Sample Invoice Sources

If you don't have an invoice handy, you can:

1. **Use a sample invoice generator:** [Invoice Generator](https://invoice-generator.com/) - Create and download a sample PDF
2. **Search for sample invoices:** Google "sample invoice PDF" and download any result
3. **Create a simple receipt image:** Take a photo of any receipt

### Recommended Test Document

For best results, use an invoice that contains:
- Clear vendor/company name
- Invoice number
- Date
- Line items with prices
- Total amount

---

## Demo Script (1-2 minutes)

### Part 1: Analytics Flow (30 seconds)

1. **Enter API Key** - Paste your Anthropic API key and click "Launch POC"
2. **You're on the Analytics tab** - Notice the data schema sidebar showing `vendor_transactions` (48 rows)
3. **Click a suggested question** or type: `"Show total vendor spend by category in 2024"`
4. **Observe the response:**
   - Natural language answer
   - Expandable SQL query (click "View query used")
   - Data table with results
   - Auto-generated bar chart
   - Source citation badges (table name, row count, date range)
5. **Try a follow-up:** Click the suggested follow-up or ask `"Which category had the highest spend?"`

### Part 2: Document Extraction Flow (30 seconds)

1. **Click "Document Agent" tab**
2. **Upload an invoice:** Drag & drop or click to browse (PDF or image)
3. **Watch extraction:** The AI processes the document with a loading indicator
4. **Review extracted fields:**
   - Confidence score (green = high, amber = low)
   - Editable fields: vendor name, invoice number, dates, amounts
   - Line items breakdown
5. **Click "Approve & Store Extraction"** - Document is now saved and queryable

### Part 3: Cross-Source Query Flow (30 seconds)

1. **Click "Cross-Source Query" tab**
2. **Notice the info banner** showing the stored document(s)
3. **Click a suggested question** like `"Does [Vendor] appear in our spend records?"`
4. **Observe the cross-source response:**
   - Answer combining data from both sources
   - SQL showing JOIN between `vendor_transactions` and `extracted_documents`
   - Purple "Cross-source JOIN" badge in citations
5. **Try:** `"Show vendors present in both data lake and uploaded documents"`

---

## Data Schema

### vendor_transactions (Pre-loaded - 48 rows)

| Column | Type | Values |
|--------|------|--------|
| id | INTEGER | 1-48 |
| vendor_name | TEXT | Infosys Ltd, Wipro IT, DHL Logistics, etc. |
| category | TEXT | IT, Logistics, Marketing, Facilities, Legal |
| amount | DECIMAL | 18,000 - 235,000 |
| invoice_date | DATE | 2024-01-01 to 2024-12-31 |
| region | TEXT | North, South, East, West |
| status | TEXT | paid, pending |

### extracted_documents (Populated via Document Agent)

| Column | Type | Description |
|--------|------|-------------|
| doc_id | TEXT | Auto-generated ID |
| vendor_name | TEXT | Extracted vendor name |
| invoice_number | TEXT | Extracted invoice number |
| invoice_date | DATE | Extracted date |
| total_amount | DECIMAL | Extracted total |
| line_items | JSON | Array of line items |
| confidence | DECIMAL | AI confidence score (0-1) |

---

## Project Structure

```
go-comet-poc/
├── src/
│   ├── App.tsx          # Main application (single-file architecture)
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions deployment
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── package.json         # Dependencies
└── README.md            # This file
```

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Client-side only** | GitHub Pages deployment, no backend needed |
| **Anthropic Claude API** | Superior reasoning for SQL generation and document extraction |
| **In-memory SQL parser** | Lightweight, no database setup required |
| **Inline styles** | Self-contained components, no CSS conflicts |
| **Single-file App.tsx** | Simplified architecture for POC |

---

## Limitations (POC Scope)

- Data is in-memory (resets on page refresh)
- Extracted documents persist only in browser session
- Requires user to provide their own API key
- SQL parser handles common patterns but not full SQL syntax

---

## License

MIT License - Built for GoComet assignment evaluation.
