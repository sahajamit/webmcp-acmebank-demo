// Globally-registered tools — read-only, safe to expose on every page.
// Registered once at app boot in main.tsx. The contextual / sensitive
// tools (transferFunds, payBill, addRecipient) live on individual pages
// and use useTool() so they unregister when the user navigates away.

import { bank, fmtSGD } from '../store/bank';
import type { ToolDescriptor } from './types';

const getAccounts: ToolDescriptor = {
  name: 'getAccounts',
  description:
    'List all the user\'s bank accounts with current balances. Read-only. ' +
    'Use this when the user asks about their balances, total cash, or which accounts they have.',
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: true },
  execute() {
    const accounts = bank.get().accounts;
    const lines = accounts.map(a =>
      `• ${a.nickname} (${a.type}, •••• ${a.number}) — ${fmtSGD(a.balance)}`
    );
    const total = accounts
      .filter(a => a.type !== 'credit')
      .reduce((sum, a) => sum + a.balance, 0);
    return {
      content: [{
        type: 'text',
        text: `${lines.join('\n')}\n\nNet (excl. credit): ${fmtSGD(total)}`,
      }],
    };
  },
};

const getRecentTransactions: ToolDescriptor = {
  name: 'getRecentTransactions',
  description:
    'Return the user\'s most recent transactions across all accounts, newest first. ' +
    'Read-only. Use when the user asks "what did I spend on", "last payment to X", or "show recent activity".',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'How many transactions to return. Default 10, max 50.',
      },
    },
  },
  annotations: { readOnlyHint: true },
  execute(params) {
    const limit = Math.min(Math.max(Number(params.limit ?? 10), 1), 50);
    const txs = bank.get().transactions.slice(0, limit);
    const lines = txs.map(t => {
      const from = bank.findAccount(t.fromAccountId);
      const to = t.toRecipientId
        ? bank.get().recipients.find(r => r.id === t.toRecipientId)?.name ?? '(unknown)'
        : bank.findAccount(t.toAccountId ?? '')?.nickname ?? '(unknown)';
      const date = new Date(t.ts).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' });
      const tag = t.channel === 'agent' ? ' [agent]' : '';
      return `• ${date} — ${fmtSGD(t.amount)} from ${from?.nickname ?? '?'} → ${to}${t.memo ? ` (${t.memo})` : ''}${tag}`;
    });
    return {
      content: [{
        type: 'text',
        text: lines.length ? lines.join('\n') : 'No transactions yet.',
      }],
    };
  },
};

const findRecipient: ToolDescriptor = {
  name: 'findRecipient',
  description:
    'Search the user\'s saved payees / recipients by name, bank, or last-4 of account number. ' +
    'Read-only. Returns matching recipients with their IDs — pass the ID to transferFunds.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Free-text search; matches against name, bank, or last-4 of account number.',
      },
    },
    required: ['query'],
  },
  annotations: { readOnlyHint: true },
  execute(params) {
    const query = String(params.query ?? '');
    const matches = bank.findRecipient(query);
    if (matches.length === 0) {
      return { content: [{ type: 'text', text: `No saved recipients match "${query}".` }] };
    }
    const lines = matches.map(r =>
      `• ${r.name} — ${r.bank}, •••• ${r.accountNumber} (id: ${r.id})`
    );
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  },
};

export const GLOBAL_TOOLS: ToolDescriptor[] = [
  getAccounts,
  getRecentTransactions,
  findRecipient,
];

export function registerGlobalTools() {
  if (!navigator.modelContext) {
    console.warn(
      '[acmebank] navigator.modelContext is undefined. ' +
      'In Chrome Canary, enable chrome://flags/#enable-webmcp-testing and reload. ' +
      'Otherwise the polyfill bootstrap may have failed.'
    );
    return;
  }
  for (const tool of GLOBAL_TOOLS) {
    navigator.modelContext.registerTool(tool);
    console.log(`[acmebank] registered global tool: ${tool.name}`);
  }
}
