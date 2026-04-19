/**
 * French strings — primary locale. All user-facing copy MUST land here
 * first; `en` is an empty fallback stub to keep i18n-js happy on the
 * rare device that reports a non-fr locale.
 */
const fr = {
  app: {
    brand: "lueur",
  },
  landing: {
    headline: "Une app qui apprend ton goût.",
    sub: "Et s'en souvient.",
    cta: "Commencer",
  },
  onboarding: {
    photo: {
      instruction: "Prends une photo d'un endroit chez toi",
      accent: "que tu aimes.",
    },
    analysis: {
      leader: "Je regarde…",
      yes: "Oui, c'est moi",
      correct: "Corrige",
    },
  },
  errors: {
    permissionDenied:
      "Sans l'accès caméra, on ne peut pas commencer. Tu peux l'activer dans les Réglages.",
    networkFailed:
      "Problème de réseau. Réessaie dans un instant.",
  },
} as const;

export default fr;
export type FrDict = typeof fr;
