import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CalendarDays, Megaphone, Wallet } from "lucide-react";

import { MeetingForm } from "@/components/forms/meeting-form";
import { BlurFade } from "@/components/motion/blur-fade";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { TimetableGrid, type Meeting } from "@/components/timetable-grid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  COURSES,
  WEEKLY_PRICE_PER_COURSE,
  courseLabel,
  formatMoney,
  weeklyTotal,
} from "@/lib/courses";
import { firstRelation } from "@/lib/relations";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasSupabaseEnv) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [
    { data: profile },
    { data: enrollmentRows },
    { data: meetingRows },
    { data: channelRows },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("enrollments").select("course_code").eq("profile_id", user.id),
    supabase
      .from("timetable_entries")
      .select("*")
      .eq("profile_id", user.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("channels")
      .select("id, name, description, owner_id, profiles:owner_id (full_name)")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const selectedCourses: string[] = (enrollmentRows ?? []).map(
    (row: { course_code: string }) => row.course_code,
  );
  const meetings = (meetingRows ?? []) as Meeting[];
  const channels = (channelRows ?? []) as unknown as Array<{
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    profiles: { full_name: string }[] | { full_name: string } | null;
  }>;

  const total = weeklyTotal(selectedCourses.length);
  const displayName = profile?.full_name ?? "Student";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container-page space-y-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
            {profile && (
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.student_id} · {profile.school}
              </p>
            )}
          </div>
          <Button asChild>
            <Link href="/channels">
              <Megaphone className="mr-2 h-4 w-4" />
              Open channels
            </Link>
          </Button>
        </div>

        {!profile && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Your student profile is incomplete. Please sign out and register
            again, or contact your group lead.
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BlurFade delay={0.04}>
            <StatCard
              icon={<BookOpen className="h-4 w-4" />}
              label="Courses this week"
              value={String(selectedCourses.length)}
            />
          </BlurFade>
          <BlurFade delay={0.1}>
            <StatCard
              icon={<Wallet className="h-4 w-4" />}
              label="Weekly price"
              value={formatMoney(total)}
            />
          </BlurFade>
          <BlurFade delay={0.16}>
            <StatCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="Scheduled meetings"
              value={String(meetings.length)}
            />
          </BlurFade>
          <BlurFade delay={0.22}>
            <StatCard
              icon={<Megaphone className="h-4 w-4" />}
              label="Channels"
              value={String(channels.length)}
            />
          </BlurFade>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <BlurFade delay={0.26}>
              <Card>
                <CardHeader>
                  <CardTitle>My courses</CardTitle>
                  <CardDescription>
                    {formatMoney(WEEKLY_PRICE_PER_COURSE)} per course, per week.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No courses selected yet.
                    </p>
                  ) : (
                    selectedCourses.map((code, index) => (
                      <BlurFade key={code} delay={0.3 + index * 0.06}>
                        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                          <span className="text-sm font-medium">
                            {courseLabel(code)}
                          </span>
                          <span className="text-sm">
                            {formatMoney(WEEKLY_PRICE_PER_COURSE)}
                          </span>
                        </div>
                      </BlurFade>
                    ))
                  )}
                  <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-3">
                    <span className="text-sm font-semibold text-primary">
                      Total per week
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatMoney(total)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>

            <BlurFade delay={0.32}>
              <Card>
                <CardHeader>
                  <CardTitle>My timetable</CardTitle>
                  <CardDescription>
                    Your personal weekly meeting schedule.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <TimetableGrid meetings={meetings} />

                  <div className="rounded-xl border bg-muted/40 p-4">
                    <h3 className="mb-3 text-sm font-semibold">Add a meeting</h3>
                    <MeetingForm courses={selectedCourses} />
                  </div>
                </CardContent>
              </Card>
            </BlurFade>
          </div>

          <div className="space-y-6">
            <BlurFade delay={0.38}>
              <Card>
                <CardHeader>
                  <CardTitle>Study channels</CardTitle>
                  <CardDescription>Broadcast notices and polls.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {channels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No channels yet. Create the first one for your group.
                    </p>
                  ) : (
                    channels.map((channel, index) => (
                      <BlurFade key={channel.id} delay={0.42 + index * 0.06}>
                        <Link
                          href={`/channels/${channel.id}`}
                          className="block rounded-lg border px-3 py-2.5 transition hover:border-primary/50"
                        >
                          <p className="text-sm font-medium">{channel.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {firstRelation(channel.profiles)?.full_name
                              ? `by ${firstRelation(channel.profiles)?.full_name}`
                              : channel.description ?? "Channel"}
                          </p>
                        </Link>
                      </BlurFade>
                    ))
                  )}
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/channels">View all channels</Link>
                  </Button>
                </CardContent>
              </Card>
            </BlurFade>

            <BlurFade delay={0.44}>
              <Card>
                <CardHeader>
                  <CardTitle>Course catalogue</CardTitle>
                  <CardDescription>Available this semester.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {COURSES.map((course) => (
                    <div
                      key={course.code}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{course.short}</span>
                      <span className="text-muted-foreground">
                        {formatMoney(WEEKLY_PRICE_PER_COURSE)}/wk
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </BlurFade>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
