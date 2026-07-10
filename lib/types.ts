// Enum-like constants enforced as TS unions (Prisma has no native enums on SQL Server)

export type Role = "ADMIN" | "MANAGER" | "OPERATOR";

export type ItemStatus =
  | "AVAILABLE"
  | "DEPLOYED"
  | "RETURNED_KEEP"
  | "IN_REPAIR"
  | "DISPOSED";

export type CategoryType = "FA" | "NCA" | "OTHER";

export type TransactionType = "RECEIVE" | "RELEASE" | "RETURN";

export const ROLES: Role[] = ["ADMIN", "MANAGER", "OPERATOR"];
export const ITEM_STATUSES: ItemStatus[] = [
  "AVAILABLE",
  "DEPLOYED",
  "RETURNED_KEEP",
  "IN_REPAIR",
  "DISPOSED",
];
export const CATEGORY_TYPES: CategoryType[] = ["FA", "NCA", "OTHER"];
export const TRANSACTION_TYPES: TransactionType[] = [
  "RECEIVE",
  "RELEASE",
  "RETURN",
];
