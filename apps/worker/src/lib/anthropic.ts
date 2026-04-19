/**
 * Thin Anthropic client wrapper. Exposes the single entry point the
 * analyze-photo job needs so tests can inject a stub without mocking
 * the full SDK surface.
 */
import Anthropic from "@anthropic-ai/sdk";

import { INTERIOR_ANALYSIS_V1 } from "@lueur/prompts";

import { loadEnv } from "../env.js";

export interface AnalyzeInteriorParams {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/heic" | string;
}

export interface AnalyzeInteriorClient {
  analyzeInterior(params: AnalyzeInteriorParams): Promise<string>;
}

let cached: AnalyzeInteriorClient | null = null;

export function getAnthropicClient(): AnalyzeInteriorClient {
  if (!cached) cached = buildClient();
  return cached;
}

/** Test-only: swap in a stub client. Pass `null` to restore the real one. */
export function _setAnthropicClientForTests(
  client: AnalyzeInteriorClient | null,
): void {
  cached = client;
}

function buildClient(): AnalyzeInteriorClient {
  const env = loadEnv();
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is missing — refusing to build a real Anthropic client",
    );
  }
  const sdk = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    timeout: env.ANTHROPIC_TIMEOUT_MS,
    maxRetries: 0, // retries are owned by BullMQ
  });

  return {
    async analyzeInterior({ base64, mediaType }) {
      const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      // Anthropic doesn't accept heic directly. Mobile will always convert
      // to JPEG before upload; we fall back to image/jpeg if we somehow see heic.
      const safeMediaType = allowed.includes(mediaType)
        ? (mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
        : "image/jpeg";

      const response = await sdk.messages.create({
        model: INTERIOR_ANALYSIS_V1.model,
        max_tokens: INTERIOR_ANALYSIS_V1.maxTokens,
        temperature: INTERIOR_ANALYSIS_V1.temperature,
        system: INTERIOR_ANALYSIS_V1.system,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: safeMediaType,
                  data: base64,
                },
              },
              { type: "text", text: "Voici la photo à analyser." },
            ],
          },
        ],
      });

      const first = response.content[0];
      if (!first || first.type !== "text") {
        throw new Error(
          `Anthropic returned unexpected content type: ${first?.type ?? "none"}`,
        );
      }
      return first.text;
    },
  };
}
