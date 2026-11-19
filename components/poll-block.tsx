import { Check } from "lucide-react";

import { voteOnPoll } from "@/app/actions/channels";
import { cn } from "@/lib/utils";

export type PollOption = {
  id: string;
  label: string;
  voters: string[];
};

export function PollBlock({
  postId,
  channelId,
  options,
  myVote,
}: {
  postId: string;
  channelId: string;
  options: PollOption[];
  myVote?: string;
}) {
  const totalVotes = options.reduce(
    (sum, option) => sum + option.voters.length,
    0,
  );

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const votes = option.voters.length;
        const percent = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
        const chosen = myVote === option.id;

        return (
          <form key={option.id} action={voteOnPoll}>
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="optionId" value={option.id} />
            <input type="hidden" name="channelId" value={channelId} />
            <button
              type="submit"
              className={cn(
                "relative w-full overflow-hidden rounded-lg border px-3 py-2.5 text-left text-sm transition hover:border-primary/60",
                chosen && "border-primary",
              )}
            >
              <span
                aria-hidden
                className="poll-bar absolute inset-y-0 left-0 bg-primary/10"
                style={{ width: `${percent}%` }}
              />
              <span className="relative flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-medium">
                  {chosen && <Check className="h-3.5 w-3.5 text-primary" />}
                  {option.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {votes} · {percent}%
                </span>
              </span>
            </button>
          </form>
        );
      })}
      <p className="text-xs text-muted-foreground">
        {totalVotes === 0
          ? "No votes yet — be the first."
          : `${totalVotes} vote${totalVotes === 1 ? "" : "s"} · tap an option to vote or change your vote.`}
      </p>
    </div>
  );
}
