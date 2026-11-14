"use client";

import { useActionState } from "react";
import { Megaphone } from "lucide-react";

import { createChannel, type ActionState } from "@/app/actions/channels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateChannelForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createChannel,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Channel name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Maths 121 — Revision Squad"
          required
          minLength={3}
          maxLength={60}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">What is it for? (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Weekly problem sets, past questions, meeting reminders..."
          maxLength={280}
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        <Megaphone className="mr-2 h-4 w-4" />
        {pending ? "Creating..." : "Create channel"}
      </Button>
    </form>
  );
}
