import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
  password: z.string().min(1, { message: "Le mot de passe ne peut pas être vide." }),
});

export const SignupSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});


/**
 * Préférences que le donateur saisit lui-même.
 *
 * Ne contient QUE des champs de formulaire. Les champs écrits par le serveur
 * (lien Bridge, identifiants Stripe, mandat) n'y figurent pas : ils arrivent
 * dans le document utilisateur avec des types Firestore — un Timestamp, par
 * exemple — que ce schéma rejetterait. Comme `form.reset()` recharge le
 * document entier, une seule de ces erreurs bloquait la soumission du
 * formulaire de profil, sans afficher le moindre message.
 */
export const UserOnboardingSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est requis."),
  causes: z.array(z.string()).optional(),
  associations: z.array(z.string()).optional(),
  donationCeiling: z.number().min(5, "Le plafond doit être d'au moins 5 €.").optional().default(50),
  donationMultiplier: z.number().min(1, "Le multiplicateur doit être d'au moins 1.").optional().default(1),
  otherCause: z.string().optional(),
});

export const AssociationOnboardingSchema = z.object({
  associationName: z.string().min(2, "Le nom de l'association est requis."),
  representativeName: z.string().min(2, "Le nom du représentant est requis."),
  contactEmail: z.string().email("L'email de contact est invalide."),
  rnaNumber: z.string().min(1, "Le numéro RNA est requis."),
  description: z.string().min(10, "Veuillez fournir une brève description."),
  fundraisingGoal: z.coerce.number().positive("L'objectif doit être un nombre positif."),
  currentMissions: z.string().optional(),
  stripeAccountId: z.string().optional(),
  logoUrl: z.string().optional(),
});

export type Association = z.infer<typeof AssociationOnboardingSchema> & { id: string };
export type UserProfile = z.infer<typeof UserOnboardingSchema> & { id: string, email: string };
