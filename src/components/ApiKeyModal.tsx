import { useState } from 'react';
import { Key, X, Loader2 } from 'lucide-react';
import { validateApiKey, initOpenAI } from '../utils/openai';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: (apiKey: string) => void;
  currentApiKey: string | null;
}

export function ApiKeyModal({ isOpen, onClose, onApiKeySet, currentApiKey }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const isValid = await validateApiKey(apiKey.trim());
      if (isValid) {
        initOpenAI(apiKey.trim());
        localStorage.setItem('openai_api_key', apiKey.trim());
        onApiKeySet(apiKey.trim());
        onClose();
      } else {
        setError('Invalid API key. Please check and try again.');
      }
    } catch {
      setError('Failed to validate API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('openai_api_key');
    onApiKeySet('');
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              <Key size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Configure API Key
            </h2>
            <p className="modal-subtitle">Enter your OpenAI API key to enable AI features</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} color="#9CA3AF" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">OpenAI API Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isValidating}
              />
              <p className="form-hint">
                Your API key is stored locally in your browser and never sent to our servers.
                Get your key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0054FF' }}
                >
                  OpenAI Dashboard
                </a>
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#FEE2E2',
                  borderRadius: '8px',
                  color: '#DC2626',
                  fontSize: '13px',
                  marginTop: '12px',
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            {currentApiKey && (
              <button type="button" className="btn btn-secondary" onClick={handleClear}>
                Clear Key
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-gradient" disabled={isValidating}>
              {isValidating ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Validating...
                </>
              ) : (
                'Save API Key'
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
