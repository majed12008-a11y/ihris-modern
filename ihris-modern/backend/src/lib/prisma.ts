import "../config";
import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Sprint 5.5 — Transaction wrapper support.
 *
 * When a test transaction is active (see src/__tests__/setup.ts), every Prisma
 * call made by the application is routed to the transaction client, so writes
 * performed during a test are rolled back afterwards.
 *
 * Nested `$transaction` calls (used by services for audit writes) reuse the
 * outer transaction instead of opening a new one.
 */
type TxClient = Prisma.TransactionClient;

let currentTx: TxClient | null = null;

export function setCurrentTransaction(tx: TxClient | null): void {
  currentTx = tx;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const baseClient: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseClient;

export const prisma: PrismaClient = new Proxy(baseClient, {
  get(target, prop: string | symbol) {
    const active: any = currentTx ?? target;

    if (currentTx) {
      if (prop === "$transaction") {
        return (arg: any) => (Array.isArray(arg) ? Promise.all(arg) : arg(currentTx));
      }
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => undefined;
      }
    }

    const value = active[prop];
    return typeof value === "function" ? value.bind(active) : value;
  },
}) as PrismaClient;
