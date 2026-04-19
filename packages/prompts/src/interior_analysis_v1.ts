/**
 * Interior photo analysis prompt — v1.0.0.
 *
 * System prompt is kept verbatim from docs/04-PROMPTS.md §1. Any non-trivial
 * edit must bump the filename suffix (interior_analysis_v2.ts) AND the
 * `version` field below; old versions are retained so past events can be
 * rerun against current prompts for quality regressions.
 */
import { z } from "zod";

// --------------------------------------------------------------------------
// Prompt constant
// --------------------------------------------------------------------------

const SYSTEM_PROMPT = `Tu es l'analyste de goût de Lueur, une app qui apprend l'esthétique des gens.

On te donne une photo prise par un utilisateur avec la mention "un endroit chez moi que j'aime". Cette photo est un signal honnête sur son goût profond.

Ton job est de produire une analyse structurée ET une analyse narrative courte.

RÈGLES D'OR (violer = produit cassé) :
1. Sois SPÉCIFIQUE. Jamais "couleurs chaudes et matières naturelles" — trop vague.
   Dis "ocres poussiéreux, lin brut non teint, chêne clair non verni".
2. Observe, ne flatte pas. Si la palette est criarde, dis-le. Si c'est de l'Ikea basique, tu peux le constater avec neutralité ("mobilier modulaire abordable").
   Le user doit sentir que tu regardes VRAIMENT.
3. Infère des PROPENSIONS, pas des faits. "Penche vers" plutôt que "aime".
4. Pas d'emoji. Pas de superlatifs ("incroyable", "magnifique"). Registre éditorial, proche de Kinfolk ou Cereal magazine.
5. Si la photo est ambiguë ou mal cadrée, sois honnête : "photo partielle, je vois surtout X, je devine peut-être Y". Ne surinterprète pas.
6. Français uniquement. Vouvoiement interdit, tutoiement toujours.

Format de sortie (JSON strict, aucune prose autour) :

{
  "structured": {
    "palette": {
      "observed_colors": ["string", ...],
      "temperature": "warm" | "cool" | "neutral" | "mixed",
      "saturation": "muted" | "medium" | "saturated"
    },
    "materials": {
      "observed": ["string", ...],
      "absent_notable": ["string", ...]
    },
    "forms": {
      "dominant": ["string", ...],
      "ornamentation": "minimal" | "moderate" | "rich"
    },
    "references": ["string", ...],
    "anti_patterns_detected": ["string", ...],
    "confidence_overall": 0.0-1.0,
    "domain": "interior" | "clothing" | "food" | "object" | "other"
  },
  "narrative": {
    "observation_lines": [
      "string",
      ...
    ],
    "synthesis": "string"
  }
}

Exemple de narrative.observation_lines bien calibré :
[
  "Lumière naturelle, douce, probablement orientée nord.",
  "Palette : ocres poussiéreux, blanc cassé, touches de bois chaud.",
  "Matières : lin brut non teint, chêne non verni, céramique mate.",
  "Zéro plastique visible, aucun logo.",
  "Références : japandi, léger wabi-sabi."
]

Exemple de synthesis bien calibré :
"Tu privilégies le toucher à l'image."

Ne renvoie QUE le JSON. Pas de markdown fences. Pas de préambule.`;

export const INTERIOR_ANALYSIS_V1 = {
  version: "1.0.0",
  model: "claude-opus-4-7",
  temperature: 0.3,
  maxTokens: 1500,
  system: SYSTEM_PROMPT,
} as const;

// --------------------------------------------------------------------------
// Output schema + inferred type
// --------------------------------------------------------------------------

export const PaletteTemperature = z.enum(["warm", "cool", "neutral", "mixed"]);
export const PaletteSaturation = z.enum(["muted", "medium", "saturated"]);
export const Ornamentation = z.enum(["minimal", "moderate", "rich"]);
export const AnalysisDomain = z.enum([
  "interior",
  "clothing",
  "food",
  "object",
  "other",
]);

const paletteSchema = z
  .object({
    observed_colors: z.array(z.string()),
    temperature: PaletteTemperature,
    saturation: PaletteSaturation,
  })
  .strict();

const materialsSchema = z
  .object({
    observed: z.array(z.string()),
    absent_notable: z.array(z.string()),
  })
  .strict();

const formsSchema = z
  .object({
    dominant: z.array(z.string()),
    ornamentation: Ornamentation,
  })
  .strict();

const structuredSchema = z
  .object({
    palette: paletteSchema,
    materials: materialsSchema,
    forms: formsSchema,
    references: z.array(z.string()),
    anti_patterns_detected: z.array(z.string()),
    confidence_overall: z.number().min(0).max(1),
    domain: AnalysisDomain,
  })
  .strict();

const narrativeSchema = z
  .object({
    observation_lines: z.array(z.string()).min(1),
    synthesis: z.string().min(1),
  })
  .strict();

export const InteriorAnalysisSchema = z
  .object({
    structured: structuredSchema,
    narrative: narrativeSchema,
  })
  .strict();

export type InteriorAnalysis = z.infer<typeof InteriorAnalysisSchema>;

// --------------------------------------------------------------------------
// Parser
// --------------------------------------------------------------------------

export class AnalysisParseError extends Error {
  readonly raw: string;
  override readonly cause?: unknown;

  constructor(message: string, raw: string, cause?: unknown) {
    super(message);
    this.name = "AnalysisParseError";
    this.raw = raw;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * Matches a leading ```json ... ``` or ``` ... ``` fence wrapping the entire
 * payload. Handles an optional language tag on the opening fence.
 */
const FENCE_RE = /^\s*```(?:json|JSON)?\s*\n([\s\S]*?)\n\s*```\s*$/;

export function parseInteriorAnalysis(raw: string): InteriorAnalysis {
  const unfenced = stripFences(raw);

  let json: unknown;
  try {
    json = JSON.parse(unfenced);
  } catch (err) {
    throw new AnalysisParseError(
      "response is not valid JSON",
      raw,
      err,
    );
  }

  const result = InteriorAnalysisSchema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("\n");
    throw new AnalysisParseError(
      `response JSON does not match InteriorAnalysisSchema:\n${issues}`,
      raw,
      result.error,
    );
  }
  return result.data;
}

function stripFences(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(FENCE_RE);
  if (match?.[1] !== undefined) return match[1].trim();
  return trimmed;
}
