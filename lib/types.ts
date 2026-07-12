// Enum-like constants enforced as TS unions (Prisma has no native enums on SQL Server)

export type Role = "ADMIN" | "MANAGER" | "OPERATOR";

export type ItemStatus =
  | "AVAILABLE"
  | "DEPLOYED"
  | "RETURNED_KEEP"
  | "IN_REPAIR"
  | "DISPOSED";

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
  "DEPLOYED",
  "RETURNED_KEEP",
  "IN_REPAIR",
  "DISPOSED",
];
export const CATEGORY_TYPES: CategoryType[] = ["FA", "NCA", "GENERAL"];
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
