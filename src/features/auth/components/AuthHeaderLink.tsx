"use client";
// Top-right link on the sign-up and login pages: offers the other one.
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AuthHeaderLink() {
  const path = usePathname();
  if (path.startsWith("/setup")) return null;
  const onLogin = path.startsWith("/login");
  return (
    <p className="text-sm text-muted">
      {onLogin ? "New to Rootline? " : "Already have an account? "}
      <Link href={onLogin ? "/signup" : "/login"}>{onLogin ? "Sign up" : "Log in"}</Link>
    </p>
  );
}
