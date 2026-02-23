import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInsight } from "@/lib/openai";
import { runSafeSql } from "@/lib/db";
import { triggerMake } from "@/lib/make";

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      conversationId?: string;
      message: string;
      locale?: "ru" | "en";
      enableMake?: boolean;
      makeContext?: Record<string, unknown>;
    };

    const conversation = body.conversationId
      ? await prisma.conversation.findUnique({ where: { id: body.conversationId } })
      : await prisma.conversation.create({ data: { locale: body.locale ?? "en", userId: "demo-user" } });

    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    await prisma.message.create({
      data: { conversationId: conversation.id, role: "user", content: body.message },
    });

    const ai = await generateInsight(`${body.locale ?? "en"} user question: ${body.message}`);
    const queryResult = await runSafeSql(ai.insight.sql);

    const insight = {
      title: ai.insight.title,
      summary: ai.insight.summary,
      tags: ai.insight.tags,
      sql: queryResult.sql,
      columns: queryResult.columns,
      rows: queryResult.rows,
      charts: ai.insight.charts,
      dashboardHint: ai.insight.dashboardHint,
    };

    await prisma.message.create({
      data: { conversationId: conversation.id, role: "assistant", content: ai.assistantMessage },
    });

    const savedInsight = await prisma.insight.create({
      data: {
        conversationId: conversation.id,
        title: insight.title,
        summary: insight.summary,
        tags: insight.tags,
        sql: insight.sql,
        dataPreview: { columns: insight.columns, rows: insight.rows },
        charts: insight.charts,
      },
    });

    let makeStatus: "sent" | "failed" | "skipped" = "skipped";
    if (body.enableMake && process.env.MAKE_WEBHOOK_URL) {
      try {
        await triggerMake("insight.created", {
          title: insight.title,
          summary: insight.summary,
          tags: insight.tags,
          sql: insight.sql,
          kpis: insight.rows.slice(0, 5),
          makeContext: body.makeContext,
        });
        makeStatus = "sent";
      } catch {
        makeStatus = "failed";
      }
    }

    return NextResponse.json({
      conversationId: conversation.id,
      assistantMessage: ai.assistantMessage,
      insight: { ...insight, id: savedInsight.id },
      makeStatus,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
