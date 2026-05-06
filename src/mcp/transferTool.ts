// transferFunds — registered ONLY on the Transfer page. This is the
// load-bearing demo tool: agent calls it, the page pops a confirm
// modal via agent.requestUserInteraction, user reviews, transaction
// goes through. Showcases:
//   - per-page tool scoping (it's gone when you navigate away)
//   - human-in-the-loop with requestUserInteraction
//   - structured output the agent can parrot back to the user

import { bank, fmtSGD, parseSGD } from '../store/bank';
import { agentConfirm } from './confirm';
import type { ToolDescriptor } from './types';

export function makeTransferFundsTool(): ToolDescriptor {
  return {
    name: 'transferFunds',
    description:
      'Send money from one of the user\'s accounts to a saved recipient or another of their accounts. ' +
      'Always pops a confirmation modal — the user must approve before the transfer goes through. ' +
      'Use after findRecipient and getAccounts to resolve IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        fromAccountId: {
          type: 'string',
          description: 'Source account ID (from getAccounts).',
        },
        toRecipientId: {
          type: 'string',
          description: 'Destination recipient ID (from findRecipient). Either toRecipientId or toAccountId is required.',
        },
        toAccountId: {
          type: 'string',
          description: 'For internal transfers: another of the user\'s account IDs. Either toRecipientId or toAccountId is required.',
        },
        amount: {
          type: 'number',
          description: 'Amount in SGD (e.g. 250.50).',
        },
        memo: {
          type: 'string',
          description: 'Optional note on the transfer.',
        },
      },
      required: ['fromAccountId', 'amount'],
    },
    async execute(params, agent) {
      const fromId = String(params.fromAccountId);
      const toRecipientId = params.toRecipientId ? String(params.toRecipientId) : undefined;
      const toAccountId = params.toAccountId ? String(params.toAccountId) : undefined;
      const memo = params.memo ? String(params.memo) : undefined;

      if (!toRecipientId && !toAccountId) {
        return { content: [{ type: 'text', text: 'Need either toRecipientId or toAccountId.' }], isError: true };
      }

      const amountCents = parseSGD(params.amount as number);
      const from = bank.findAccount(fromId);
      if (!from) {
        return { content: [{ type: 'text', text: `Unknown source account: ${fromId}` }], isError: true };
      }

      const toLabel = toRecipientId
        ? bank.get().recipients.find(r => r.id === toRecipientId)?.name ?? toRecipientId
        : bank.findAccount(toAccountId!)?.nickname ?? toAccountId!;

      // The human-in-the-loop moment. The agent can ask, but the user
      // must look at the modal and click Confirm before the tool resolves.
      const approved = await agent.requestUserInteraction(async () => {
        return agentConfirm({
          title: 'Approve transfer?',
          details: [
            { label: 'From',   value: `${from.nickname} (•••• ${from.number})` },
            { label: 'To',     value: toLabel },
            { label: 'Amount', value: fmtSGD(amountCents) },
            ...(memo ? [{ label: 'Memo', value: memo }] : []),
          ],
          confirmLabel: 'Approve & send',
          cancelLabel: 'Cancel',
        });
      });

      if (!approved) {
        return {
          content: [{ type: 'text', text: 'Transfer cancelled by user. No money moved.' }],
          isError: true,
        };
      }

      try {
        const tx = bank.transfer({
          fromAccountId: fromId,
          toRecipientId,
          toAccountId,
          amount: amountCents,
          memo,
          channel: 'agent',
        });
        return {
          content: [{
            type: 'text',
            text: `Transfer ${tx.id} for ${fmtSGD(amountCents)} from ${from.nickname} to ${toLabel} completed.`,
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Transfer failed: ${(err as Error).message}` }],
          isError: true,
        };
      }
    },
  };
}
