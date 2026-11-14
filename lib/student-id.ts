/**
 * Scholars Hub signs students in with their student ID instead of an email
 * address. Supabase Auth needs an email-shaped identifier, so we derive a
 * deterministic internal address that is never used to send mail.
 *
 * IMPORTANT: "Confirm email" must be turned OFF in Supabase
 * (Authentication -> Sign In / Providers -> Email) for this flow to work.
 */
export const STUDENT_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN ?? "students.scholarshub.app";

const STUDENT_ID_PATTERN = /^[A-Za-z0-9._-]{3,20}$/;

export function isValidStudentId(value: string) {
  return STUDENT_ID_PATTERN.test(value.trim());
}

export function normalizeStudentId(value: string) {
  return value.trim().toUpperCase();
}

export function studentIdToEmail(value: string) {
  const local = normalizeStudentId(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return `${local}@${STUDENT_EMAIL_DOMAIN}`;
}

export function studentIdFromEmail(email: string | undefined | null) {
  if (!email) return "";
  return email.split("@")[0]?.toUpperCase() ?? "";
}
