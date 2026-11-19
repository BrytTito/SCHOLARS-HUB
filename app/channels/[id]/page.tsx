import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BarChart3, Megaphone, Trash2 } from "lucide-react";

import { deletePost } from "@/app/actions/channels";
import { PostForm } from "@/components/forms/post-form";
import { BlurFade } from "@/components/motion/blur-fade";
import { PollBlock, type PollOption } from "@/components/poll-block";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { firstRelation } from "@/lib/relations";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PostRow = {
  id: string;
  kind: "notice" | "poll";
  body: string;
  created_at: string;
  author_id: string;
  profiles: { full_name: string }[] | { full_name: string } | null;
  poll_options: Array<{
    id: string;
    label: string;
    position: number;
    poll_votes: Array<{ voter_id: string }> | null;
  }> | null;
};

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!hasSupabaseEnv) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: channel } = await supabase
    .from("channels")
    .select("id, name, description, owner_id, created_at, profiles:owner_id (full_name)")
    .eq("id", id)
    .maybeSingle();

  if (!channel) notFound();

  const { data: postData } = await supabase
    .from("posts")
    .select(
      `
        id, kind, body, created_at, author_id,
        profiles:author_id (full_name),
        poll_options ( id, label, position, poll_votes ( voter_id ) )
      `,
    )
    .eq("channel_id", id)
    .order("created_at", { ascending: false });

  const posts = (postData ?? []) as unknown as PostRow[];
  const isOwner = channel.owner_id === user.id;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container-page space-y-6 py-10">
        <Link
          href="/channels"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All channels
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <Megaphone className="h-6 w-6 text-primary" />
              {channel.name}
            </h1>
            {channel.description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {channel.description}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {firstRelation(channel.profiles)?.full_name
                ? `Broadcast by ${firstRelation(channel.profiles)?.full_name}`
                : "Broadcast channel"}
              {isOwner ? " · you own this channel" : ""}
            </p>
          </div>
        </div>

        {isOwner ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Broadcast</CardTitle>
              <CardDescription>
                Publish a notice or ask the group with a poll.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PostForm channelId={channel.id} />
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Only the channel owner can publish here. You can still read
            everything and vote on polls.
          </div>
        )}

        <section className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nothing has been published in this channel yet.
              </CardContent>
            </Card>
          ) : (
            posts.map((post, index) => {
              const options: PollOption[] = (post.poll_options ?? [])
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((option) => ({
                  id: option.id,
                  label: option.label,
                  voters: (option.poll_votes ?? []).map(
                    (vote) => vote.voter_id,
                  ),
                }));

              const myVote = options.find((option) =>
                option.voters.includes(user.id),
              )?.id;

              return (
                <BlurFade key={post.id} delay={Math.min(index, 6) * 0.06}>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            {post.kind === "poll" ? (
                              <BarChart3 className="h-4 w-4 text-primary" />
                            ) : (
                              <Megaphone className="h-4 w-4 text-primary" />
                            )}
                            {firstRelation(post.profiles)?.full_name ??
                              "Channel owner"}
                          </CardTitle>
                          <CardDescription>
                            {new Date(post.created_at).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </CardDescription>
                        </div>
                        {post.author_id === user.id && (
                          <form action={deletePost}>
                            <input type="hidden" name="postId" value={post.id} />
                            <input
                              type="hidden"
                              name="channelId"
                              value={channel.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-destructive"
                              aria-label="Delete post"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="whitespace-pre-wrap text-sm">{post.body}</p>
                      {post.kind === "poll" && options.length > 0 && (
                        <PollBlock
                          postId={post.id}
                          channelId={channel.id}
                          options={options}
                          myVote={myVote}
                        />
                      )}
                    </CardContent>
                  </Card>
                </BlurFade>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
