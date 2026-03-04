import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic } from 'sql.js';
import { vendorSpendData } from '../data/sampleData';

let db: Database | null = null;

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL: SqlJsStatic = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  });

  db = new SQL.Database();

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS vendor_spend (
      id INTEGER PRIMARY KEY,
      vendor_name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      transaction_date DATE NOT NULL,
      department TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      invoice_number TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS extracted_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    )
  `);

  // Seed vendor_spend data
  const insertStmt = db.prepare(`
    INSERT INTO vendor_spend (id, vendor_name, category, amount, transaction_date, department, payment_status, invoice_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  vendorSpendData.forEach((row) => {
    insertStmt.run([
      row.id,
      row.vendor_name,
      row.category,
      row.amount,
      row.transaction_date,
      row.department,
      row.payment_status,
      row.invoice_number,
    ]);
  });

  insertStmt.free();

  return db;
}

export function getDatabase(): Database | null {
  return db;
}

export function executeQuery(sql: string): { columns: string[]; values: unknown[][] } | null {
  if (!db) return null;

  try {
    const result = db.exec(sql);
    if (result.length === 0) {
      return { columns: [], values: [] };
    }
    return {
      columns: result[0].columns,
      values: result[0].values,
    };
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

export function runQuery(sql: string): void {
  if (!db) return;
  db.run(sql);
}

export function insertExtractedDocument(doc: {
  doc_type: string;
  vendor_name: string;
  invoice_number: string;
  amount: number;
  date: string;
  line_items: string;
  confidence_score: number;
  source_filename: string;
  status: string;
}): number | null {
  if (!db) return null;

  db.run(
    `INSERT INTO extracted_documents
     (doc_type, vendor_name, invoice_number, amount, date, line_items, confidence_score, source_filename, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      doc.doc_type,
      doc.vendor_name,
      doc.invoice_number,
      doc.amount,
      doc.date,
      doc.line_items,
      doc.confidence_score,
      doc.source_filename,
      doc.status,
    ]
  );

  // Get the last inserted ID
  const result = db.exec('SELECT last_insert_rowid()');
  return result[0]?.values[0]?.[0] as number || null;
}

export function getTableInfo(tableName: string): { name: string; type: string }[] {
  if (!db) return [];

  const result = db.exec(`PRAGMA table_info(${tableName})`);
  if (result.length === 0) return [];

  return result[0].values.map((row: (string | number | null | Uint8Array)[]) => ({
    name: row[1] as string,
    type: row[2] as string,
  }));
}

export function getTableRowCount(tableName: string): number {
  if (!db) return 0;

  const result = db.exec(`SELECT COUNT(*) FROM ${tableName}`);
  return result[0]?.values[0]?.[0] as number || 0;
}

export function getAllTables(): { name: string; rowCount: number }[] {
  if (!db) return [];

  const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  if (result.length === 0) return [];

  return result[0].values.map((row: (string | number | null | Uint8Array)[]) => {
    const tableName = row[0] as string;
    return {
      name: tableName,
      rowCount: getTableRowCount(tableName),
    };
  });
}
