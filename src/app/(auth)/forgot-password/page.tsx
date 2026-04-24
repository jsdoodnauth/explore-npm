import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset password — Meridian" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
