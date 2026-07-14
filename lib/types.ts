// Enum-like constants enforced as TS unions (Prisma has no native enums on SQL Server)

export type Role = "ADMIN" | "MANAGER" | "OPERATOR";

export type ItemStatus =
  | "AVAILABLE"
  | "RELEASED"
  | "RETURNED_KEEP"
  | "IN_REPAIR"
  | "PLAN_DISPOSE";

export type CategoryType = "FA" | "NCA" | "GENERAL";

export type ItemType =
  | "PC"
  | "Laptop"
  | "Tablet"
  | "Mouse"
  | "Keyboard"
  | "Monitor"
  | "Projector"
  | "Camera"
  | "CCTV"
  | "Printer"
  | "Kensington"
  | "Adaptor";

export type TransactionType = "RECEIVE" | "RELEASE" | "RETURN";

export const ROLES: Role[] = ["ADMIN", "MANAGER", "OPERATOR"];
export const ITEM_STATUSES: ItemStatus[] = [
  "AVAILABLE",
  "RELEASED",
  "RETURNED_KEEP",
  "IN_REPAIR",
  "PLAN_DISPOSE",
];
export const CATEGORY_TYPES: CategoryType[] = ["FA", "NCA", "GENERAL"];

// Display labels differ from internal status values (DB union stays stable).
// RELEASED → "RELEASED" (was DEPLOYED), PLAN_DISPOSE → "PLAN DISPOSE" (was DISPOSED).
export function statusLabel(status: string): string {
  if (status === "PLAN_DISPOSE") return "PLAN DISPOSE";
  if (status === "RETURNED_KEEP") return "RETURNED_KEEP";
  return status;
}
export const ITEM_TYPES: ItemType[] = [
  "PC",
  "Laptop",
  "Tablet",
  "Mouse",
  "Keyboard",
  "Monitor",
  "Projector",
  "Camera",
  "CCTV",
  "Printer",
  "Kensington",
  "Adaptor",
];
export const TRANSACTION_TYPES: TransactionType[] = [
  "RECEIVE",
  "RELEASE",
  "RETURN",
];

// Item types that require a hostname at release (PC Ledger scope)
export const HOSTNAME_TYPES: ItemType[] = ["PC", "Laptop", "Tablet"];
