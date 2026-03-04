// Sample vendor spend data for the data lake
export const vendorSpendData = [
  // IT Services
  { id: 1, vendor_name: 'Infosys Technologies', category: 'IT Services', amount: 245000, transaction_date: '2024-10-05', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-001' },
  { id: 2, vendor_name: 'TCS Digital', category: 'IT Services', amount: 189000, transaction_date: '2024-10-12', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-002' },
  { id: 3, vendor_name: 'Wipro Limited', category: 'IT Services', amount: 156000, transaction_date: '2024-10-18', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-003' },
  { id: 4, vendor_name: 'HCL Technologies', category: 'IT Services', amount: 134500, transaction_date: '2024-10-25', department: 'Operations', payment_status: 'Paid', invoice_number: 'INV-2024-004' },
  { id: 5, vendor_name: 'Tech Mahindra', category: 'IT Services', amount: 98000, transaction_date: '2024-11-02', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-005' },
  { id: 6, vendor_name: 'Infosys Technologies', category: 'IT Services', amount: 267000, transaction_date: '2024-11-08', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-006' },
  { id: 7, vendor_name: 'Cognizant', category: 'IT Services', amount: 178000, transaction_date: '2024-11-15', department: 'Finance', payment_status: 'Paid', invoice_number: 'INV-2024-007' },
  { id: 8, vendor_name: 'TCS Digital', category: 'IT Services', amount: 145000, transaction_date: '2024-11-22', department: 'Technology', payment_status: 'Pending', invoice_number: 'INV-2024-008' },
  { id: 9, vendor_name: 'Mindtree', category: 'IT Services', amount: 89000, transaction_date: '2024-12-01', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-009' },
  { id: 10, vendor_name: 'L&T Infotech', category: 'IT Services', amount: 112000, transaction_date: '2024-12-10', department: 'Operations', payment_status: 'Paid', invoice_number: 'INV-2024-010' },

  // Marketing
  { id: 11, vendor_name: 'Ogilvy India', category: 'Marketing', amount: 156000, transaction_date: '2024-10-03', department: 'Marketing', payment_status: 'Paid', invoice_number: 'INV-2024-011' },
  { id: 12, vendor_name: 'JWT Communications', category: 'Marketing', amount: 134000, transaction_date: '2024-10-10', department: 'Marketing', payment_status: 'Paid', invoice_number: 'INV-2024-012' },
  { id: 13, vendor_name: 'McCann Worldgroup', category: 'Marketing', amount: 98000, transaction_date: '2024-10-20', department: 'Marketing', payment_status: 'Paid', invoice_number: 'INV-2024-013' },
  { id: 14, vendor_name: 'Dentsu India', category: 'Marketing', amount: 87000, transaction_date: '2024-11-05', department: 'Marketing', payment_status: 'Paid', invoice_number: 'INV-2024-014' },
  { id: 15, vendor_name: 'Leo Burnett', category: 'Marketing', amount: 76000, transaction_date: '2024-11-12', department: 'Marketing', payment_status: 'Paid', invoice_number: 'INV-2024-015' },
  { id: 16, vendor_name: 'Ogilvy India', category: 'Marketing', amount: 145000, transaction_date: '2024-11-25', department: 'Marketing', payment_status: 'Pending', invoice_number: 'INV-2024-016' },
  { id: 17, vendor_name: 'Publicis Groupe', category: 'Marketing', amount: 67000, transaction_date: '2024-12-02', department: 'Marketing', payment_status: 'Paid', invoice_number: 'INV-2024-017' },
  { id: 18, vendor_name: 'Havas Media', category: 'Marketing', amount: 54000, transaction_date: '2024-12-08', department: 'Marketing', payment_status: 'Paid', invoice_number: 'INV-2024-018' },

  // Office Supplies
  { id: 19, vendor_name: 'Amazon Business', category: 'Office Supplies', amount: 45000, transaction_date: '2024-10-02', department: 'Admin', payment_status: 'Paid', invoice_number: 'INV-2024-019' },
  { id: 20, vendor_name: 'Staples India', category: 'Office Supplies', amount: 32000, transaction_date: '2024-10-15', department: 'Admin', payment_status: 'Paid', invoice_number: 'INV-2024-020' },
  { id: 21, vendor_name: 'Flipkart Wholesale', category: 'Office Supplies', amount: 28000, transaction_date: '2024-10-28', department: 'HR', payment_status: 'Paid', invoice_number: 'INV-2024-021' },
  { id: 22, vendor_name: 'Amazon Business', category: 'Office Supplies', amount: 38000, transaction_date: '2024-11-08', department: 'Admin', payment_status: 'Paid', invoice_number: 'INV-2024-022' },
  { id: 23, vendor_name: 'Office Depot', category: 'Office Supplies', amount: 24000, transaction_date: '2024-11-20', department: 'Admin', payment_status: 'Paid', invoice_number: 'INV-2024-023' },
  { id: 24, vendor_name: 'Staples India', category: 'Office Supplies', amount: 41000, transaction_date: '2024-12-05', department: 'Admin', payment_status: 'Pending', invoice_number: 'INV-2024-024' },

  // Travel & Transport
  { id: 25, vendor_name: 'MakeMyTrip Business', category: 'Travel', amount: 67000, transaction_date: '2024-10-08', department: 'Sales', payment_status: 'Paid', invoice_number: 'INV-2024-025' },
  { id: 26, vendor_name: 'Cleartrip Corporate', category: 'Travel', amount: 54000, transaction_date: '2024-10-22', department: 'Sales', payment_status: 'Paid', invoice_number: 'INV-2024-026' },
  { id: 27, vendor_name: 'Yatra Corporate', category: 'Travel', amount: 43000, transaction_date: '2024-11-03', department: 'Marketing', payment_status: 'Paid', invoice_number: 'INV-2024-027' },
  { id: 28, vendor_name: 'MakeMyTrip Business', category: 'Travel', amount: 78000, transaction_date: '2024-11-18', department: 'Executive', payment_status: 'Paid', invoice_number: 'INV-2024-028' },
  { id: 29, vendor_name: 'IRCTC Corporate', category: 'Travel', amount: 23000, transaction_date: '2024-12-01', department: 'Operations', payment_status: 'Paid', invoice_number: 'INV-2024-029' },

  // Consulting
  { id: 30, vendor_name: 'McKinsey & Company', category: 'Consulting', amount: 450000, transaction_date: '2024-10-01', department: 'Strategy', payment_status: 'Paid', invoice_number: 'INV-2024-030' },
  { id: 31, vendor_name: 'BCG India', category: 'Consulting', amount: 380000, transaction_date: '2024-10-20', department: 'Strategy', payment_status: 'Paid', invoice_number: 'INV-2024-031' },
  { id: 32, vendor_name: 'Deloitte Consulting', category: 'Consulting', amount: 290000, transaction_date: '2024-11-10', department: 'Finance', payment_status: 'Paid', invoice_number: 'INV-2024-032' },
  { id: 33, vendor_name: 'KPMG Advisory', category: 'Consulting', amount: 245000, transaction_date: '2024-11-28', department: 'Operations', payment_status: 'Pending', invoice_number: 'INV-2024-033' },
  { id: 34, vendor_name: 'EY Consulting', category: 'Consulting', amount: 198000, transaction_date: '2024-12-05', department: 'Finance', payment_status: 'Paid', invoice_number: 'INV-2024-034' },

  // Cloud Services
  { id: 35, vendor_name: 'Amazon Web Services', category: 'Cloud Services', amount: 189000, transaction_date: '2024-10-01', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-035' },
  { id: 36, vendor_name: 'Microsoft Azure', category: 'Cloud Services', amount: 156000, transaction_date: '2024-10-01', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-036' },
  { id: 37, vendor_name: 'Google Cloud Platform', category: 'Cloud Services', amount: 123000, transaction_date: '2024-10-01', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-037' },
  { id: 38, vendor_name: 'Amazon Web Services', category: 'Cloud Services', amount: 198000, transaction_date: '2024-11-01', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-038' },
  { id: 39, vendor_name: 'Microsoft Azure', category: 'Cloud Services', amount: 167000, transaction_date: '2024-11-01', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-039' },
  { id: 40, vendor_name: 'Google Cloud Platform', category: 'Cloud Services', amount: 134000, transaction_date: '2024-11-01', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-040' },
  { id: 41, vendor_name: 'Amazon Web Services', category: 'Cloud Services', amount: 212000, transaction_date: '2024-12-01', department: 'Technology', payment_status: 'Pending', invoice_number: 'INV-2024-041' },
  { id: 42, vendor_name: 'Microsoft Azure', category: 'Cloud Services', amount: 178000, transaction_date: '2024-12-01', department: 'Technology', payment_status: 'Pending', invoice_number: 'INV-2024-042' },

  // Legal Services
  { id: 43, vendor_name: 'AZB & Partners', category: 'Legal', amount: 234000, transaction_date: '2024-10-15', department: 'Legal', payment_status: 'Paid', invoice_number: 'INV-2024-043' },
  { id: 44, vendor_name: 'Cyril Amarchand Mangaldas', category: 'Legal', amount: 198000, transaction_date: '2024-11-05', department: 'Legal', payment_status: 'Paid', invoice_number: 'INV-2024-044' },
  { id: 45, vendor_name: 'Trilegal', category: 'Legal', amount: 156000, transaction_date: '2024-11-25', department: 'Legal', payment_status: 'Paid', invoice_number: 'INV-2024-045' },
  { id: 46, vendor_name: 'Khaitan & Co', category: 'Legal', amount: 123000, transaction_date: '2024-12-10', department: 'Legal', payment_status: 'Pending', invoice_number: 'INV-2024-046' },

  // Logistics
  { id: 47, vendor_name: 'Blue Dart Express', category: 'Logistics', amount: 67000, transaction_date: '2024-10-05', department: 'Operations', payment_status: 'Paid', invoice_number: 'INV-2024-047' },
  { id: 48, vendor_name: 'Delhivery', category: 'Logistics', amount: 54000, transaction_date: '2024-10-18', department: 'Operations', payment_status: 'Paid', invoice_number: 'INV-2024-048' },
  { id: 49, vendor_name: 'FedEx India', category: 'Logistics', amount: 89000, transaction_date: '2024-11-02', department: 'Operations', payment_status: 'Paid', invoice_number: 'INV-2024-049' },
  { id: 50, vendor_name: 'DHL Express', category: 'Logistics', amount: 78000, transaction_date: '2024-11-20', department: 'Sales', payment_status: 'Paid', invoice_number: 'INV-2024-050' },
  { id: 51, vendor_name: 'Blue Dart Express', category: 'Logistics', amount: 72000, transaction_date: '2024-12-05', department: 'Operations', payment_status: 'Pending', invoice_number: 'INV-2024-051' },

  // HR Services
  { id: 52, vendor_name: 'Naukri Enterprise', category: 'HR Services', amount: 89000, transaction_date: '2024-10-10', department: 'HR', payment_status: 'Paid', invoice_number: 'INV-2024-052' },
  { id: 53, vendor_name: 'LinkedIn Talent', category: 'HR Services', amount: 156000, transaction_date: '2024-10-25', department: 'HR', payment_status: 'Paid', invoice_number: 'INV-2024-053' },
  { id: 54, vendor_name: 'Indeed India', category: 'HR Services', amount: 67000, transaction_date: '2024-11-12', department: 'HR', payment_status: 'Paid', invoice_number: 'INV-2024-054' },
  { id: 55, vendor_name: 'TeamLease', category: 'HR Services', amount: 234000, transaction_date: '2024-11-28', department: 'HR', payment_status: 'Paid', invoice_number: 'INV-2024-055' },
  { id: 56, vendor_name: 'Randstad India', category: 'HR Services', amount: 178000, transaction_date: '2024-12-08', department: 'HR', payment_status: 'Pending', invoice_number: 'INV-2024-056' },

  // Software Licenses
  { id: 57, vendor_name: 'Microsoft 365', category: 'Software', amount: 345000, transaction_date: '2024-10-01', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-057' },
  { id: 58, vendor_name: 'Salesforce', category: 'Software', amount: 289000, transaction_date: '2024-10-01', department: 'Sales', payment_status: 'Paid', invoice_number: 'INV-2024-058' },
  { id: 59, vendor_name: 'Adobe Creative Cloud', category: 'Software', amount: 123000, transaction_date: '2024-10-01', department: 'Marketing', payment_status: 'Paid', invoice_number: 'INV-2024-059' },
  { id: 60, vendor_name: 'Slack Technologies', category: 'Software', amount: 89000, transaction_date: '2024-10-01', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-060' },
  { id: 61, vendor_name: 'Zoom Video', category: 'Software', amount: 67000, transaction_date: '2024-10-01', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-061' },
  { id: 62, vendor_name: 'Atlassian', category: 'Software', amount: 145000, transaction_date: '2024-10-01', department: 'Technology', payment_status: 'Paid', invoice_number: 'INV-2024-062' },
];

// SQL schema for reference
export const databaseSchema = `
CREATE TABLE vendor_spend (
  id INTEGER PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_date DATE NOT NULL,
  department TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  invoice_number TEXT
);

CREATE TABLE extracted_documents (
  id INTEGER PRIMARY KEY,
  doc_type TEXT NOT NULL,
  vendor_name TEXT,
  invoice_number TEXT,
  amount DECIMAL(10,2),
  date DATE,
  line_items TEXT,
  confidence_score DECIMAL(3,2),
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source_filename TEXT,
  status TEXT DEFAULT 'pending'
);
`;

// Schema description for LLM context
export const schemaDescription = `
Database Schema:

Table: vendor_spend
- id: INTEGER (Primary Key)
- vendor_name: TEXT (Name of the vendor/supplier)
- category: TEXT (Category of spend: IT Services, Marketing, Office Supplies, Travel, Consulting, Cloud Services, Legal, Logistics, HR Services, Software)
- amount: DECIMAL (Transaction amount in INR)
- transaction_date: DATE (Date of transaction, format: YYYY-MM-DD)
- department: TEXT (Department that made the purchase: Technology, Marketing, Admin, HR, Sales, Finance, Operations, Strategy, Legal, Executive)
- payment_status: TEXT (Payment status: Paid, Pending)
- invoice_number: TEXT (Invoice reference number)

Table: extracted_documents
- id: INTEGER (Primary Key)
- doc_type: TEXT (Type of document: invoice, receipt, contract, other)
- vendor_name: TEXT (Extracted vendor name)
- invoice_number: TEXT (Extracted invoice number)
- amount: DECIMAL (Extracted amount in INR)
- date: DATE (Extracted date)
- line_items: TEXT (JSON string of line items)
- confidence_score: DECIMAL (AI extraction confidence, 0-1)
- extracted_at: TIMESTAMP (When the document was processed)
- source_filename: TEXT (Original filename)
- status: TEXT (Review status: pending, approved, rejected)

Data covers: October 2024 - December 2024 (Q4 2024)
Total vendor_spend records: 62
Categories: IT Services, Marketing, Office Supplies, Travel, Consulting, Cloud Services, Legal, Logistics, HR Services, Software
`;
