// Transactions persistence hook

import { STORAGE_KEYS } from "../lib/storageKeys";
import type { Transaction } from "../lib/types";
import { useLocalStorage } from "./useLocalStorage";

export function useTransactions(ticker: string) {
  const [allTransactions, setAllTransactions] = useLocalStorage<
    Record<string, Transaction[]>
  >(STORAGE_KEYS.TRANSACTIONS, {});

  const transactions = allTransactions[ticker] || [];

  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `${Date.now()}-${Math.random()}`,
    };

    setAllTransactions((prev) => ({
      ...prev,
      [ticker]: [...(prev[ticker] || []), newTransaction].sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      ),
    }));
  };

  const deleteTransaction = (id: string) => {
    setAllTransactions((prev) => ({
      ...prev,
      [ticker]: (prev[ticker] || []).filter((t) => t.id !== id),
    }));
  };

  return { transactions, addTransaction, deleteTransaction, allTransactions };
}
