import { describe, expect, it } from "vitest";

import {
  AnalysisParseError,
  INTERIOR_ANALYSIS_V1,
  InteriorAnalysisSchema,
  parseInteriorAnalysis,
} from "../src/interior_analysis_v1.js";

// Matches the "well-calibrated" example from docs/04-PROMPTS.md §1.
const SAMPLE_VALID = {
  structured: {
    palette: {
      observed_colors: ["ocres poussiéreux", "blanc cassé", "bois chaud"],
      temperature: "warm",
      saturation: "muted",
    },
    materials: {
      observed: ["lin brut non teint", "chêne non verni", "céramique mate"],
      absent_notable: ["plastique", "métal chromé"],
    },
    forms: {
      dominant: ["coupes droites", "lignes organiques"],
      ornamentation: "minimal",
    },
    references: ["japandi", "wabi-sabi"],
    anti_patterns_detected: ["logos_visibles"],
    confidence_overall: 0.87,
    domain: "interior",
  },
  narrative: {
    observation_lines: [
      "Lumière naturelle, douce, probablement orientée nord.",
      "Palette : ocres poussiéreux, blanc cassé, touches de bois chaud.",
      "Matières : lin brut non teint, chêne non verni, céramique mate.",
      "Zéro plastique visible, aucun logo.",
      "Références : japandi, léger wabi-sabi.",
    ],
    synthesis: "Tu privilégies le toucher à l'image.",
  },
} as const;

describe("INTERIOR_ANALYSIS_V1 constant", () => {
  it("points at claude-opus-4-7 with 0.3 temperature and 1500 max tokens", () => {
    expect(INTERIOR_ANALYSIS_V1.version).toBe("1.0.0");
    expect(INTERIOR_ANALYSIS_V1.model).toBe("claude-opus-4-7");
    expect(INTERIOR_ANALYSIS_V1.temperature).toBe(0.3);
    expect(INTERIOR_ANALYSIS_V1.maxTokens).toBe(1500);
  });

  it("carries a non-empty French system prompt with the golden rules", () => {
    expect(INTERIOR_ANALYSIS_V1.system.length).toBeGreaterThan(500);
    expect(INTERIOR_ANALYSIS_V1.system).toContain("RÈGLES D'OR");
    expect(INTERIOR_ANALYSIS_V1.system).toContain("Français uniquement");
    expect(INTERIOR_ANALYSIS_V1.system).toContain("Ne renvoie QUE le JSON");
  });
});

describe("InteriorAnalysisSchema (direct parse)", () => {
  it("accepts the docs-example shape", () => {
    const result = InteriorAnalysisSchema.safeParse(SAMPLE_VALID);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid temperature enum", () => {
    const bad = structuredClone(SAMPLE_VALID) as { structured: { palette: { temperature: string } } };
    bad.structured.palette.temperature = "tiède"; // not in enum
    const result = InteriorAnalysisSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects confidence_overall outside [0, 1]", () => {
    const bad = structuredClone(SAMPLE_VALID) as { structured: { confidence_overall: number } };
    bad.structured.confidence_overall = 1.4;
    const result = InteriorAnalysisSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects extra keys thanks to .strict()", () => {
    const bad = structuredClone(SAMPLE_VALID) as {
      structured: Record<string, unknown>;
    };
    bad.structured.hallucinated_field = "oops";
    const result = InteriorAnalysisSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

describe("parseInteriorAnalysis", () => {
  it("parses plain JSON output", () => {
    const parsed = parseInteriorAnalysis(JSON.stringify(SAMPLE_VALID));
    expect(parsed.narrative.synthesis).toBe(
      "Tu privilégies le toucher à l'image.",
    );
    expect(parsed.structured.palette.temperature).toBe("warm");
  });

  it("strips a ```json fence if the model emitted one despite instructions", () => {
    const raw = "```json\n" + JSON.stringify(SAMPLE_VALID) + "\n```";
    const parsed = parseInteriorAnalysis(raw);
    expect(parsed.structured.domain).toBe("interior");
  });

  it("strips a bare ``` fence too", () => {
    const raw = "```\n" + JSON.stringify(SAMPLE_VALID) + "\n```";
    const parsed = parseInteriorAnalysis(raw);
    expect(parsed.narrative.observation_lines).toHaveLength(5);
  });

  it("throws AnalysisParseError with the raw payload on malformed JSON", () => {
    const raw = "{not valid json";
    try {
      parseInteriorAnalysis(raw);
      throw new Error("expected AnalysisParseError");
    } catch (err) {
      expect(err).toBeInstanceOf(AnalysisParseError);
      if (err instanceof AnalysisParseError) {
        expect(err.raw).toBe(raw);
        expect(err.message).toContain("not valid JSON");
      }
    }
  });

  it("throws AnalysisParseError with path details on schema mismatch", () => {
    const raw = JSON.stringify({ structured: {}, narrative: {} });
    try {
      parseInteriorAnalysis(raw);
      throw new Error("expected AnalysisParseError");
    } catch (err) {
      expect(err).toBeInstanceOf(AnalysisParseError);
      if (err instanceof AnalysisParseError) {
        expect(err.message).toContain("InteriorAnalysisSchema");
        expect(err.raw).toBe(raw);
      }
    }
  });
});
