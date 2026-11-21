import { NextResponse } from "next/server";

import { hasSupabaseEnv, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Liveness/readiness probe for the host.
 *
 * Always answers 200 while the Node process is serving: restarting the
 * container cannot fix a Supabase outage, so a failing database must not make
 * Railway roll back a healthy deploy. The body carries the diagnosis instead,
 * and never includes a key or a URL.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let database: "ok" | "unreachable" | "not-configured" = "not-configured";

  if (hasSupabaseEnv) {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/courses?select=code&limit=1`,
        {
          headers: { apikey: supabaseKey, Accept: "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(2500),
        },
      );
      database = response.ok ? "ok" : "unreachable";
    } catch {
      database = "unreachable";
    }
  }

  return NextResponse.json(
    {
      status: "ok",
      database,
      configured: hasSupabaseEnv,
      uptimeSeconds: Math.round(process.uptime()),
      checkMs: Date.now() - started,
    },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}
