import { Database, Key, Settings } from 'lucide-react';

interface HeaderProps {
  isApiKeyValid: boolean;
  onSettingsClick: () => void;
}

export function Header({ isApiKeyValid, onSettingsClick }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon">
            <Database size={22} />
          </div>
          <div className="logo-text">
            Data<span>Lens</span> AI
          </div>
        </div>
      </div>
      <div className="header-right">
        <div className={`api-key-indicator ${isApiKeyValid ? 'valid' : 'invalid'}`}>
          <Key size={14} />
          {isApiKeyValid ? 'API Key Connected' : 'API Key Required'}
        </div>
        <button className="btn btn-secondary btn-icon" onClick={onSettingsClick}>
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
