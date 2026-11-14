import Link from "next/link";
import { Database } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Shown on protected pages until Supabase credentials are configured. */
export function SetupNotice() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-page py-16">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </span>
            <CardTitle>Connect Supabase to continue</CardTitle>
            <CardDescription>
              The app is running, but it needs a database and auth project
              before students can register.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Create a free project at{" "}
                <a
                  href="https://supabase.com/dashboard"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  supabase.com/dashboard
                </a>
                .
              </li>
              <li>
                Run <code className="rounded bg-muted px-1">supabase/schema.sql</code>{" "}
                in the SQL editor.
              </li>
              <li>
                Turn off <strong>Confirm email</strong> in Authentication →
                Sign In / Providers → Email.
              </li>
              <li>
                Put the project URL and publishable key in{" "}
                <code className="rounded bg-muted px-1">.env.local</code>, then
                restart the dev server.
              </li>
            </ol>
            <p>
              Details are in the project{" "}
              <Link
                href="/"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                README
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
