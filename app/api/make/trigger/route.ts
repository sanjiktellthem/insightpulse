import { NextResponse } from "next/server";
import { triggerMake } from "@/lib/make";

export async function POST(req: Request) {
  try {
    const body = await req.json() as { event: string; payload: unknown };
    const res = await triggerMake(body.event, body.payload);
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
