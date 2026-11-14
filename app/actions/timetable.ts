"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isCourseCode } from "@/lib/courses";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: string } | undefined;

export async function addMeeting(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const courseCode = String(formData.get("courseCode") ?? "");
  const day = Number(formData.get("day"));
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const location = String(formData.get("location") ?? "").trim();

  if (!isCourseCode(courseCode)) return { error: "Choose a valid course." };
  if (!Number.isInteger(day) || day < 0 || day > 6) {
    return { error: "Choose a valid day." };
  }
  if (!startTime || !endTime) return { error: "Set a start and end time." };
  if (endTime <= startTime) {
    return { error: "The end time must be after the start time." };
  }
  if (location.length > 120) {
    return { error: "Location must be 120 characters or fewer." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase.from("timetable_entries").insert({
    profile_id: user!.id,
    course_code: courseCode,
    day_of_week: day,
    start_time: startTime,
    end_time: endTime,
    location: location || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: "Meeting added to your timetable." };
}

export async function deleteMeeting(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  await supabase
    .from("timetable_entries")
    .delete()
    .eq("id", id)
    .eq("profile_id", user!.id);

  revalidatePath("/dashboard");
}
