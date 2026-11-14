"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { BarChart3, Send } from "lucide-react";

import { createPost, type ActionState } from "@/app/actions/channels";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function PostForm({ channelId }: { channelId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createPost,
    undefined,
  );
  const [kind, setKind] = useState<"notice" | "poll">("notice");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="channelId" value={channelId} />
      <input type="hidden" name="kind" value={kind} />

      <div className="inline-flex rounded-lg border bg-muted p-1">
        <button
          type="button"
          onClick={() => setKind("notice")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition",
            kind === "notice"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          Notice
        </button>
        <button
          type="button"
          onClick={() => setKind("poll")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
            kind === "poll"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Poll
        </button>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="body">
          {kind === "poll" ? "Poll question" : "Message"}
        </Label>
        <Textarea
          id="body"
          name="body"
          required
          maxLength={1000}
          placeholder={
            kind === "poll"
              ? "e.g. Which day should we meet for revision?"
              : "e.g. Revision session this Thursday at 6pm, Block B."
          }
        />
      </div>

      {kind === "poll" && (
        <div className="grid gap-2">
          <Label htmlFor="options">Options — one per line</Label>
          <Textarea
            id="options"
            name="options"
            placeholder={"Thursday\nFriday\nSaturday"}
          />
          <p className="text-xs text-muted-foreground">
            2–6 options. Everyone in the channel gets one vote.
          </p>
        </div>
      )}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        <Send className="mr-2 h-4 w-4" />
        {pending
          ? "Publishing..."
          : kind === "poll"
            ? "Publish poll"
            : "Publish notice"}
      </Button>
    </form>
  );
}
