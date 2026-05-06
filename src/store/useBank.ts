import { useEffect, useState } from 'react';
import { bank, BankState } from './bank';

export function useBank(): BankState {
  const [state, setState] = useState<BankState>(bank.get());
  useEffect(() => bank.subscribe(setState), []);
  return state;
}
