import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Megaphone,
  Users,
  Wallet,
} from "lucide-react";

import { BlurFade } from "@/components/motion/blur-fade";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COURSES, WEEKLY_PRICE_PER_COURSE, formatMoney } from "@/lib/courses";

const features = [
  {
    icon: Wallet,
    title: "Simple weekly pricing",
    body: "Every course costs GH₵10 per week. Pick one, two or three — your weekly total is calculated instantly at registration.",
  },
  {
    icon: Megaphone,
    title: "Broadcast channels",
    body: "Create a channel for your group and broadcast notices. Run quick polls so decisions are made by the whole study group.",
  },
  {
    icon: CalendarDays,
    title: "Personal timetable",
    body: "Build your own weekly calendar with meeting days, times and venues. Your schedule, your way.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-accent/60 to-background">
          <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <BlurFade>
                <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Personal interactive study groups
                </span>
              </BlurFade>
              <BlurFade delay={0.06}>
                <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                  Study together.
                  <span className="block text-primary">Score higher.</span>
                </h1>
              </BlurFade>
              <BlurFade delay={0.12}>
                <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                  Scholars Hub connects students taking Maths 121, Maths 123 and
                  Stats 111 into focused weekly study groups — with shared
                  channels, live polls and a timetable you control.
                </p>
              </BlurFade>

              <BlurFade delay={0.18} className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/auth/sign-up">
                    Register now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/login">I already have an account</Link>
                </Button>
              </BlurFade>

              <BlurFade delay={0.24}>
                <p className="mt-4 text-sm text-muted-foreground">
                  {formatMoney(WEEKLY_PRICE_PER_COURSE)} per course, per week ·
                  Cancel any week
                </p>
              </BlurFade>
            </div>

            {/* Price preview card */}
            <BlurFade delay={0.15} direction="left">
              <Card className="mx-auto w-full max-w-md shadow-sm">
                <CardHeader>
                  <CardDescription>Weekly plan preview</CardDescription>
                  <CardTitle className="text-xl">Your study basket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {COURSES.map((course, index) => (
                    <BlurFade key={course.code} delay={0.25 + index * 0.08}>
                      <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{course.short}</p>
                            <p className="text-xs text-muted-foreground">
                              {course.code}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium">
                          {formatMoney(WEEKLY_PRICE_PER_COURSE)}
                        </span>
                      </div>
                    </BlurFade>
                  ))}
                  <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-3">
                    <span className="text-sm font-medium text-primary">
                      Weekly total
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatMoney(WEEKLY_PRICE_PER_COURSE * COURSES.length)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You choose between 1 and 3 courses during registration.
                  </p>
                </CardContent>
              </Card>
            </BlurFade>
          </div>
        </section>

        {/* Courses */}
        <section className="container-page py-16">
          <BlurFade inView className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Courses available this semester
            </h2>
            <p className="text-sm text-muted-foreground">
              Select any combination — all three courses are taught in small,
              interactive groups.
            </p>
          </BlurFade>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {COURSES.map((course, index) => (
              <BlurFade
                key={course.code}
                inView
                delay={index * 0.08}
                className="h-full"
              >
                <Card className="card-lift h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{course.short}</CardTitle>
                      <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                        {course.code}
                      </span>
                    </div>
                    <CardDescription>{course.title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {formatMoney(WEEKLY_PRICE_PER_COURSE)}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        / week
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </BlurFade>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-y bg-card">
          <div className="container-page py-16">
            <BlurFade inView>
              <h2 className="text-2xl font-bold tracking-tight">
                Everything your study group needs
              </h2>
            </BlurFade>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {features.map((feature, index) => (
                <BlurFade
                  key={feature.title}
                  inView
                  delay={index * 0.08}
                  className="h-full"
                >
                  <div className="card-lift h-full rounded-xl border bg-background p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <feature.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {feature.body}
                    </p>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="container-page py-16">
          <BlurFade inView>
            <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
          </BlurFade>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Register",
                body: "Enter your student ID, school and name, then select 1–3 courses.",
              },
              {
                step: "2",
                title: "See your weekly price",
                body: "Each course adds GH₵10 per week. The total updates as you choose.",
              },
              {
                step: "3",
                title: "Join the conversation",
                body: "Use channels for notices and polls, and plan meeting days in your timetable.",
              },
            ].map((item, index) => (
              <BlurFade
                key={item.step}
                inView
                delay={index * 0.08}
                className="h-full"
              >
                <li className="card-lift h-full rounded-xl border bg-card p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {item.step}
                  </span>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </li>
              </BlurFade>
            ))}
          </ol>

          <BlurFade inView delay={0.1} className="mt-12">
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-primary px-6 py-8 text-primary-foreground sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-semibold">Ready to join your group?</h3>
                <p className="mt-1 text-sm text-primary-foreground/80">
                  Registration takes under a minute. Start with one course if you
                  like.
                </p>
              </div>
              <Button asChild size="lg" variant="secondary">
                <Link href="/auth/sign-up">
                  Create my account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </BlurFade>
        </section>
      </main>

      <footer className="border-t">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Scholars Hub</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Maths 121 · Maths 123 · Stats 111
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
