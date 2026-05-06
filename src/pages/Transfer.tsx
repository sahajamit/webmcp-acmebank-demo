import { useMemo, useState } from 'react';
import { useBank } from '../store/useBank';
import { bank, fmtSGD, parseSGD } from '../store/bank';
import { useTool } from '../mcp/useTool';
import { makeTransferFundsTool } from '../mcp/transferTool';

export function TransferPage() {
  const { accounts, recipients } = useBank();
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '');
  const [toId, setToId] = useState(recipients[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Per-page WebMCP tool — only registered while user is on this page.
  // The tool descriptor doesn't depend on local state, so it's stable.
  const transferTool = useMemo(() => makeTransferFundsTool(), []);
  useTool(transferTool);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    try {
      const tx = bank.transfer({
        fromAccountId: fromId,
        toRecipientId: toId,
        amount: parseSGD(amount),
        memo: memo || undefined,
        channel: 'ui',
      });
      setFeedback({ kind: 'ok', text: `Sent ${fmtSGD(tx.amount)}. Reference ${tx.id}.` });
      setAmount('');
      setMemo('');
    } catch (err) {
      setFeedback({ kind: 'err', text: (err as Error).message });
    }
  }

  return (
    <>
      <h1 className="page-title">Transfer money</h1>
      <p className="page-sub">Send to a saved recipient. While you're on this page, the WebMCP tool <code>transferFunds</code> is registered — leave the page and it un-registers.</p>

      <div className="banner">
        <strong>Agent demo:</strong> in the Tool Inspector, run <em>"Send $50 to Meena for dinner"</em>. The agent will call <code>findRecipient</code> + <code>transferFunds</code>. A confirm modal will pop — your approval is required before money moves.
      </div>

      <form className="form" onSubmit={submit}>
        <div className="form-row">
          <label>From</label>
          <select value={fromId} onChange={e => setFromId(e.target.value)}>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.nickname} (•••• {a.number}) — {fmtSGD(a.balance)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>To recipient</label>
          <select value={toId} onChange={e => setToId(e.target.value)}>
            {recipients.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.bank} •••• {r.accountNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label>Amount (SGD)</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        <div className="form-row">
          <label>Memo</label>
          <input
            type="text"
            placeholder="Optional note"
            value={memo}
            onChange={e => setMemo(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={!amount}>Send transfer</button>

        {feedback && (
          <div style={{
            marginTop: 4,
            color: feedback.kind === 'ok' ? 'var(--positive)' : 'var(--negative)',
            fontSize: 13,
          }}>
            {feedback.text}
          </div>
        )}
      </form>
    </>
  );
}
