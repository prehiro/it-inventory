import { z } from "zod";
import { ITEM_TYPES } from "@/lib/types";

// ItemModel (master data)
export const itemModelSchema = z.object({
  type: z.enum(ITEM_TYPES),
  category: z.enum(["FA", "NCA", "GENERAL"]),
  model: z.string().min(1, "Model required").max(200),
  brand: z.string().min(1, "Brand required").max(200),
});
export type ItemModelInput = z.infer<typeof itemModelSchema>;

// Receive (adds a new physical item)
export const receiveSchema = z.object({
  modelId: z.string().uuid("Invalid model"),
  serialNumber: z.string().min(1).max(200),
  poNumber: z.string().max(100).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  remarks: z.string().max(500).optional().or(z.literal("")),
});
export type ReceiveInput = z.infer<typeof receiveSchema>;

// Batch Receive (multiple serials, one shared model/location/po)
export const batchReceiveSchema = z.object({
  modelId: z.string().uuid("Invalid model"),
  poNumber: z.string().max(100).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  remarks: z.string().max(500).optional().or(z.literal("")),
  lines: z.array(z.string().max(200)),
});
export type BatchReceiveInput = z.infer<typeof batchReceiveSchema>;

// Release (deploy an item to an assignee)
export const releaseSchema = z.object({
  itemId: z.string().uuid("Invalid item"),
  assigneeEmpNumber: z.string().min(1).max(50),
  assigneeName: z.string().min(1).max(200),
  assigneeDept: z.string().max(200).optional().or(z.literal("")),
  gid: z.string().min(1, "GID required").max(100),
  email: z.string().email("Invalid email").max(200),
  hostname: z.string().max(200).optional().or(z.literal("")),
  remarks: z.string().max(500).optional().or(z.literal("")),
});
export type ReleaseInput = z.infer<typeof releaseSchema>;

// Return (item comes back)
export const returnSchema = z.object({
  itemId: z.string().uuid("Invalid item"),
  disposition: z.enum(["KEEP", "REPAIR", "DISPOSE"]),
  returningPicName: z.string().min(1).max(200),
  gid: z.string().min(1, "GID required").max(100),
  email: z.string().email("Invalid email").max(200),
  returnReason: z.string().max(500).optional().or(z.literal("")),
});
export type ReturnInput = z.infer<typeof returnSchema>;

// User management (Admin)
export const userSchema = z.object({
  employeeNumber: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  department: z.string().max(200).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]),
  password: z.string().min(6, "Min 6 characters"),
});
export type UserInput = z.infer<typeof userSchema>;
