export const WEEKLY_PRICE_PER_COURSE = 10;

export const COURSES = [
  { code: "MATH121", title: "Mathematics 121", short: "Maths 121" },
  { code: "MATH123", title: "Mathematics 123", short: "Maths 123" },
  { code: "STAT111", title: "Statistics 111", short: "Stats 111" },
] as const;

export type CourseCode = (typeof COURSES)[number]["code"];

export const COURSE_CODES: CourseCode[] = COURSES.map((course) => course.code);

export function isCourseCode(value: string): value is CourseCode {
  return COURSE_CODES.includes(value as CourseCode);
}

export function courseByCode(code: string) {
  return COURSES.find((course) => course.code === code);
}

export function courseLabel(code: string) {
  const course = courseByCode(code);
  return course ? `${course.short} (${course.code})` : code;
}

export function weeklyTotal(courseCount: number) {
  return courseCount * WEEKLY_PRICE_PER_COURSE;
}

export function formatMoney(amount: number) {
  return `GH₵${amount.toFixed(2)}`;
}

export const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 0, label: "Sunday", short: "Sun" },
] as const;

export function dayLabel(day: number) {
  return DAYS.find((entry) => entry.value === day)?.label ?? "Unknown";
}

/** Converts a Postgres `time` value ("14:05:00") into "2:05 PM". */
export function formatTime(value: string) {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  if (Number.isNaN(hours)) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutesRaw?.slice(0, 2) ?? "00"} ${suffix}`;
}
