import { useState, useEffect } from 'react';
import { Database, Table, RefreshCw } from 'lucide-react';
import { getAllTables, getTableInfo, executeQuery } from '../utils/database';

export function DataExplorer() {
  const [tables, setTables] = useState<{ name: string; rowCount: number }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableSchema, setTableSchema] = useState<{ name: string; type: string }[]>([]);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = () => {
    setIsLoading(true);
    const allTables = getAllTables();
    setTables(allTables);
    if (allTables.length > 0 && !selectedTable) {
      setSelectedTable(allTables[0].name);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

  const loadTableData = (tableName: string) => {
    const schema = getTableInfo(tableName);
    setTableSchema(schema);

    const result = executeQuery(`SELECT * FROM ${tableName} LIMIT 100`);
    if (result) {
      const data = result.values.map((row) => {
        const obj: Record<string, unknown> = {};
        result.columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });
      setTableData(data);
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') return value.toLocaleString('en-IN');
    return String(value);
  };

  return (
    <div className="explorer-grid">
      {/* Sidebar - Table List */}
      <div className="explorer-sidebar">
        <div className="explorer-sidebar-header">
          <Database size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Data Tables
        </div>
        <div className="table-list">
          {tables.map((table) => (
            <div
              key={table.name}
              className={`table-item ${selectedTable === table.name ? 'active' : ''}`}
              onClick={() => setSelectedTable(table.name)}
            >
              <div className="table-icon">
                <Table size={16} />
              </div>
              <div>
                <div className="table-name">{table.name}</div>
                <div className="table-rows">{table.rowCount} rows</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Table Data */}
      <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">{selectedTable || 'Select a table'}</h3>
            <p className="card-subtitle">
              {tableSchema.length > 0 && `${tableSchema.length} columns • ${tableData.length} rows (max 100)`}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadTables}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Schema Info */}
        {tableSchema.length > 0 && (
          <div style={{ padding: '12px 24px', background: '#F5F9FC', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>
              SCHEMA
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tableSchema.map((col) => (
                <span
                  key={col.name}
                  style={{
                    padding: '4px 10px',
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <strong>{col.name}</strong>
                  <span style={{ color: '#9CA3AF', marginLeft: '4px' }}>{col.type}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Data Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <div className="empty-state">
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            </div>
          ) : tableData.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  {tableSchema.map((col) => (
                    <th key={col.name}>{col.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx}>
                    {tableSchema.map((col) => (
                      <td key={col.name}>{formatValue(row[col.name])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Table size={32} />
              </div>
              <h3 className="empty-state-title">No Data</h3>
              <p className="empty-state-text">This table is empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
