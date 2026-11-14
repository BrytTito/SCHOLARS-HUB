import Link from "next/link";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-accent/40 p-6">
      <Card className="w-full max-w-md text-center shadow-sm">
        <CardHeader>
          <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" />
          </span>
          <CardTitle className="text-xl">Check your inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your account was created. Confirm the email that was sent to you,
            then sign in with your student ID.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
