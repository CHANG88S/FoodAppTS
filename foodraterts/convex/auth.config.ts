import type { AuthConfig } from "convex/server";
import { convexAuthProvider } from "@convex-dev/auth/server";

// Convex Auth 2.0: access tokens are minted and signed by the auth
// component itself, so no JWT_PRIVATE_KEY/JWKS env vars are needed.
export default {
  providers: [convexAuthProvider()],
} satisfies AuthConfig;
