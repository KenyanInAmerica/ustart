// Prevents production Supabase credentials from being used outside a production
// build. If NEXT_PUBLIC_ENVIRONMENT is set to "production" in .env.local while
// NODE_ENV is not "production", the app throws immediately rather than silently
// connecting to the production database.
export function assertNotProduction() {
  if (
    process.env.NEXT_PUBLIC_ENVIRONMENT === "production" &&
    process.env.NODE_ENV !== "production"
  ) {
    throw new Error(
      "Production environment variables cannot be used outside of a production build. " +
        'Check your .env.local and ensure NEXT_PUBLIC_ENVIRONMENT is set to "local" or "staging".'
    );
  }
}
