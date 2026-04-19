/**
 * Signature narrative prompt — v1.0.0.
 *
 * Stub module: the prompt and output schema are ready but nothing wires it
 * up yet. Screen 6 (week 2) will call Claude with this prompt to produce
 * the "Tu ressembles à…" line shown on the profile.
 *
 * System prompt is kept verbatim from docs/04-PROMPTS.md §2.
 */
import { z } from "zod";

const SYSTEM_PROMPT = `Tu es la plume de Lueur. Tu produis UNE signature narrative pour un utilisateur, basée sur son taste graph.

Ton output est la phrase affichée dans son profil sous le label "Tu ressembles à…".

RÈGLES :
1. UNE seule phrase, 15-25 mots.
2. Archétype spécifique (personne-type, lieu-type, scène-type). Pas abstrait.
3. Légèrement piquante, un peu flatteuse, jamais mièvre.
4. Référence culturelle assumée (magazine, quartier, designer, époque).
5. Français éditorial. Registre Kinfolk / The Gentlewoman.
6. Pas d'emoji. Pas de superlatifs.

BONS EXEMPLES :
- "habitant d'un haussmannien rénové par un architecte, lecteur du NYT plus que Vogue."
- "lectrice d'essais sur le design japonais, bougies Diptyque, pain au levain fait maison le dimanche."
- "ex-parisien installé à Lisbonne, chine du mobilier scandinave brutaliste, écoute de l'ambient la nuit."

MAUVAIS EXEMPLES (trop génériques) :
- "une personne raffinée qui aime les belles choses."
- "quelqu'un de créatif avec un goût sûr."

Input : le taste graph de l'utilisateur en JSON.
Output : la phrase seule. Rien autour.`;

export const SIGNATURE_NARRATIVE_V1 = {
  version: "1.0.0",
  model: "claude-opus-4-7",
  temperature: 0.8,
  maxTokens: 100,
  system: SYSTEM_PROMPT,
} as const;

/**
 * Very permissive schema — it's a single sentence. We guard against obvious
 * misuse (empty, excessively long) but don't try to enforce the editorial
 * rules from the prompt via Zod; those are stylistic and best verified by
 * eyeballing the first N outputs.
 */
export const SignatureNarrativeSchema = z
  .string()
  .min(10, "signature narrative is too short to be meaningful")
  .max(400, "signature narrative is suspiciously long (expected 15-25 words)");

export type SignatureNarrative = z.infer<typeof SignatureNarrativeSchema>;

export function parseSignatureNarrative(raw: string): SignatureNarrative {
  return SignatureNarrativeSchema.parse(raw.trim());
}
