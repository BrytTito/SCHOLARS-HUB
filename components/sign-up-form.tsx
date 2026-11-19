"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  COURSES,
  WEEKLY_PRICE_PER_COURSE,
  formatMoney,
  weeklyTotal,
  type CourseCode,
} from "@/lib/courses";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  isValidStudentId,
  normalizeStudentId,
  studentIdToEmail,
} from "@/lib/student-id";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [selected, setSelected] = useState<CourseCode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const total = useMemo(() => weeklyTotal(selected.length), [selected.length]);

  function toggleCourse(code: CourseCode) {
    setSelected((current) => {
      if (current.includes(code)) {
        return current.filter((item) => item !== code);
      }
      if (current.length >= 3) return current;
      return [...current, code];
    });
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isValidStudentId(studentId)) {
      setError(
        "Student ID must be 3–20 characters: letters, numbers, dot, dash or underscore.",
      );
      return;
    }
    if (fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (school.trim().length < 2) {
      setError("Please enter your school.");
      return;
    }
    if (selected.length < 1) {
      setError("Select at least one course (you can pick up to three).");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      const normalizedId = normalizeStudentId(studentId);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: studentIdToEmail(normalizedId),
        password,
        options: {
          data: {
            student_id: normalizedId,
            full_name: fullName.trim(),
            school: school.trim(),
          },
        },
      });
      if (signUpError) throw signUpError;

      // Email confirmation is on: no session yet, so profile data waits.
      if (!data.session || !data.user) {
        router.push("/auth/sign-up-success");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        student_id: normalizedId,
        full_name: fullName.trim(),
        school: school.trim(),
      });

      if (profileError) {
        if (profileError.code === "23505") {
          throw new Error(
            "That student ID is already registered. Try signing in instead.",
          );
        }
        throw profileError;
      }

      const { error: enrolmentError } = await supabase
        .from("enrollments")
        .insert(
          selected.map((code) => ({
            profile_id: data.user!.id,
            course_code: code,
          })),
        );
      if (enrolmentError) throw enrolmentError;

      router.push("/dashboard");
      router.refresh();
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="shadow-sm">
        <CardHeader>
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </span>
          <CardTitle className="text-2xl">Register for Scholars Hub</CardTitle>
          <CardDescription>
            One account, {formatMoney(WEEKLY_PRICE_PER_COURSE)} per course per
            week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="student-id">Student ID</Label>
              <Input
                id="student-id"
                name="studentId"
                placeholder="e.g. 10987654"
                required
                autoComplete="username"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your student ID is also your login name.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                name="fullName"
                placeholder="e.g. Ama Mensah"
                required
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="school">School</Label>
              <Input
                id="school"
                name="school"
                placeholder="e.g. University of Ghana"
                required
                value={school}
                onChange={(event) => setSchool(event.target.value)}
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium leading-none">
                Select 1–3 courses
              </legend>
              <div className="grid gap-2">
                {COURSES.map((course) => {
                  const checked = selected.includes(course.code);
                  const disabled = !checked && selected.length >= 3;
                  return (
                    <label
                      key={course.code}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-3 transition",
                        checked
                          ? "border-primary bg-primary/5"
                          : "border-input bg-background hover:border-primary/40",
                        disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="courses"
                          value={course.code}
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleCourse(course.code)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span>
                          <span className="block text-sm font-medium">
                            {course.short}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {course.code} · {course.title}
                          </span>
                        </span>
                      </span>
                      <span className="text-sm font-medium">
                        {formatMoney(WEEKLY_PRICE_PER_COURSE)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex items-center justify-between rounded-lg bg-accent px-3 py-3">
              <span className="text-sm font-medium text-accent-foreground">
                Weekly price ({selected.length} course
                {selected.length === 1 ? "" : "s"})
              </span>
              <span className="text-lg font-bold text-accent-foreground">
                {formatMoney(total)}
              </span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                required
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                At least 6 characters. Tap the eye to check what you typed.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="repeat-password">Repeat password</Label>
              <PasswordInput
                id="repeat-password"
                required
                autoComplete="new-password"
                minLength={6}
                value={repeatPassword}
                onChange={(event) => setRepeatPassword(event.target.value)}
              />
            </div>

            {error && (
              <p
                key={error}
                className="shake rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating your account..." : "Create account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
