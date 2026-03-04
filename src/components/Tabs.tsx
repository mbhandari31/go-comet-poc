import { MessageSquare, FileText, Database } from 'lucide-react';

type TabType = 'chat' | 'documents' | 'explorer';

interface TabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Analytics Chat', icon: <MessageSquare size={18} /> },
    { id: 'documents', label: 'Document Upload', icon: <FileText size={18} /> },
    { id: 'explorer', label: 'Data Explorer', icon: <Database size={18} /> },
  ];

  return (
    <div className="tabs-container">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
