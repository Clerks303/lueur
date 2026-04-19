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
      gallery: "ou choisir dans la galerie",
      shutterLabel: "Prendre la photo",
      permissionTitle: "Caméra bloquée",
      permissionBody:
        "Sans l'accès caméra, on ne peut pas commencer. Ouvre les réglages pour l'activer.",
      openSettings: "Ouvrir les réglages",
      uploadFailed: "L'envoi n'a pas abouti. Réessaie dans un instant.",
    },
    analysis: {
      leader: "Je regarde…",
      slow: "Ça prend un peu plus de temps que prévu…",
      hardFailed: "Je n'ai pas réussi à analyser cette photo.",
      tryAnother: "Essayer avec une autre photo",
      timeoutAgain: "Réessayer",
      yes: "Oui, c'est moi",
      correct: "Corrige",
      correctionHeading: "Dis-moi ce qui ne colle pas.",
      correctionSubmit: "Envoyer",
      correctionCancel: "Annuler",
      correctionSubmitted: "Noté.",
    },
  },
  errors: {
    permissionDenied:
      "Sans l'accès caméra, on ne peut pas commencer. Tu peux l'activer dans les Réglages.",
    networkFailed: "Problème de réseau. Réessaie dans un instant.",
  },
} as const;

export default fr;
export type FrDict = typeof fr;
