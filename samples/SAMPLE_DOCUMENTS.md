# Sample Documents for Testing

This folder contains sample documents for testing the Vision Document Agent feature.

## Included Sample

### sample-invoice.html

A sample invoice from **Infosys Ltd** to **GoComet Technologies**.

**To use this sample:**

1. Open `sample-invoice.html` in your browser
2. Print to PDF (Ctrl/Cmd + P → Save as PDF)
3. Upload the PDF to the Document Agent tab

**Or take a screenshot:**
1. Open `sample-invoice.html` in your browser
2. Take a screenshot (or use browser's full-page screenshot)
3. Upload the image to the Document Agent tab

### Invoice Details

| Field | Value |
|-------|-------|
| Vendor | Infosys Ltd |
| Invoice # | INF-2024-0892 |
| Date | December 15, 2024 |
| Due Date | January 15, 2025 |
| Subtotal | ₹245,000.00 |
| CGST (9%) | ₹22,050.00 |
| SGST (9%) | ₹22,050.00 |
| **Total** | **₹289,100.00** |

### Line Items

1. Cloud Infrastructure Setup & Configuration - ₹85,000
2. API Integration Services (40 hours) - ₹100,000
3. Security Audit & Compliance Review - ₹45,000
4. Technical Documentation - ₹15,000

---

## Using Other Documents

You can also test with:

1. **Any invoice or receipt** - PDF or image format
2. **Online sample invoices** - Search "sample invoice PDF" on Google
3. **Invoice generators** - Use [invoice-generator.com](https://invoice-generator.com/)

The Vision Document Agent will extract:
- Vendor name
- Invoice number
- Dates (invoice date, due date)
- Line items with descriptions and amounts
- Subtotal, taxes, and total
- Confidence score

---

## Cross-Source Query Testing

After extracting the Infosys invoice, try these queries in the Cross-Source Query tab:

1. `Does Infosys appear in our spend records?`
2. `Compare the invoice amount for Infosys vs their historical spend`
3. `Show all Infosys transactions from the data lake`
4. `Which uploaded vendors have the highest data lake spend?`
