# Demo Script (1-2 minutes)

## Prerequisites
- OpenAI API key (get one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys))
- A sample invoice (PDF or image) - or use the included `samples/sample-invoice.html`

---

## Part 1: Analytics Flow (30 seconds)

1. **Enter API Key** - Paste your OpenAI API key and click "Launch POC"
2. **You're on the Analytics tab** - Notice the data schema sidebar showing `vendor_transactions` (48 rows)
3. **Click a suggested question** or type: `"Show total vendor spend by category in 2024"`
4. **Observe the response:**
   - Natural language answer
   - Expandable SQL query (click "View query used")
   - Data table with results
   - Auto-generated bar chart
   - Source citation badges (table name, row count, date range)
5. **Try a follow-up:** Click the suggested follow-up or ask `"Which category had the highest spend?"`

---

## Part 2: Document Extraction Flow (30 seconds)

1. **Click "Document Agent" tab**
2. **Upload an invoice:** Drag & drop or click to browse (PDF or image)
3. **Watch extraction:** The AI processes the document with a loading indicator
   - For PDFs: The app converts pages to images using PDF.js before sending to GPT-4o
4. **Review extracted fields:**
   - Confidence score (green = high, amber = low)
   - Editable fields: vendor name, invoice number, dates, amounts
   - Line items breakdown
5. **Click "Approve & Store Extraction"** - Document is now saved and queryable

---

## Part 3: Cross-Source Query Flow (30 seconds)

1. **Click "Cross-Source Query" tab**
2. **Notice the info banner** showing the stored document(s)
3. **Click a suggested question** like `"Does [Vendor] appear in our spend records?"`
4. **Observe the cross-source response:**
   - Answer combining data from both sources
   - SQL showing JOIN between `vendor_transactions` and `extracted_documents`
   - Purple "Cross-source JOIN" badge in citations
5. **Try:** `"Show vendors present in both data lake and uploaded documents"`

---

## Sample Questions to Try

### Analytics Tab
- "Show total vendor spend by category in 2024"
- "Which vendor had the highest total spend?"
- "Show monthly IT spend trend"
- "Compare spend across regions"
- "Which invoices are still pending?"
- "Top 5 vendors by spend amount"

### Cross-Source Query Tab
- "Does [Vendor Name] appear in our spend records?"
- "Show vendors present in both data lake and uploaded documents"
- "Compare invoice amount for [Vendor] vs lake records"
- "Which uploaded vendor has highest data lake spend?"

---

## Tips for Demo

- Use the **suggested question chips** for quick queries
- Click **"View query used"** to show the generated SQL
- The **charts auto-generate** based on the data type (bar, line, pie)
- **Source citations** appear below each response showing data provenance
- **Follow-up hints** appear after each response for conversation continuity
