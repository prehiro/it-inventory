import type { Role } from "@/lib/types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    employeeNumber: string;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      employeeNumber: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    employeeNumber?: string;
  }
}
