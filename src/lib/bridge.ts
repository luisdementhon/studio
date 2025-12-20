// In a production environment, these MUST be set as environment variables.
// For development/demo purposes, fallback values are provided directly.
export const BRIDGE_CLIENT_ID = process.env.NEXT_PUBLIC_BRIDGE_CLIENT_ID || 'sandbox_id_eb1eb747f61541d68c1f7775ed91278b';
// Note: Client secret should not be exposed on the client-side.
// It's included here as per user request for context, but should only be used on the server.
export const BRIDGE_CLIENT_SECRET = process.env.BRIDGE_CLIENT_SECRET || 'sandbox_secret_Yv6EdHzK134ZnT3fl5OUpSNNXHMGNsCxrsNEQn20TGAtLqj2Yc61ono0UR1WzZVE';
