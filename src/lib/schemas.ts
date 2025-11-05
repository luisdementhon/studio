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


export const UserOnboardingSchema = z.object({
  fullName: z.string().min(2, "Le nom complet est requis."),
  causes: z.array(z.string()).optional(),
  associations: z.array(z.string()).optional(),
  donationCeiling: z.number().min(0, "Le plafond doit être un nombre positif.").optional().default(50),
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
});
