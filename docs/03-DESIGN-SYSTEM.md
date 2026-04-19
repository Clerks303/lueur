# Lueur — Design System & Onboarding Screens

## Design principles (non-negotiable)

1. **Editorial, never corporate.** Serif italic accents, sentence case, specific language.
2. **Tactile, never sterile.** Warm cream backgrounds, generous whitespace, subtle haptics.
3. **Observed, never generic.** Every AI output must feel like someone *looked*.
4. **Explained, always.** Every recommendation or inference has a visible "because…".
5. **Native mobile feel.** Use native gestures, haptics, transitions. No web-in-a-WebView.

## Color palette

| Token | Hex | Use |
|---|---|---|
| `bg.app` | `#FAF6EE` | Warm cream, main app background |
| `bg.surface` | `#FFFFFF` | Cards, elevated surfaces |
| `bg.muted` | `#EEE8DA` | Muted panels, highlighted blocks |
| `text.primary` | `#1F1A17` | Off-black, primary text |
| `text.secondary` | `#8B847A` | Warm gray, secondary text |
| `text.tertiary` | `#B8AFA0` | Hints, disabled |
| `accent.primary` | `#A8533A` | Terracotta — unique brand accent |
| `accent.secondary` | `#6B7A4A` | Muted olive — secondary accent (sparing use) |
| `divider` | `#E5DFD3` | Warm divider lines |

Dark mode: defer to v2. MVP is light-only, cream-based.

## Typography

- **Serif** (editorial): `Georgia` or system serif. Used for brand, headlines, italic accents, "signature" moments.
- **Sans** (UI): `Inter` or system default. Used for buttons, body text, UI chrome.
- **Sentence case always.** Never Title Case. Never ALL CAPS (except tiny section labels like "PALETTE" in the profile, at 10px max).
- **Italic** is used deliberately to signal "the voice of Lueur" — AI observations, signature lines, onboarding invitations.

## Voice and microcopy rules

- **Specific over generic.** "Ocres poussiéreux, lin brut non teint" not "warm tones, natural fabrics".
- **Observed, not flattering.** "Palette calme" not "Superbe palette !".
- **Inferential, not assertive.** "Tu privilégies le toucher" not "Tu aimes le toucher".
- **Short lines.** Onboarding narrations are 5–8 word lines, one observation per line.
- **French first.** All copy written in French first, English adapted after.

## Onboarding flow — 7 screens

See `/docs/mockups/` for visual reference (SVG mockups to be exported from Claude conversations).

### Screen 1 — Landing

**Content:**
- Top small italic serif: `lueur` (brand, `text.secondary` or `accent.primary`)
- Headline (serif, ~28px): `Une app qui apprend ton goût.`
- Sub-headline (serif italic, 18px, `text.secondary`): `Et s'en souvient.`
- CTA button (dark pill, full width, ~48px): `Commencer`

**Behavior:**
- Tapping CTA immediately requests camera permission, then navigates to Screen 2.
- No account creation, no email. Anonymous session created in background.

### Screen 2 — Photo capture

**Content:**
- Instruction (sans, small, centered): `Prends une photo d'un endroit chez toi`
- Italic accent line (serif, `accent.primary`): `que tu aimes.`
- Camera viewfinder (full width, rounded, corner brackets overlay)
- Shutter button (circle, centered at bottom)

**Behavior:**
- Uses `expo-camera` with rear cam by default
- On capture: encrypt client-side, upload to Scaleway via signed URL, navigate to Screen 3
- Allow "Choose from library" as secondary option

### Screen 3 — Analysis

**Content:**
- User's photo as thumbnail at top (rounded, ~1/4 screen height)
- Italic serif leader line (`accent.primary`): `Je regarde…`
- Analysis streams line-by-line (sans, body size, with typewriter effect 40–80ms/char):
  - Lumière / orientation
  - Palette (couleurs précises)
  - Matières (observées + notables absences)
  - Ambiance / références
- Synthesis line (serif italic, `text.secondary`): one sentence capturing the essence
- Two CTAs:
  - `Oui, c'est moi` (primary, dark pill)
  - `Corrige` (secondary, outlined)

**Behavior:**
- While analysis loads: skeleton shimmer on the line area
- Streaming effect: frontend receives full response, renders char by char (simulates streaming — the API response is a single JSON blob, not SSE, for simplicity)
- Tapping `Corrige` opens a modal with a free-text field; the correction is stored as a `correction` event

### Screen 4 — First duel

**Content:**
- Italic serif prompt: `Si je te connais bien…`
- Sub-line (secondary): `Laquelle te ressemble ?`
- Two option cards side by side (images, small labels below)
- Progress dots (3 total, 1/3 highlighted)
- Bottom hint (serif italic, secondary): `Tape pour choisir`

**Behavior:**
- Tap = immediate selection (haptic feedback), smooth transition to next duel
- 3 duels total in onboarding, increasing subtlety
- All answers stored as `duel_answered` events

### Screen 5 — Cross-domain reveal

**Content:**
- Leader line: `Et côté assiette…`
- Italic serif: `Ce soir, plutôt ?`
- Two food items as option cards
- On selection, show confirmation panel:
  - Italic accent: `Devinais juste.`
  - Body: `Même palette émotionnelle que ton salon.`
- Progress indicator: `intérieur → assiette → son`

**Behavior:**
- This screen reveals the product thesis: taste is cross-domain.
- Follow-up: one music duel, then move to profile.
- Haptic confirmation on each selection.

### Screen 6 — Profile generated

**Content:**
- Italic serif header: `Comment je te vois`
- Section `PALETTE` (tiny caps label): 5 color swatches (circles) extracted from analysis
- Section `MOTS-CLÉS`: 3 pill tags (outlined, dark text)
- Section `MATIÈRES`: bullet list, 3 items
- Signature block (muted panel, cream background):
  - Italic serif label: `Tu ressembles à…`
  - Body (2–3 lines): a specific, slightly cheeky signature narrative
- CTAs: `Affiner` (outlined) / `Continue` (primary dark pill)

**Behavior:**
- The signature narrative is generated by Claude from the current graph.
- `Affiner` loops back to more duels (3 more).
- `Continue` advances to Screen 7.

### Screen 7 — Actions

**Content:**
- Italic serif header: `Maintenant…`
- Sub-line: `Choisis par où commencer.`
- Three tappable cards, each with a small colored dot icon + title + italic example:
  1. **Recommander** — `"Trouve-moi une chaise pour mon bureau."`
  2. **Inspirer** — `3 pépites par semaine, choisies pour toi.`
  3. **Agents** — `Laisse Claude consulter ton goût via MCP.`

**Behavior:**
- Tapping any card enters the main app with that mode.
- The "Agents" card is informational pre-v2 — shows a "Bientôt disponible" badge.

## Post-onboarding daily loop

- **Daily duel notification** at user-configurable time (default 9:00 AM): "3 choix aujourd'hui. 30 secondes."
- **Weekly recommendation** on Sunday evening: "3 pépites pour toi cette semaine."
- **Profile precision bar** visible in the main screen: "Profile precision: 73%" with a clear progression mechanic.

## Animation and haptics

- **Transitions**: 250–350ms, `easeOut` curves. No bouncy.
- **Haptics** on:
  - Every duel selection (light impact)
  - Photo capture (medium impact)
  - Profile reveal on Screen 6 (success notification)
- **Typewriter effect** on AI analysis: ~50ms per character average, with a subtle terracotta cursor bar.

## Accessibility

- Contrast ratio minimum 4.5:1 for body text
- All interactive elements minimum 44×44 pt tap target
- Support system font scaling (don't cap `maxFontSizeMultiplier` below 1.5)
- VoiceOver / TalkBack labels on all images and buttons
