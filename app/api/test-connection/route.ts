import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Initialize the secure server client
    const supabase = await createSupabaseServerClient();

    // 2. Test a basic query. 
    // We query the 'districts' table. It doesn't exist yet (that's Phase 4), 
    // but a "table does not exist" error is better than an auth/connection error!
    const { data, error } = await supabase
      .from("districts")
      .select("count", { count: "exact", head: true });

    if (error && error.code !== "42P01") { 
      // 42P01 is the Postgres code for "table does not exist", which is expected right now.
      // Any OTHER error means our connection or keys are wrong.
      throw error;
    }

    return NextResponse.json({ 
      status: "success", 
      message: "Supabase connected successfully! PostGIS is ready for Phase 4 schema.",
      envCheck: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : " Missing",
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing",
      }
    });
  } catch (err) {
    return NextResponse.json(
      { 
        status: "error", 
        message: err instanceof Error ? err.message : "Unknown connection error",
        hint: "Check your .env.local file and ensure there are no extra spaces or quotes around the keys."
      },
      { status: 500 }
    );
  }
}