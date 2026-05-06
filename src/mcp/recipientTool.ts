// addRecipient — registered ONLY on the Recipients page. Sensitive
// (adds a payee that future transfers can target), so it also routes
// through agent.requestUserInteraction for explicit approval.

import { bank } from '../store/bank';
import { agentConfirm } from './confirm';
import type { ToolDescriptor } from './types';

export function makeAddRecipientTool(): ToolDescriptor {
  return {
    name: 'addRecipient',
    description:
      'Save a new payee / recipient so future transfers can target them. ' +
      'Always pops a confirmation modal — the user must approve.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Display name for the recipient.' },
        bank: { type: 'string', description: 'Receiving bank, e.g. "DBS Bank", "OCBC".' },
        accountNumber: { type: 'string', description: 'Last 4 digits of recipient account number.' },
      },
      required: ['name', 'bank', 'accountNumber'],
    },
    async execute(params, agent) {
      const name = String(params.name).trim();
      const bankName = String(params.bank).trim();
      const last4 = String(params.accountNumber).trim().slice(-4);

      if (!name || !bankName || !last4) {
        return { content: [{ type: 'text', text: 'name, bank, and accountNumber are all required.' }], isError: true };
      }

      const approved = await agent.requestUserInteraction(async () => {
        return agentConfirm({
          title: 'Save new recipient?',
          details: [
            { label: 'Name',    value: name },
            { label: 'Bank',    value: bankName },
            { label: 'Account', value: `•••• ${last4}` },
          ],
          confirmLabel: 'Save recipient',
          cancelLabel: 'Cancel',
        });
      });

      if (!approved) {
        return { content: [{ type: 'text', text: 'Recipient not saved — user cancelled.' }], isError: true };
      }

      const recipient = bank.addRecipient(name, bankName, last4);
      return {
        content: [{
          type: 'text',
          text: `Saved ${recipient.name} (id: ${recipient.id}). Future transfers can use this ID.`,
        }],
      };
    },
  };
}
