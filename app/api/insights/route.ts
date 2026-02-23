import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const insights = await prisma.insight.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json(insights);
}

export async function POST(req: Request) {
  const body = await req.json();
  const insight = await prisma.insight.create({ data: body });
  return NextResponse.json(insight, { status: 201 });
}
