import { useState, useCallback } from 'react';
import { Upload, FileText, Check, X, Edit2, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ExtractedDocument } from '../types';
import { extractDocumentData } from '../utils/openai';
import { insertExtractedDocument } from '../utils/database';

interface DocumentUploadProps {
  isApiKeyValid: boolean;
  onDocumentStored: () => void;
}

export function DocumentUpload({ isApiKeyValid, onDocumentStored }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedDoc, setExtractedDoc] = useState<ExtractedDocument | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [storedDocs, setStoredDocs] = useState<ExtractedDocument[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (!isApiKeyValid) return;

    setIsProcessing(true);
    setExtractedDoc(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Extract data using vision API
      const extracted = await extractDocumentData(base64, file.name);
      setExtractedDoc(extracted);
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Failed to process document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        processFile(file);
      } else {
        alert('Please upload an image (PNG, JPG) or PDF file.');
      }
    },
    [isApiKeyValid]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFieldEdit = (field: string, value: string | number) => {
    if (!extractedDoc) return;
    setExtractedDoc({
      ...extractedDoc,
      [field]: value,
    });
    setEditingField(null);
  };

  const handleApprove = () => {
    if (!extractedDoc) return;

    // Store in database
    const id = insertExtractedDocument({
      doc_type: extractedDoc.docType,
      vendor_name: extractedDoc.vendorName,
      invoice_number: extractedDoc.invoiceNumber || '',
      amount: extractedDoc.amount,
      date: extractedDoc.date,
      line_items: JSON.stringify(extractedDoc.lineItems),
      confidence_score: extractedDoc.confidenceScore,
      source_filename: extractedDoc.sourceFilename,
      status: 'approved',
    });

    if (id) {
      const approvedDoc = { ...extractedDoc, status: 'approved' as const };
      setStoredDocs((prev) => [...prev, approvedDoc]);
      setExtractedDoc(null);
      onDocumentStored();
    }
  };

  const handleReject = () => {
    setExtractedDoc(null);
  };

  const getConfidenceClass = (confidence: number) => {
    return confidence < 0.8 ? 'low' : '';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Upload Zone */}
      <div className="card">
        <div className="card-body">
          <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <div className="upload-icon">
              <Upload size={28} />
            </div>
            <div className="upload-title">
              {isProcessing ? 'Processing document...' : 'Drop your document here'}
            </div>
            <div className="upload-subtitle">
              {isProcessing ? (
                <div className="loading-dots" style={{ justifyContent: 'center' }}>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              ) : (
                <>
                  or <span>browse files</span> (PDF, PNG, JPG up to 20MB)
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Extraction Review */}
      {extractedDoc && (
        <div className="extraction-card">
          <div className="extraction-header">
            <div className="extraction-title">
              <FileText size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Document Extracted
            </div>
            <div className="extraction-subtitle">
              {extractedDoc.sourceFilename} • Confidence: {(extractedDoc.confidenceScore * 100).toFixed(0)}%
            </div>
          </div>

          {extractedDoc.confidenceScore < 0.6 && (
            <div
              style={{
                padding: '12px 24px',
                background: '#FEF3C7',
                borderBottom: '1px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#92400E',
                fontSize: '13px',
              }}
            >
              <AlertTriangle size={16} />
              Low confidence extraction. Please review all fields carefully.
            </div>
          )}

          <div className="extraction-fields">
            {/* Document Type */}
            <div className="extraction-field">
              <span className="field-label">Document Type</span>
              <span className="field-value" style={{ textTransform: 'capitalize' }}>
                {extractedDoc.docType}
              </span>
            </div>

            {/* Vendor Name */}
            <div className={`extraction-field ${getConfidenceClass(extractedDoc.confidenceScore)}`}>
              <span className="field-label">Vendor Name</span>
              {editingField === 'vendorName' ? (
                <input
                  type="text"
                  className="form-input"
                  defaultValue={extractedDoc.vendorName}
                  onBlur={(e) => handleFieldEdit('vendorName', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFieldEdit('vendorName', (e.target as HTMLInputElement).value)}
                  autoFocus
                  style={{ flex: 1 }}
                />
              ) : (
                <span className="field-value">{extractedDoc.vendorName}</span>
              )}
              <span className={`field-confidence ${getConfidenceClass(extractedDoc.confidenceScore)}`}>
                {(extractedDoc.confidenceScore * 100).toFixed(0)}%
              </span>
              <Edit2
                size={16}
                className="field-edit-btn"
                onClick={() => setEditingField('vendorName')}
              />
            </div>

            {/* Invoice Number */}
            <div className="extraction-field">
              <span className="field-label">Invoice Number</span>
              {editingField === 'invoiceNumber' ? (
                <input
                  type="text"
                  className="form-input"
                  defaultValue={extractedDoc.invoiceNumber}
                  onBlur={(e) => handleFieldEdit('invoiceNumber', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFieldEdit('invoiceNumber', (e.target as HTMLInputElement).value)}
                  autoFocus
                  style={{ flex: 1 }}
                />
              ) : (
                <span className="field-value">{extractedDoc.invoiceNumber || 'N/A'}</span>
              )}
              <Edit2
                size={16}
                className="field-edit-btn"
                onClick={() => setEditingField('invoiceNumber')}
              />
            </div>

            {/* Amount */}
            <div className={`extraction-field ${getConfidenceClass(extractedDoc.confidenceScore)}`}>
              <span className="field-label">Amount</span>
              {editingField === 'amount' ? (
                <input
                  type="number"
                  className="form-input"
                  defaultValue={extractedDoc.amount}
                  onBlur={(e) => handleFieldEdit('amount', parseFloat(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleFieldEdit('amount', parseFloat((e.target as HTMLInputElement).value))}
                  autoFocus
                  style={{ flex: 1 }}
                />
              ) : (
                <span className="field-value" style={{ fontWeight: 600, color: '#0054FF' }}>
                  {formatCurrency(extractedDoc.amount)}
                </span>
              )}
              <span className={`field-confidence ${getConfidenceClass(extractedDoc.confidenceScore)}`}>
                {(extractedDoc.confidenceScore * 100).toFixed(0)}%
              </span>
              <Edit2
                size={16}
                className="field-edit-btn"
                onClick={() => setEditingField('amount')}
              />
            </div>

            {/* Date */}
            <div className="extraction-field">
              <span className="field-label">Date</span>
              {editingField === 'date' ? (
                <input
                  type="date"
                  className="form-input"
                  defaultValue={extractedDoc.date}
                  onBlur={(e) => handleFieldEdit('date', e.target.value)}
                  autoFocus
                  style={{ flex: 1 }}
                />
              ) : (
                <span className="field-value">
                  {new Date(extractedDoc.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
              <Edit2
                size={16}
                className="field-edit-btn"
                onClick={() => setEditingField('date')}
              />
            </div>

            {/* Line Items */}
            {extractedDoc.lineItems.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                  Line Items
                </h4>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Amount</th>
                        <th>Conf.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractedDoc.lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.description}</td>
                          <td>{item.quantity || 1}</td>
                          <td>{item.unitPrice ? formatCurrency(item.unitPrice) : '-'}</td>
                          <td>{formatCurrency(item.amount)}</td>
                          <td>
                            <span className={`badge ${item.confidence >= 0.8 ? 'badge-success' : 'badge-warning'}`}>
                              {(item.confidence * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="extraction-actions">
            <button className="btn btn-secondary" onClick={handleReject}>
              <X size={16} />
              Reject
            </button>
            <button className="btn btn-gradient" onClick={handleApprove}>
              <Check size={16} />
              Approve & Store
            </button>
          </div>
        </div>
      )}

      {/* Stored Documents */}
      {storedDocs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Stored Documents</h3>
              <p className="card-subtitle">These documents are now queryable via the Analytics Chat</p>
            </div>
            <span className="badge badge-success">
              <CheckCircle size={12} />
              {storedDocs.length} stored
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {storedDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} color="#0054FF" />
                          {doc.sourceFilename}
                        </div>
                      </td>
                      <td>{doc.vendorName}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(doc.amount)}</td>
                      <td>{new Date(doc.date).toLocaleDateString('en-IN')}</td>
                      <td>
                        <span className={`badge ${doc.confidenceScore >= 0.8 ? 'badge-success' : 'badge-warning'}`}>
                          {(doc.confidenceScore * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
