import { createRoot, Root } from 'react-dom/client';
import { useEffect, useState } from 'react';

// The "agent wants to do X — approve?" modal. Used inside
// agent.requestUserInteraction() callbacks. Returns a promise that
// resolves with the user's choice. Built as an imperative API because
// it's invoked from tool execute() handlers, not from React render.

type ConfirmRequest = {
  title: string;
  details: Array<{ label: string; value: string }>;
  confirmLabel?: string;
  cancelLabel?: string;
};

let mountedRoot: Root | null = null;

function ensureMount(): HTMLElement {
  let host = document.getElementById('agent-confirm-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'agent-confirm-host';
    document.body.appendChild(host);
  }
  if (!mountedRoot) mountedRoot = createRoot(host);
  return host;
}

export function agentConfirm(req: ConfirmRequest): Promise<boolean> {
  ensureMount();
  return new Promise<boolean>((resolve) => {
    function close(result: boolean) {
      mountedRoot?.render(null);
      resolve(result);
    }
    mountedRoot?.render(<ConfirmModal req={req} onResolve={close} />);
  });
}

function ConfirmModal({ req, onResolve }: { req: ConfirmRequest; onResolve: (ok: boolean) => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(true); }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 15, 20, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: show ? 1 : 0,
        transition: 'opacity 180ms ease-out',
      }}
    >
      <div style={{
        width: 480,
        maxWidth: 'calc(100vw - 32px)',
        background: '#11161D',
        border: '1px solid #2a313c',
        borderRadius: 16,
        padding: 28,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        color: '#F5F2ED',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{
            display: 'inline-block', width: 10, height: 10, borderRadius: 5,
            background: '#FF5A4E', boxShadow: '0 0 0 4px rgba(255,90,78,0.18)',
          }} />
          <span style={{ fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: '#a8aebb' }}>
            Agent action — confirm
          </span>
        </div>

        <h2 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 600 }}>{req.title}</h2>

        <div style={{
          background: '#0B0F14',
          border: '1px solid #1f2630',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 22,
        }}>
          {req.details.map((d, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: i < req.details.length - 1 ? '1px solid #1f2630' : 'none',
            }}>
              <span style={{ color: '#a8aebb' }}>{d.label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{d.value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={() => onResolve(false)} style={btnSecondary}>
            {req.cancelLabel ?? 'Cancel'}
          </button>
          <button onClick={() => onResolve(true)} style={btnPrimary} autoFocus>
            {req.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: '#FF5A4E',
  color: '#0B0F14',
  border: 'none',
  borderRadius: 8,
  padding: '10px 18px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  background: 'transparent',
  color: '#F5F2ED',
  border: '1px solid #2a313c',
  borderRadius: 8,
  padding: '10px 18px',
  fontWeight: 500,
  fontSize: 14,
  cursor: 'pointer',
};
