"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton({ label }: { label: string }) {
  return (
    <button className="btn-ghost" onClick={() => signOut({ callbackUrl: "/login" })}>
      {label}
    </button>
  );
}
