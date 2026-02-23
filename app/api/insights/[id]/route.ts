import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const insight = await prisma.insight.findUnique({ where: { id } });
  if (!insight) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(insight);
}
