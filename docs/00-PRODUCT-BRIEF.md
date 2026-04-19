# Lueur — Product Brief

> **Codename:** `lueur`. Final name TBD — we will rebrand before public launch if needed. Code, commits, env vars, bundle identifiers all use `lueur` until further notice.

## Product in one paragraph

Lueur is a **mobile-only iOS/Android app** that learns a user's aesthetic taste across multiple consumption domains (interior, clothing, food, music, travel) by observing their existing objects through photos and refining through daily 30-second "duels" (tap to choose between two options). The resulting **taste graph** is a structured, explainable, user-owned profile that can later be queried by any AI agent (via an MCP server, v2) to make recommendations and act on the user's behalf.

**Positioning:** editorial, tactile, premium. The Kinfolk of AI agents, not the Groupon. Target audience: women 25–40, urban, CSP+, design-literate, Francophone primary market with international expansion path (UK, US).

## Why this product exists

AI agents can increasingly *act* on behalf of users (book, buy, reserve). What they cannot yet do is act *with good taste*. They lack a structured, deep, user-owned model of the user's aesthetic preferences. Current "memory" features from OpenAI/Anthropic/Google are shallow, siloed, and owned by the platform — not the user.

Lueur builds the missing layer: **a personal taste graph that users own, that agents query with permission, and that works across domains**.

## The core loop

1. **Capture (passive first)** — user takes a photo of "somewhere at home you love"
2. **Analyze (the wow)** — Claude vision produces a specific, tactile, editorial analysis streamed on screen
3. **Refine (active)** — user validates, corrects, and plays daily duels (ça ou ça ?)
4. **Project (cross-domain)** — the app reveals the thesis by guessing preferences in a different domain
5. **Serve (utility)** — recommendations, weekly curation, and (v2) MCP interface for external agents

## Platform and scope

- **Mobile only** — iOS and Android via Expo/React Native. **No web app.** No web admin until absolutely needed.
- A lightweight public read-only share page (`lueur.app/p/:userhandle`) may come post-MVP for virality, but it is not a product — just a share URL.

## Key principles (non-negotiable)

1. **The user owns their taste graph.** Exportable, explainable, correctable.
2. **Every recommendation is explainable.** "Because X" grounded in concrete signals.
3. **Privacy-first.** Photos encrypted client-side before upload. Server never sees plaintext.
4. **Editorial tone always.** Serif accents, sentence case, specific observations. Never generic AI-speak.
5. **Mobile-native feel.** Native transitions, haptics, push, camera-first. Not a web app in a WebView.

## Audience persona (for design and tone decisions)

"Camille, 32, Paris/Lyon/Bordeaux. Works in creative industries, marketing, or consulting. Design-literate — has opinions on Hay vs. Muuto, reads The Gentlewoman or Kinfolk, follows Sézane. Shops less but buys well. Suspicious of Amazon recommendations. Would pay for a tasteful assistant, not for a discount aggregator."

## What Lueur is NOT

- Not a shopping app (we don't build a checkout; we recommend and explain)
- Not a social network (no feed of other users)
- Not a chatbot (the voice of Lueur is editorial, not conversational)
- Not a lifestyle inspiration app (Pinterest has that; we are about *your* taste, not browsing)
- Not a web product
