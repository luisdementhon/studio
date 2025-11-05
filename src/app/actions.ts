"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { LoginSchema, SignupSchema } from "@/lib/schemas";

export async function login(values: z.infer<typeof LoginSchema>) {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  // In a real app, you would verify credentials against your database.
  // For this demo, we'll simulate a successful login.

  console.log("Login successful for:", validatedFields.data.email);

  // Redirect to the user dashboard after login.
  // In a real app, you'd check the user's role and redirect accordingly.
  redirect("/dashboard/user");
}

export async function signup(values: z.infer<typeof SignupSchema>) {
  const validatedFields = SignupSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  // In a real app, you would create a new user in your database.
  // For this demo, we'll simulate a successful signup.
  
  console.log("Signup successful for:", validatedFields.data.email);

  // Redirect to the onboarding flow after signup.
  redirect("/onboarding");
}
