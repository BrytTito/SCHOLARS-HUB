import Link from "next/link";
import { GraduationCap, LayoutDashboard, Megaphone } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { studentIdFromEmail } from "@/lib/student-id";

export async function SiteHeader() {
  let signedIn = false;
  let displayName = "";

  if (hasEnvVars) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      signedIn = true;
      displayName =
        (user.user_metadata?.full_name as string | undefined) ??
        studentIdFromEmail(user.email);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-base tracking-tight">Scholars Hub</span>
        </Link>

        {signedIn ? (
          <>
            <nav className="hidden items-center gap-1 text-sm md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/channels">
                  <Megaphone className="mr-2 h-4 w-4" />
                  Channels
                </Link>
              </Button>
            </nav>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {displayName}
              </span>
              <LogoutButton />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Register</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
