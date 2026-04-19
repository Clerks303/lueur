/**
 * Better Auth configuration.
 *
 * Providers enabled:
 *   - magic-link via Resend (15 min TTL, single-use)
 *   - anonymous (throwaway user, can upgrade to email later via account linking)
 *
 * Session: 30 days, rolling refresh daily, HttpOnly cookie, 5-min cookie cache.
 * In production we'll flip Secure=true via trustHost/baseURL once HTTPS is in.
 *
 * `onLinkAccount` wires the anonymous → email upgrade: when the anonymous
 * user signs in with a magic link, we carry their taste graph, events,
 * photos, etc. onto the new user record. For T04 we only need the stub;
 * the actual migration of user-scoped rows will be fleshed out when we
 * build the upgrade UX.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, magicLink } from "better-auth/plugins";
import { Resend } from "resend";

import {
  account,
  session as sessionTable,
  user,
  verification,
} from "@lueur/db";

import { loadEnv } from "../env.js";
import { getDb } from "./db.js";
import { logger } from "./logger.js";

const env = loadEnv();

async function sendMagicLink({
  email,
  url,
}: {
  email: string;
  url: string;
}): Promise<void> {
  const subject = "Ton lien Lueur";
  const text = [
    "Voici ton lien pour ouvrir Lueur sur ton téléphone.",
    "Il expire dans 15 minutes.",
    "",
    url,
    "",
    "Si ce n'est pas toi, ignore cet email.",
  ].join("\n");

  if (!env.RESEND_API_KEY) {
    logger.warn(
      { email, url },
      "RESEND_API_KEY missing — printing magic link to logs instead of emailing",
    );
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM,
    to: email,
    subject,
    text,
  });
  if (error) {
    logger.error({ err: error, email }, "Resend send failed");
    throw new Error(`Failed to send magic link: ${error.message}`);
  }
  logger.info({ email }, "magic link sent");
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.API_TRUSTED_ORIGINS.split(",").map((s) => s.trim()),

  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      user,
      session: sessionTable,
      account,
      verification,
    },
  }),

  advanced: {
    // Our user/session/account/verification columns are uuid. Better Auth
    // inserts the id explicitly, so we must give it a real UUID (its default
    // nanoid string fails Postgres' uuid parser).
    database: {
      generateId: () => crypto.randomUUID(),
    },
    cookiePrefix: "lueur",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // rolling refresh daily
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  // Email+password explicitly disabled — we only want magic-link and anonymous.
  emailAndPassword: { enabled: false },

  plugins: [
    anonymous({
      emailDomainName: "lueur.local",
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        logger.info(
          { anonymousUserId: anonymousUser.user.id, newUserId: newUser.user.id },
          "anonymous user linked to email account (taste graph migration TBD)",
        );
      },
    }),
    magicLink({
      expiresIn: 60 * 15, // 15 minutes
      disableSignUp: false,
      sendMagicLink,
    }),
  ],
});

export type Auth = typeof auth;
export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;
