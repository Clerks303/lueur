import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

// --------------------------------------------------------------------------
// Auth surface — owned by Better Auth through its Drizzle adapter.
// Columns match Better Auth's core schema contract (name, email,
// emailVerified, image, createdAt, updatedAt on user; standard session/
// account/verification shape). `emailDomainName` from the anonymous plugin
// fills `email` for anon users so the NOT NULL constraint is safe.
// --------------------------------------------------------------------------

/** Primary user identity. Shared FK target for every user-scoped table. */
export const user = pgTable("user", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** Marks a Better Auth anonymous user. Set by the anonymous plugin. */
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Active sessions issued by Better Auth. */
export const session = pgTable("session", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** OAuth/provider account links. `password` stays null in Lueur (no password auth). */
export const account = pgTable("account", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Short-lived verification tokens (magic-link tokens, email verifications). */
export const verification = pgTable("verification", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Application profile. Extends the Better Auth user. */
export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  locale: text("locale").default("fr-FR"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** Taste graph — current derived state, one row per user. */
export const tasteGraphs = pgTable(
  "taste_graphs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    schemaVersion: text("schema_version").notNull().default("1.0"),
    graphVersion: integer("graph_version").notNull().default(1),
    graph: jsonb("graph").notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("taste_graphs_graph_gin").using("gin", t.graph)],
);

/** Append-only event log — source of truth for deriving the graph. */
export const tasteEvents = pgTable(
  "taste_events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("taste_events_user_created_idx").on(t.userId, t.createdAt.desc()),
    index("taste_events_type_idx").on(t.eventType),
  ],
);

/** Photo metadata. Encrypted blobs live in Scaleway Object Storage. */
export const photos = pgTable(
  "photos",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    domain: text("domain"),
    analysis: jsonb("analysis"),
    analysisStatus: text("analysis_status").default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("photos_user_created_idx").on(t.userId, t.createdAt.desc())],
);

/** Catalogue of curated A/B choices (seeded; public read). */
export const duelPairs = pgTable("duel_pairs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  domain: text("domain").notNull(),
  dimension: text("dimension").notNull(),
  optionA: jsonb("option_a").notNull(),
  optionB: jsonb("option_b").notNull(),
  difficulty: integer("difficulty").default(1),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** User answers to duels. */
export const duelAnswers = pgTable(
  "duel_answers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pairId: uuid("pair_id")
      .notNull()
      .references(() => duelPairs.id),
    chosen: text("chosen").notNull(),
    responseTimeMs: integer("response_time_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("duel_answers_user_created_idx").on(t.userId, t.createdAt.desc()),
    check("duel_answers_chosen_chk", sql`${t.chosen} in ('a','b','skip')`),
  ],
);

/** Item catalogue — what we can recommend. Embeddings populated by a worker. */
export const items = pgTable(
  "items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    domain: text("domain").notNull(),
    title: text("title").notNull(),
    brand: text("brand"),
    priceEur: numeric("price_eur"),
    imageUrl: text("image_url"),
    productUrl: text("product_url"),
    tags: text("tags").array(),
    metadata: jsonb("metadata"),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("items_domain_idx").on(t.domain),
    index("items_embedding_idx")
      .using("ivfflat", t.embedding.op("vector_cosine_ops"))
      .with({ lists: 100 }),
  ],
);

/** Recommendation log — for learning and dedup. */
export const recommendations = pgTable("recommendations", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").references(() => items.id),
  context: text("context"),
  score: numeric("score"),
  reasoning: text("reasoning"),
  userFeedback: text("user_feedback"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// --------------------------------------------------------------------------
// Inferred types for consumers (api, worker, tests).
// --------------------------------------------------------------------------

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type TasteGraph = typeof tasteGraphs.$inferSelect;
export type TasteEvent = typeof tasteEvents.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type DuelPair = typeof duelPairs.$inferSelect;
export type DuelAnswer = typeof duelAnswers.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;

export type NewUser = typeof user.$inferInsert;
export type NewSession = typeof session.$inferInsert;
export type NewAccount = typeof account.$inferInsert;
export type NewVerification = typeof verification.$inferInsert;
export type NewProfile = typeof profiles.$inferInsert;
export type NewTasteGraph = typeof tasteGraphs.$inferInsert;
export type NewTasteEvent = typeof tasteEvents.$inferInsert;
export type NewPhoto = typeof photos.$inferInsert;
export type NewDuelPair = typeof duelPairs.$inferInsert;
export type NewDuelAnswer = typeof duelAnswers.$inferInsert;
export type NewItem = typeof items.$inferInsert;
export type NewRecommendation = typeof recommendations.$inferInsert;
