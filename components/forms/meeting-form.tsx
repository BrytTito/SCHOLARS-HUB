"use client";

import { useActionState } from "react";
import { CalendarPlus } from "lucide-react";

import { addMeeting, type ActionState } from "@/app/actions/timetable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAYS, courseLabel } from "@/lib/courses";

export function MeetingForm({ courses }: { courses: string[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addMeeting,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="courseCode">Course</Label>
        <select
          id="courseCode"
          name="courseCode"
          required
          defaultValue={courses[0] ?? ""}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {courses.length === 0 && <option value="">No courses selected</option>}
          {courses.map((code) => (
            <option key={code} value={code}>
              {courseLabel(code)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="day">Day</Label>
          <select
            id="day"
            name="day"
            required
            defaultValue="1"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {DAYS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Venue (optional)</Label>
          <Input id="location" name="location" placeholder="e.g. Block B, Room 4" />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="startTime">Starts</Label>
          <Input id="startTime" name="startTime" type="time" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endTime">Ends</Label>
          <Input id="endTime" name="endTime" type="time" required />
        </div>
      </div>

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

      <Button type="submit" disabled={pending || courses.length === 0}>
        <CalendarPlus className="mr-2 h-4 w-4" />
        {pending ? "Adding..." : "Add meeting"}
      </Button>
    </form>
  );
}
