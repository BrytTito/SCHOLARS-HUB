import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Megaphone, PlusCircle } from "lucide-react";

import { CreateChannelForm } from "@/components/forms/create-channel-form";
import { BlurFade } from "@/components/motion/blur-fade";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
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

export const metadata = { title: "Channels" };
export const dynamic = "force-dynamic";

type ChannelRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  profiles: { full_name: string }[] | { full_name: string } | null;
};

export default async function ChannelsPage() {
  if (!hasSupabaseEnv) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data } = await supabase
    .from("channels")
    .select("id, name, description, owner_id, created_at, profiles:owner_id (full_name)")
    .order("created_at", { ascending: false });

  const channels = (data ?? []) as unknown as ChannelRow[];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container-page space-y-8 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channels</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every channel is a broadcast board for notices and polls. You can
            create your own and share it with your study group.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="space-y-3">
            {channels.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Megaphone className="h-6 w-6" />
                  </span>
                  <p className="font-medium">No channels yet</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Create the first channel for your course — then post
                    notices and run polls from it.
                  </p>
                </CardContent>
              </Card>
            ) : (
              channels.map((channel, index) => (
                <BlurFade key={channel.id} delay={index * 0.06}>
                  <Link
                    href={`/channels/${channel.id}`}
                    className="card-lift block rounded-xl border bg-card p-5 hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-semibold">{channel.name}</h2>
                        {channel.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {channel.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {firstRelation(channel.profiles)?.full_name
                            ? `Owned by ${firstRelation(channel.profiles)?.full_name}`
                            : "Broadcast channel"}
                          {channel.owner_id === user.id ? " · you" : ""}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  </Link>
                </BlurFade>
              ))
            )}
          </section>

          <aside>
            <Card className="lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PlusCircle className="h-4 w-4" />
                  New channel
                </CardTitle>
                <CardDescription>
                  Anyone can create a channel. Only the owner can broadcast.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateChannelForm />
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
