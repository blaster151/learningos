import { NextRequest, NextResponse } from "next/server";
import {
  assertSameUser,
  authErrorResponse,
  requireAuthUser,
} from "@/lib/auth/serverAuth";
import { getPrerequisiteChain } from "@/lib/learning/prerequisiteChain";
import { conductScreeningTurn } from "@/lib/ai/prerequisiteScreening";
import type {
  ScreeningChatMessage,
  ScreeningUserAction,
} from "@/types";
import type { PrerequisiteChainResult } from "@/lib/learning/prerequisiteChain";

interface ScreeningTurnRequest {
  userId?: string;
  goal?: string;
  messages?: ScreeningChatMessage[];
  userAction?: ScreeningUserAction;
  prerequisiteChain?: PrerequisiteChainResult;
}

function isValidMessageArray(messages: unknown): messages is ScreeningChatMessage[] {
  return (
    Array.isArray(messages) &&
    messages.every(
      (msg) =>
        msg &&
        typeof msg === "object" &&
        (msg as { role?: unknown }).role &&
        ((msg as { role?: unknown }).role === "user" ||
          (msg as { role?: unknown }).role === "assistant") &&
        typeof (msg as { content?: unknown }).content === "string"
    )
  );
}

function isValidUserAction(action: unknown): action is ScreeningUserAction {
  if (!action || typeof action !== "object") {
    return false;
  }

  const type = (action as { type?: unknown }).type;
  if (type === "dont_know" || type === "generate_now") {
    return true;
  }

  if (type === "message") {
    return typeof (action as { content?: unknown }).content === "string";
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);
    const body: ScreeningTurnRequest = await request.json();

    assertSameUser(body.userId ?? null, authed.uid);

    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    if (!goal) {
      return NextResponse.json({ error: "goal is required" }, { status: 400 });
    }

    if (!isValidMessageArray(body.messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    if (body.messages.length > 20) {
      return NextResponse.json(
        { error: "Too many screening messages" },
        { status: 429 }
      );
    }

    if (!isValidUserAction(body.userAction)) {
      return NextResponse.json(
        { error: "userAction is required" },
        { status: 400 }
      );
    }

    const prerequisiteChain =
      body.prerequisiteChain ??
      (await getPrerequisiteChain(authed.uid, goal));

    const result = await conductScreeningTurn(
      goal,
      body.messages,
      body.userAction,
      prerequisiteChain
    );

    const nextMessages = [
      ...body.messages,
      { role: "assistant" as const, content: result.reply },
    ];

    return NextResponse.json(
      {
        reply: result.reply,
        done: result.done,
        messages: nextMessages,
        screeningResult: result.screeningResult,
        progress: result.progress,
      },
      { status: 200 }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;

    console.error("Error running screening turn:", error);
    return NextResponse.json(
      {
        error: "Failed to run screening turn",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
