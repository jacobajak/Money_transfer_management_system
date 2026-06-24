import { Transaction, CashLedger, Branch, Employee, Settlement } from "./types.js";

/**
 * Calculates net ledger balances owed between branches.
 * If branch A sends SSP 100,000 to branch B, branch B pays it out with its local physical cash.
 * A collected physical cash, while B spent physical cash.
 * Therefore, B owes A (or B has a negative balance relative to A).
 * In South Sudan MTMS:
 * "Bor receives SSP 10M, Juba pays SSP 8M -> Bor owes Juba SSP 8M."
 * Wait! Let's follow the document example: "Bor receives SSP 10M. Juba pays SSP 8M. System records Bor owes Juba SSP 8M."
 * Let's compute this meticulously:
 * For every PAID transaction:
 * - The source branch collected: Amount + Commission (from Sender)
 * - The destination branch physically disbursed: Amount (to Receiver)
 * Let's calculate the net flow:
 * We want to track bilateral debt:
 * For each pair of branches, we tally how much has been sent from X to Y.
 * If Juba branch sends MT-1 to Bor branch (with amount SSP 100,000):
 * - Juba branch received SSP 100,000 digital cash to pay Bor.
 * - Bor branch paid out SSP 100,000 physical cash.
 * - Therefore, Bor branch is "down" SSP 100,000 and Juba is "up" SSP 100,000.
 * - So Juba has collected Bor's money, meaning Bor physically paid out Juba's transfer.
 * - So Juba owes Bor SSP 100,000? No, wait!
 * - The document says: "Bor receives SSP 10M. Juba pays SSP 8M. Bor owes Juba SSP 8M."
 * Let's look at this carefully:
 * - Bor receives (collects from senders) SSP 10M destination Juba.
 * - Juba pays (disburses to recipients) SSP 8M.
 * - Yes, Bor collected 10M Juba bound. Juba has distributed 8M Bor bound.
 * - Therefore Juba has physically paid out 8M on Bor's behalf, and Bor has collected 10M Juba bound.
 * - Bor has surplus collection, Juba has deficit disburser.
 * - So Bor owes Juba the 8M Juba paid out!
 * Let's generalize:
 * When Branch A sells a remittance bound for Branch B:
 * - Branch A collects cash (representing Branch B's future obligation).
 * - When B pays it out, B spent cash on A's behalf.
 * - Therefore B is owed that money by A!
 * - So A owes B that paid amount!
 * Let's make an absolute exact computation matrix:
 * We can compute for every PAID transaction:
 * - sourceBranchId owes destinationBranchId the 'amount'.
 * - Then we subtract any actual APPROVED or SETTLED physical Settlements between them.
 */
export interface BilateralDebt {
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  amount: number;
}

export function calculateRemittanceDebts(
  branches: Branch[],
  transactions: Transaction[],
  settlements: Settlement[]
): BilateralDebt[] {
  const branchMap = new Map(branches.map(b => [b.id, b]));
  
  // Matrix of dues: matrix[source][dest] = amount source owes dest
  const debts: { [key: string]: { [key: string]: number } } = {};
  
  branches.forEach(b1 => {
    debts[b1.id] = {};
    branches.forEach(b2 => {
      debts[b1.id][b2.id] = 0;
    });
  });

  // Calculate remittance obligations
  // Only PAID transactions represent executed transfers that need financial branch-to-branch balancing
  transactions.forEach(t => {
    if (t.status === "PAID" && t.sourceBranchId !== t.destinationBranchId) {
      if (debts[t.sourceBranchId] && debts[t.sourceBranchId][t.destinationBranchId] !== undefined) {
        // Source collected the cash, destination paid out, so Source owes Destination
        debts[t.sourceBranchId][t.destinationBranchId] += t.amount;
      }
    }
  });

  // Factor in executed or approved Settlements
  // A Settlement from X to Y of amount A reduces X's debt to Y
  settlements.forEach(s => {
    if (s.status === "SETTLED" || s.status === "APPROVED") {
      if (debts[s.fromBranchId] && debts[s.fromBranchId][s.toBranchId] !== undefined) {
        // Physical settlement occurred - reduce the debt
        debts[s.fromBranchId][s.toBranchId] -= s.amount;
      }
    }
  });

  const list: BilateralDebt[] = [];
  branches.forEach(b1 => {
    branches.forEach(b2 => {
      if (b1.id !== b2.id) {
        const owed = debts[b1.id][b2.id];
        if (owed > 0) {
          list.push({
            fromBranchId: b1.id,
            fromBranchName: branchMap.get(b1.id)?.name || b1.name,
            toBranchId: b2.id,
            toBranchName: branchMap.get(b2.id)?.name || b2.name,
            amount: owed,
          });
        }
      }
    });
  });

  return list;
}

/**
 * Calculates current cash balances for each branch.
 * Current Balance = Opening Balance (from Opening ledger reference) + Cash In - Cash Out
 */
export function calculateBranchBalances(
  branches: Branch[],
  ledgers: CashLedger[]
): { [branchId: string]: number } {
  const balances: { [branchId: string]: number } = {};
  
  branches.forEach(b => {
    balances[b.id] = 0;
  });

  ledgers.forEach(l => {
    if (balances[l.branchId] !== undefined) {
      if (l.type === "CASH_IN") {
        balances[l.branchId] += l.amount;
      } else if (l.type === "CASH_OUT") {
        balances[l.branchId] -= l.amount;
      } else if (l.type === "ADJUSTMENT") {
        balances[l.branchId] += l.amount; // Adjustment can be negative or positive
      }
    }
  });

  return balances;
}

/**
 * Generates an elegant PDF-like / print-ready recipe receipt.
 */
export function generateReceiptTemplate(tx: Transaction, branchNames: { [id: string]: string }): string {
  const totalCollected = tx.amount + tx.commission;
  return `
========================================
     NILE MONEY TRANSFER CO. LTD.
        South Sudan Remittance
========================================
REM CODE:  ${tx.transactionCode}
SEC PIN:   ${tx.pin}
STATUS:    ${tx.status}
DATE:      ${new Date(tx.createdAt).toLocaleString()}
----------------------------------------
SENDER DETAILS:
Name:      ${tx.senderName}
Phone:     ${tx.senderPhone}
Location:  ${tx.senderLocation}
ID Number: ${tx.senderIdNum || "N/A"}

RECIPIENT DETAILS:
Name:      ${tx.receiverName}
Phone:     ${tx.receiverPhone}
Payout at: ${branchNames[tx.destinationBranchId] || tx.destinationBranchId}
----------------------------------------
CURRENCY:   ${tx.currency}
AMOUNT:     ${tx.amount.toLocaleString()}
COMMISSION: ${tx.commission.toLocaleString()}
TOTAL:      ${totalCollected.toLocaleString()}
----------------------------------------
OPERATOR:   ${tx.createdByName || tx.createdBy}
ORIGIN:     ${branchNames[tx.sourceBranchId] || tx.sourceBranchId}
----------------------------------------
Rule: Share Security PIN only with receiver.
Recipient must present matching phone number 
and valid civil identity card at terminal.
========================================
`;
}

/**
 * Formats values to SSP / USD formats.
 */
export function formatCurrencyValue(amount: number, currency: "SSP" | "USD" = "SSP"): string {
  if (currency === "USD") {
    return `$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `SSP ${amount.toLocaleString()}`;
}
