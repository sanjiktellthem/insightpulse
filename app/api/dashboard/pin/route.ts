import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json() as { insightId: string; position: number };
  const pin = await prisma.dashboardPin.create({ data: body });
  return NextResponse.json(pin, { status: 201 });
}
