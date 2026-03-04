import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Table, Copy, Check, Download, Database, Calendar, Hash } from 'lucide-react';
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
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Message } from '../types';
import { generateSQLFromQuestion, generateAnswerFromData, handleOutOfScopeQuery } from '../utils/openai';
import { executeQuery } from '../utils/database';

const CHART_COLORS = ['#0054FF', '#A033FF', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#EC4899'];

interface ChatInterfaceProps {
  isApiKeyValid: boolean;
}

export function ChatInterface({ isApiKeyValid }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isApiKeyValid || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.role === 'user' ? m.content : m.content + (m.sqlQuery ? `\n[SQL: ${m.sqlQuery}]` : ''),
      }));

      // Generate SQL from question
      const { sql, explanation, chartType, chartConfig } = await generateSQLFromQuestion(
        userMessage.content,
        conversationHistory
      );

      // Execute the SQL query
      let data: Record<string, unknown>[] = [];
      let error: string | undefined;

      try {
        const result = executeQuery(sql);
        if (result && result.values.length > 0) {
          data = result.values.map((row) => {
            const obj: Record<string, unknown> = {};
            result.columns.forEach((col, i) => {
              obj[col] = row[i];
            });
            return obj;
          });
        }
      } catch (sqlError) {
        error = sqlError instanceof Error ? sqlError.message : 'SQL execution failed';
      }

      let answerContent: string;
      if (error) {
        answerContent = await handleOutOfScopeQuery(userMessage.content);
      } else if (data.length === 0) {
        answerContent = `No data found for your query. The dataset covers vendor spending from October-December 2024. ${explanation}`;
      } else {
        answerContent = await generateAnswerFromData(userMessage.content, sql, data, explanation);
      }

      const assistantMessage: Message = {
        id: loadingMessage.id,
        role: 'assistant',
        content: answerContent,
        timestamp: new Date(),
        sqlQuery: error ? undefined : sql,
        data: error ? undefined : data,
        chartType: error || data.length === 0 ? undefined : chartType,
        chartConfig: error || data.length === 0 ? undefined : chartConfig,
        source: error || data.length === 0 ? undefined : {
          tableName: 'vendor_spend',
          rowCount: data.length,
          dateRange: 'Oct - Dec 2024',
        },
        error,
      };

      setMessages((prev) => prev.map((m) => (m.id === loadingMessage.id ? assistantMessage : m)));
    } catch (err) {
      const errorMessage: Message = {
        id: loadingMessage.id,
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
        error: err instanceof Error ? err.message : 'Unknown error',
      };
      setMessages((prev) => prev.map((m) => (m.id === loadingMessage.id ? errorMessage : m)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(sql);
    setTimeout(() => setCopiedSql(null), 2000);
  };

  const handleExportCsv = (data: Record<string, unknown>[]) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderChart = (message: Message) => {
    if (!message.data || !message.chartType || !message.chartConfig) return null;

    const { chartType, chartConfig, data } = message;
    const { xKey, yKey, title } = chartConfig;

    return (
      <div className="chart-container">
        <div className="chart-title">{title}</div>
        <ResponsiveContainer width="100%" height={250}>
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey={xKey} stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey={yKey} fill="#0054FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey={xKey} stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey={yKey} stroke="#0054FF" strokeWidth={2} dot={{ fill: '#0054FF' }} />
            </LineChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : null}
        </ResponsiveContainer>
      </div>
    );
  };

  const renderDataTable = (data: Record<string, unknown>[]) => {
    if (data.length === 0) return null;

    const columns = Object.keys(data[0]);
    const displayData = data.slice(0, 10);

    return (
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col.replace(/_/g, ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col}>
                    {typeof row[col] === 'number'
                      ? row[col].toLocaleString('en-IN')
                      : String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 10 && (
          <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6B7280', borderTop: '1px solid #E5E7EB' }}>
            Showing 10 of {data.length} rows
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <MessageSquare size={32} />
            </div>
            <h3 className="empty-state-title">Start a Conversation</h3>
            <p className="empty-state-text">
              Ask questions about vendor spending data in natural language. Try: "Show total spend by category last quarter"
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className="message-content">
              {message.isLoading ? (
                <div className="loading-dots">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              ) : (
                <>
                  <div className="message-text">{message.content}</div>

                  {message.source && (
                    <div className="source-citation">
                      <div className="source-citation-title">Data Source</div>
                      <div className="source-citation-details">
                        <span className="source-citation-item">
                          <Database size={14} />
                          {message.source.tableName}
                        </span>
                        <span className="source-citation-item">
                          <Hash size={14} />
                          {message.source.rowCount} rows
                        </span>
                        <span className="source-citation-item">
                          <Calendar size={14} />
                          {message.source.dateRange}
                        </span>
                      </div>
                    </div>
                  )}

                  {message.chartType && message.data && renderChart(message)}

                  {message.data && message.data.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                          <Table size={14} style={{ display: 'inline', marginRight: '6px' }} />
                          Result Data
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleExportCsv(message.data!)}
                        >
                          <Download size={14} />
                          Export CSV
                        </button>
                      </div>
                      {renderDataTable(message.data)}
                    </div>
                  )}

                  {message.sqlQuery && (
                    <div className="sql-display">
                      <div className="sql-header">
                        <span className="sql-label">SQL Query</span>
                        <button
                          className="sql-copy-btn"
                          onClick={() => handleCopySql(message.sqlQuery!)}
                        >
                          {copiedSql === message.sqlQuery ? (
                            <>
                              <Check size={12} />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="sql-code">{message.sqlQuery}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder={isApiKeyValid ? 'Ask a question about your data...' : 'Please configure your API key first...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={!isApiKeyValid || isLoading}
            rows={1}
          />
          <button
            type="submit"
            className="btn btn-gradient"
            disabled={!isApiKeyValid || isLoading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

// Import MessageSquare for empty state
import { MessageSquare } from 'lucide-react';
