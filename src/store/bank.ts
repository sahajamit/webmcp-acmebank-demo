// In-memory bank state. Persisted to localStorage so a refresh keeps the
// demo conversation going. Tiny pub-sub so React + WebMCP tools can both
// drive the UI without a heavier state lib.

export type Account = {
  id: string;
  nickname: string;
  type: 'checking' | 'savings' | 'credit';
  number: string;        // last 4 digits, displayed as "•••• 1234"
  balance: number;       // SGD, kept as cents to avoid float drift
  currency: 'SGD';
};

export type Recipient = {
  id: string;
  name: string;
  bank: string;
  accountNumber: string; // last 4 digits
};

export type Transaction = {
  id: string;
  ts: number;            // epoch ms
  fromAccountId: string;
  toRecipientId?: string;
  toAccountId?: string;
  amount: number;        // cents
  memo?: string;
  status: 'completed' | 'pending' | 'failed';
  channel: 'ui' | 'agent';
};

export type BankState = {
  accounts: Account[];
  recipients: Recipient[];
  transactions: Transaction[];
};

const STORAGE_KEY = 'acmebank.state.v1';

const SEED: BankState = {
  accounts: [
    { id: 'acc_chk', nickname: 'Everyday Checking', type: 'checking', number: '4071', balance: 482_3500, currency: 'SGD' },
    { id: 'acc_sav', nickname: 'Rainy Day Savings', type: 'savings',  number: '8821', balance: 2_140_0000, currency: 'SGD' },
    { id: 'acc_crd', nickname: 'Travel Credit',     type: 'credit',   number: '0312', balance:   -67_4200, currency: 'SGD' },
  ],
  recipients: [
    { id: 'rcp_meena',  name: 'Meena Iyer',     bank: 'DBS Bank',         accountNumber: '5621' },
    { id: 'rcp_arjun',  name: 'Arjun Pillai',   bank: 'OCBC',             accountNumber: '9034' },
    { id: 'rcp_landlord', name: 'Landlord — 21B Cantonment', bank: 'UOB', accountNumber: '4412' },
    { id: 'rcp_powerco', name: 'SP Group (utilities)', bank: 'Standard Chartered', accountNumber: '7800' },
  ],
  transactions: [
    { id: 't_1', ts: Date.now() - 1000 * 60 * 60 * 6,         fromAccountId: 'acc_chk', toRecipientId: 'rcp_powerco', amount:  187_4500, memo: 'Apr utilities',     status: 'completed', channel: 'ui' },
    { id: 't_2', ts: Date.now() - 1000 * 60 * 60 * 24 * 1,    fromAccountId: 'acc_chk', toRecipientId: 'rcp_meena',   amount:   42_0000, memo: 'Dinner split',      status: 'completed', channel: 'ui' },
    { id: 't_3', ts: Date.now() - 1000 * 60 * 60 * 24 * 2,    fromAccountId: 'acc_sav', toAccountId: 'acc_chk',       amount:  500_0000, memo: 'Top up checking',   status: 'completed', channel: 'ui' },
    { id: 't_4', ts: Date.now() - 1000 * 60 * 60 * 24 * 3,    fromAccountId: 'acc_chk', toRecipientId: 'rcp_landlord',amount: 2_400_0000,memo: 'Rent — May',        status: 'completed', channel: 'ui' },
    { id: 't_5', ts: Date.now() - 1000 * 60 * 60 * 24 * 5,    fromAccountId: 'acc_chk', toRecipientId: 'rcp_arjun',   amount:   18_5000, memo: 'Cab share',         status: 'completed', channel: 'ui' },
  ],
};

function load(): BankState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as BankState;
  } catch {}
  return structuredClone(SEED);
}

function save(state: BankState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state: BankState = load();
type Listener = (s: BankState) => void;
const listeners = new Set<Listener>();

function emit() {
  save(state);
  for (const l of listeners) l(state);
}

export const bank = {
  get(): BankState { return state; },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  reset() {
    state = structuredClone(SEED);
    emit();
  },

  findAccount(id: string): Account | undefined {
    return state.accounts.find(a => a.id === id);
  },

  findRecipient(query: string): Recipient[] {
    const q = query.trim().toLowerCase();
    if (!q) return state.recipients;
    return state.recipients.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.bank.toLowerCase().includes(q) ||
      r.accountNumber.includes(q)
    );
  },

  addRecipient(name: string, bank: string, accountNumber: string): Recipient {
    const recipient: Recipient = {
      id: `rcp_${Date.now().toString(36)}`,
      name, bank, accountNumber,
    };
    state = { ...state, recipients: [...state.recipients, recipient] };
    emit();
    return recipient;
  },

  transfer(opts: {
    fromAccountId: string;
    toRecipientId?: string;
    toAccountId?: string;
    amount: number; // cents
    memo?: string;
    channel: 'ui' | 'agent';
  }): Transaction {
    const from = state.accounts.find(a => a.id === opts.fromAccountId);
    if (!from) throw new Error(`No source account: ${opts.fromAccountId}`);
    if (opts.amount <= 0) throw new Error('Amount must be positive');
    if (from.type !== 'credit' && from.balance < opts.amount) {
      throw new Error(`Insufficient funds in ${from.nickname}`);
    }

    const tx: Transaction = {
      id: `t_${Date.now().toString(36)}`,
      ts: Date.now(),
      fromAccountId: opts.fromAccountId,
      toRecipientId: opts.toRecipientId,
      toAccountId: opts.toAccountId,
      amount: opts.amount,
      memo: opts.memo,
      status: 'completed',
      channel: opts.channel,
    };

    const accounts = state.accounts.map(a => {
      if (a.id === opts.fromAccountId) return { ...a, balance: a.balance - opts.amount };
      if (a.id === opts.toAccountId)   return { ...a, balance: a.balance + opts.amount };
      return a;
    });

    state = { ...state, accounts, transactions: [tx, ...state.transactions] };
    emit();
    return tx;
  },
};

export function fmtSGD(cents: number): string {
  const dollars = cents / 10000;
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
  }).format(dollars);
}

export function parseSGD(input: string | number): number {
  if (typeof input === 'number') return Math.round(input * 10000);
  const cleaned = input.replace(/[^0-9.\-]/g, '');
  const f = parseFloat(cleaned);
  if (isNaN(f)) throw new Error(`Cannot parse amount: ${input}`);
  return Math.round(f * 10000);
}
