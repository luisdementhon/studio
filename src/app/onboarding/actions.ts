"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { UserOnboardingSchema, AssociationOnboardingSchema } from '@/lib/schemas';

export async function submitUserOnboarding(values: z.infer<typeof UserOnboardingSchema>) {
  const validatedFields = UserOnboardingSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Champs invalides!' };
  }

  // In a real app, save user preferences to the database.
  console.log('User onboarding data:', validatedFields.data);

  redirect('/dashboard/user');
}

export async function submitAssociationOnboarding(values: z.infer<typeof AssociationOnboardingSchema>) {
  const validatedFields = AssociationOnboardingSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Champs invalides!' };
  }

  // In a real app, save association data to the database and start verification.
  console.log('Association onboarding data:', validatedFields.data);

  redirect('/dashboard/association');
}
