import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pins = await prisma.dashboardPin.findMany({ include: { insight: true }, orderBy: { position: "asc" } });
  return NextResponse.json(pins);
}
