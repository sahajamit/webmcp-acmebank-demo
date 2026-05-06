import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { TransferPage } from './pages/Transfer';
import { RecipientsPage } from './pages/Recipients';
import { TransactionsPage } from './pages/Transactions';

export default function App() {
  const [mcpStatus, setMcpStatus] = useState<'active' | 'missing'>('missing');

  useEffect(() => {
    if (navigator.modelContext) setMcpStatus('active');
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="dot" />
          <div className="name">AcmeBank</div>
        </div>
        <NavLink to="/dashboard"   className={({isActive}) => `nav-item${isActive ? ' active' : ''}`}>Dashboard</NavLink>
        <NavLink to="/transfer"    className={({isActive}) => `nav-item${isActive ? ' active' : ''}`}>Transfer</NavLink>
        <NavLink to="/recipients"  className={({isActive}) => `nav-item${isActive ? ' active' : ''}`}>Recipients</NavLink>
        <NavLink to="/transactions"className={({isActive}) => `nav-item${isActive ? ' active' : ''}`}>Transactions</NavLink>

        <div className="mcp-badge">
          <span className="pill">MCP</span>
          {mcpStatus === 'active'  && 'Web MCP active · navigator.modelContext'}
          {mcpStatus === 'missing' && 'modelContext missing — enable chrome://flags/#enable-webmcp-testing'}
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/transfer"     element={<TransferPage />} />
          <Route path="/recipients"   element={<RecipientsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Routes>
      </main>
    </div>
  );
}
