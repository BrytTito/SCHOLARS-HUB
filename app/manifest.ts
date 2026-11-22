import type { MetadataRoute } from "next";

/**
 * Android/desktop install metadata.
 *
 * The `any` icons are the rounded badge; `maskable` is full bleed because the
 * launcher crops it to its own shape, and a rounded tile on a transparent
 * background would show four white corners once masked.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Scholars Hub — weekly interactive study groups",
    short_name: "Scholars Hub",
    description:
      "Pick 1–3 courses, pay GH₵10 per course per week, and join study channels with polls, notices and a personal timetable.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfcfd",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/brand/logo-mark-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/logo-mark-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/logo-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
