# Lueur — Data Schema v1

> This document is the source of truth for the v1 schema. All changes require Romain's approval.

## Architectural pattern: event-sourced taste graph

The taste graph is **derived** from a log of events, not primary-written. Every user interaction produces an immutable event in `taste_events`. The current graph state is stored in `taste_graphs.graph` (JSONB) and can always be rebuilt by replaying events.

Benefits:
- Debug any claim ("why does it think I like linen?") by grepping events
- Change the inference algorithm and replay to update all graphs
- Clear audit trail for user trust

## Taste graph JSON shape

Stored in `taste_graphs.graph` as JSONB. Example of a complete graph for a power user:

```json
{
  "schema_version": "1.0",
  "graph_version": 47,
  "updated_at": "2026-04-19T14:02:00Z",

  "primitives": {
    "palette": {
      "preferred": {
        "warm_neutrals": { "confidence": 0.92, "examples": ["beige sable", "blanc cassé"], "sources": ["photo:abc123", "duel:12"] },
        "earth_tones":   { "confidence": 0.88, "examples": ["terracotta", "chêne brut"], "sources": ["photo:abc123", "duel:18"] }
      },
      "rejected": {
        "saturated_primaries": { "confidence": 0.84, "sources": ["duel:22", "duel:41"] }
      }
    },
    "materials": {
      "preferred": { "lin_brut": 0.95, "chêne_massif": 0.91, "cuir_patiné": 0.88 },
      "rejected":  { "plastique_brillant": 0.96, "chrome": 0.82 }
    },
    "forms": {
      "preferred": ["coupes droites", "lignes organiques"],
      "rejected":  ["ornementation excessive"]
    },
    "references": { "japandi": 0.89, "mid_century": 0.84, "wabi_sabi": 0.76 },
    "anti_patterns": {
      "logos_visibles":  { "confidence": 0.97, "strength": "strong" },
      "status_signaling": { "confidence": 0.91, "strength": "strong" }
    }
  },

  "domains": {
    "interior": {
      "owned": [
        { "id": "sofa_001", "type": "sofa", "material": "lin", "color": "écru", "source": "photo:abc123", "confidence": 0.95 }
      ],
      "aspirational": [
        { "type": "dining_chairs", "ref_style": "Hans Wegner CH24", "budget_range_eur": [400, 800] }
      ],
      "budget_ranges_eur": { "decor_item": [80, 600], "furniture_major": [300, 2500] }
    },
    "clothing": {
      "fit": { "cut": "straight", "silhouette": "slightly_oversized" },
      "sizing": { "tops": "M/L", "bottoms": 32, "shoes_eu": 42 },
      "brand_affinities": { "preferred": ["APC", "Margaret Howell"], "rejected_pattern": "visible_logos" },
      "budget_ranges_eur": { "sneakers": [100, 300], "jacket": [150, 600] }
    },
    "music": { "genres": { "deep_house": 0.94 }, "reference_artists": ["Miguel Migs"] },
    "food":  { "cuisines": { "japanese": 0.85, "levantine": 0.81 } },
    "travel": { "accommodation_style": ["ryokan", "boutique_hotel"], "pace": "slow_one_base" }
  },

  "identity": {
    "self_keywords": ["tactile", "discret", "référencé"],
    "values_ranked": ["quality_craft", "autonomy", "longevity", "understated_taste"],
    "peer_group": "design-literate independents, 25-40",
    "signature_narrative": "habitant haussmannien d'architecte, lecteur du NYT plus que Vogue"
  }
}
```

Three layers:
1. **Primitives** — cross-domain properties (palette, materials, forms, references, anti-patterns). These power cross-domain inference.
2. **Domains** — specific to each consumption category, inherits from primitives + domain-specific fields.
3. **Identity** — the narrative layer, shown to the user in the profile screen.

Every property carries `confidence` (0–1) and `sources` (array of event refs) for explainability.

## PostgreSQL schema (v1)

Apply as first migration. Drizzle schema in `packages/db/src/schema.ts` mirrors this.

```sql
-- Extensions
create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- =========================================================
-- Auth tables are managed by Better Auth (users, sessions, accounts, etc.)
-- See Better Auth docs for their schema. Do NOT duplicate.
-- We reference auth.user via user_id (uuid).
-- =========================================================

-- Application profile (extends the Better Auth user)
create table profiles (
  user_id       uuid primary key references "user"(id) on delete cascade,
  display_name  text,
  locale        text default 'fr-FR',
  onboarded_at  timestamptz,
  created_at    timestamptz default now()
);

-- Taste graph (one row per user, current derived state)
create table taste_graphs (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null unique references "user"(id) on delete cascade,
  schema_version text not null default '1.0',
  graph_version  int  not null default 1,
  graph          jsonb not null default '{}'::jsonb,
  updated_at     timestamptz default now()
);

create index on taste_graphs using gin (graph);

-- Event log (append-only, source of truth for deriving the graph)
create table taste_events (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references "user"(id) on delete cascade,
  event_type text not null, -- 'photo_analyzed', 'duel_answered', 'correction', 'import'
  payload    jsonb not null,
  created_at timestamptz default now()
);

create index on taste_events (user_id, created_at desc);
create index on taste_events (event_type);

-- Photos (metadata only; encrypted blobs live in Scaleway Object Storage)
create table photos (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references "user"(id) on delete cascade,
  storage_key    text not null,           -- key in Scaleway bucket (encrypted blob)
  domain         text,                    -- 'interior', 'clothing', 'food', 'object', 'other'
  analysis       jsonb,                   -- structured output from vision model
  analysis_status text default 'pending', -- 'pending', 'processing', 'done', 'failed'
  created_at     timestamptz default now()
);

create index on photos (user_id, created_at desc);

-- Duel catalogue (seeded by Romain; public read)
create table duel_pairs (
  id         uuid primary key default uuid_generate_v4(),
  domain     text not null,
  dimension  text not null, -- 'seating_style', 'material_patina', etc.
  option_a   jsonb not null, -- { image_url, label, tags: [...] }
  option_b   jsonb not null,
  difficulty int default 1,  -- 1=easy, 3=subtle
  active     boolean default true,
  created_at timestamptz default now()
);

-- User answers to duels
create table duel_answers (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references "user"(id) on delete cascade,
  pair_id          uuid not null references duel_pairs(id),
  chosen           text not null check (chosen in ('a','b','skip')),
  response_time_ms int,
  created_at       timestamptz default now()
);

create index on duel_answers (user_id, created_at desc);

-- Item catalogue (products we can recommend)
create table items (
  id          uuid primary key default uuid_generate_v4(),
  domain      text not null,
  title       text not null,
  brand       text,
  price_eur   numeric,
  image_url   text,
  product_url text,
  tags        text[],
  metadata    jsonb,
  embedding   vector(1536),
  created_at  timestamptz default now()
);

create index on items using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on items (domain);

-- Recommendation log (for learning and dedup)
create table recommendations (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references "user"(id) on delete cascade,
  item_id       uuid references items(id),
  context       text,     -- 'weekly_feed', 'user_query', 'agent_mcp'
  score         numeric,
  reasoning     text,
  user_feedback text,     -- 'liked', 'disliked', 'bought', null
  created_at    timestamptz default now()
);
```

## Access control strategy

With a Hono API in front of Postgres, **authorization lives in the API layer**, not in Postgres RLS:

- Every endpoint must check `session.userId === resource.userId` before reading/writing
- Implement a `requireOwnership(tableName)` helper that does this check once
- Service-role DB connection is never exposed; API uses an app role that cannot bypass these checks anyway

Document every endpoint's ownership rule in the route file with a comment.

## Event types reference

Document each event type as it is implemented. Starting set:

| Type | Payload shape | When emitted |
|---|---|---|
| `photo_analyzed` | `{ photo_id, analysis }` | After vision model returns |
| `duel_answered` | `{ pair_id, chosen, response_time_ms }` | On each duel tap |
| `correction` | `{ target: 'palette'\|'material'\|..., value, context }` | User corrects on Analysis screen |
| `graph_rebuilt` | `{ from_event_count, new_version }` | Graph derivation ran |
| `reco_feedback` | `{ reco_id, feedback }` | User marks liked/disliked/bought |
| `import` | `{ source: 'spotify'\|'camera_roll'\|..., summary }` | External data imported |

## Index strategy

- Every `user_id` column is indexed (queries are always user-scoped)
- `taste_events` is indexed by `(user_id, created_at desc)` for fast replay
- `items.embedding` uses ivfflat for vector similarity
- `taste_graphs.graph` has a GIN index for JSONB queries
