import { useBank } from '../store/useBank';
import { bank, fmtSGD } from '../store/bank';

export function TransactionsPage() {
  const { transactions, recipients, accounts } = useBank();

  return (
    <>
      <h1 className="page-title">Transactions</h1>
      <p className="page-sub">All movements across your accounts. Rows tagged <em>via agent</em> were initiated by a Web MCP tool call.</p>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <button className="btn-secondary" onClick={() => bank.reset()}>Reset demo data</button>
      </div>

      <div className="list">
        <div className="list-row" style={{ background: 'rgba(255,255,255,0.02)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-dim)' }}>
          <div>Date</div>
          <div>Detail</div>
          <div style={{ textAlign: 'right' }}>Amount</div>
          <div style={{ textAlign: 'right' }}>Channel</div>
        </div>
        {transactions.map(t => {
          const from = accounts.find(a => a.id === t.fromAccountId);
          const to = t.toRecipientId
            ? recipients.find(r => r.id === t.toRecipientId)?.name ?? '?'
            : accounts.find(a => a.id === t.toAccountId)?.nickname ?? '?';
          return (
            <div key={t.id} className="list-row">
              <div className="date">{new Date(t.ts).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              <div>
                <div>{t.memo ?? 'Transfer'}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{from?.nickname} → {to}</div>
              </div>
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
