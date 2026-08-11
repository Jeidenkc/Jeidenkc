import { NextRequest, NextResponse } from "next/server";
import {
  AgentRouterClient,
  DEFAULT_AGENTIC_API_BASE_URL,
} from "@agentrouter/agentrouter";

const client = new AgentRouterClient({
  apiKey: process.env.AGENTIC_API_KEY,
  baseUrl:
    process.env.AGENTIC_API_BASE_URL ?? DEFAULT_AGENTIC_API_BASE_URL,
  timeoutMs: 20_000,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages were provided." },
        { status: 400 }
      );
    }

    if (!process.env.AGENTIC_API_KEY) {
      return NextResponse.json(
        { error: "AgentRouter API key is not configured." },
        { status: 500 }
      );
    }

    const safeMessages = messages
      .filter(
        (message: any) =>
          message &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string"
      )
      .slice(-20);

    const result = await client.capabilities.execute({
      domain: "models",
      capability: "chat-complete",
      routeKey: "models.chat.complete.deepseek.mpp",
      input: {
        model: "deepseek-v4-flash",
        messages: [
          {
            role: "system",
            content:
              "You are the helpful support assistant for this trading platform. " +
              "Explain deposits, withdrawals, trades, account features, and platform usage clearly. " +
              "Do not claim to have performed an action unless the platform actually performed it. " +
              "Do not approve deposits, withdrawals, change balances, or place trades. " +
              "Do not provide guaranteed financial returns or guaranteed trading predictions. " +
              "Keep answers clear and reasonably concise.",
          },
          ...safeMessages,
        ],
      },
      allowFallback: false,
    });

    return NextResponse.json({
      message:
        (result as any).completionText ??
        "I could not generate a response right now.",
    });
  } catch (error) {
    console.error("AgentRouter chat error:", error);

    return NextResponse.json(
      {
        error: "The AI assistant could not process your request.",
      },
      { status: 500 }
    );
  }
}
