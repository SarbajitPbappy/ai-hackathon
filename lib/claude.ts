import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@ai-sdk/anthropic";

export const CLAUDE_MODEL_ID = "claude-sonnet-4-20250514";

export function getClaudeModel() {
  return anthropic(CLAUDE_MODEL_ID);
}

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  return new Anthropic({ apiKey });
}
