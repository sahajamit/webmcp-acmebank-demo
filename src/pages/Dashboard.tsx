import { useBank } from '../store/useBank';
import { fmtSGD } from '../store/bank';

export function Dashboard() {
  const { accounts, transactions } = useBank();
  const recent = transactions.slice(0, 5);

  return (
    <>
      <h1 className="page-title">Good morning</h1>
      <p className="page-sub">Here's where your money is, right now.</p>

      <div className="banner">
        <strong>Try it:</strong> open the WebMCP Tool Inspector side panel and type <em>"What's my balance across all accounts?"</em> — the agent will call <code>getAccounts</code> directly. No screen scraping.
      </div>

      <div className="cards">
        {accounts.map(a => (
          <div key={a.id} className={`card ${a.type}`}>
            <div className="label">{a.type}</div>
            <div className="nick">{a.nickname}</div>
            <div className="num">•••• {a.number}</div>
            <div className="balance">{fmtSGD(a.balance)}</div>
          </div>
        ))}
      </div>

      <h2 className="section-title">Recent activity</h2>
      <div className="list">
        {recent.map(t => {
          const fromAcct = accounts.find(a => a.id === t.fromAccountId);
          return (
            <div key={t.id} className="list-row">
              <div className="date">{new Date(t.ts).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })}</div>
              <div>{t.memo ?? 'Transfer'} <span style={{ color: 'var(--text-dim)' }}>· from {fromAcct?.nickname}</span></div>
              <div className="amount">−{fmtSGD(t.amount)}</div>
              <div className={`channel${t.channel === 'agent' ? ' agent' : ''}`}>
                {t.channel === 'agent' ? 'via agent' : 'manual'}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
