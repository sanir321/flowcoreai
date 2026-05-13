import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasDbConfig = !!(supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY);

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      services: {
        database: hasDbConfig ? "configured" : "missing_config",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: "Health check failed" },
      { status: 500 },
    );
  }
}
