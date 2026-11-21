import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";

import { SetupNotice } from "@/components/setup-notice";
import { SignUpForm } from "@/components/sign-up-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default function SignUpPage() {
  // Without credentials the browser client throws only after the student has
  // filled the whole form. Fail early, with instructions, instead.
  if (!hasSupabaseEnv) return <SetupNotice />;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-accent/40 p-6 md:p-10">
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          Scholars Hub
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
