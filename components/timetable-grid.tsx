import { Trash2 } from "lucide-react";

import { deleteMeeting } from "@/app/actions/timetable";
import { Button } from "@/components/ui/button";
import { DAYS, courseLabel, formatTime } from "@/lib/courses";

export type Meeting = {
  id: string;
  course_code: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
};

export function TimetableGrid({ meetings }: { meetings: Meeting[] }) {
  return (
    <div className="divide-y rounded-xl border">
      {DAYS.map((day) => {
        const dayMeetings = meetings
          .filter((meeting) => meeting.day_of_week === day.value)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));

        return (
          <div
            key={day.value}
            className="grid gap-2 px-4 py-3 sm:grid-cols-[110px_1fr]"
          >
            <p className="text-sm font-semibold text-muted-foreground">
              {day.label}
            </p>
            {dayMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground/70">No meeting</p>
            ) : (
              <ul className="space-y-2">
                {dayMeetings.map((meeting) => (
                  <li
                    key={meeting.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-accent/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {courseLabel(meeting.course_code)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(meeting.start_time)} –{" "}
                        {formatTime(meeting.end_time)}
                        {meeting.location ? ` · ${meeting.location}` : ""}
                      </p>
                    </div>
                    <form action={deleteMeeting}>
                      <input type="hidden" name="id" value={meeting.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-destructive"
                        aria-label="Remove meeting"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
