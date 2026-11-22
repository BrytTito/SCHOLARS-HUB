import { cn } from "@/lib/utils";

/**
 * The cap on its own, in `currentColor`, for use inside a coloured container —
 * the header, the auth pages and the registration card all put it on
 * `bg-primary`.
 *
 * The geometry is the same 64-unit grid as `app/icon.svg`, so the cap in the
 * header and the cap on the browser tab are the same drawing. The viewBox is
 * the art's bounding box: the container supplies the padding the favicon gets
 * from its own viewBox.
 */
export function LogoCap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="9 15 46 33"
      fill="currentColor"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      <path
        d="M32 17 54 26 32 35 10 26Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d="M19 28 32 34.5 45 28V38C45 43.5 39.5 46.5 32 46.5S19 43.5 19 38Z" />
      <path
        d="M54 26V36"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <circle cx="54" cy="39.4" r="2.4" />
    </svg>
  );
}
