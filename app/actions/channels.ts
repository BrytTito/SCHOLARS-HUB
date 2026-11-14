"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: string } | undefined;

const MAX_CHANNEL_NAME = 60;
const MAX_DESCRIPTION = 280;
const MAX_BODY = 1000;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createChannel(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 3 || name.length > MAX_CHANNEL_NAME) {
    return { error: "Channel name must be 3–60 characters." };
  }
  if (description.length > MAX_DESCRIPTION) {
    return { error: `Description must be under ${MAX_DESCRIPTION} characters.` };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Please sign in again." };

  const { data, error } = await supabase
    .from("channels")
    .insert({
      name,
      description: description || null,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/channels");
  revalidatePath("/dashboard");
  redirect(`/channels/${data.id}`);
}

export async function createPost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const channelId = String(formData.get("channelId") ?? "");
  const kind = String(formData.get("kind") ?? "notice");
  const body = String(formData.get("body") ?? "").trim();
  const rawOptions = String(formData.get("options") ?? "");

  if (!channelId) return { error: "Missing channel." };
  if (kind !== "notice" && kind !== "poll") {
    return { error: "Unknown post type." };
  }
  if (body.length < 1 || body.length > MAX_BODY) {
    return { error: "Write a message between 1 and 1000 characters." };
  }

  const options =
    kind === "poll"
      ? rawOptions
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      : [];

  if (kind === "poll") {
    if (options.length < 2) {
      return { error: "A poll needs at least two options (one per line)." };
    }
    if (options.length > 6) {
      return { error: "A poll can have at most six options." };
    }
    if (options.some((option) => option.length > 80)) {
      return { error: "Each poll option must be 80 characters or fewer." };
    }
  }

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Please sign in again." };

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      channel_id: channelId,
      author_id: user.id,
      kind,
      body,
    })
    .select("id")
    .single();

  if (postError) return { error: postError.message };

  if (kind === "poll" && post) {
    const { error: optionError } = await supabase
      .from("poll_options")
      .insert(
        options.map((label, index) => ({
          post_id: post.id,
          label,
          position: index,
        })),
      );
    if (optionError) return { error: optionError.message };
  }

  revalidatePath(`/channels/${channelId}`);
  return { success: kind === "poll" ? "Poll published." : "Notice published." };
}

export async function voteOnPoll(formData: FormData): Promise<void> {
  const postId = String(formData.get("postId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");
  const channelId = String(formData.get("channelId") ?? "");

  if (!postId || !optionId) return;

  const { supabase, user } = await requireUser();
  if (!user) redirect("/auth/login");

  await supabase.from("poll_votes").upsert(
    {
      post_id: postId,
      option_id: optionId,
      voter_id: user!.id,
    },
    { onConflict: "post_id,voter_id" },
  );

  if (channelId) revalidatePath(`/channels/${channelId}`);
}

export async function deletePost(formData: FormData): Promise<void> {
  const postId = String(formData.get("postId") ?? "");
  const channelId = String(formData.get("channelId") ?? "");

  if (!postId) return;

  const { supabase, user } = await requireUser();
  if (!user) redirect("/auth/login");

  await supabase.from("posts").delete().eq("id", postId).eq("author_id", user!.id);

  if (channelId) revalidatePath(`/channels/${channelId}`);
}
