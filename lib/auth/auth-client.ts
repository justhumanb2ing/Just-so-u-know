import { lastLoginMethodClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react"; // make sure to import from better-auth/react
import { LAST_LOGIN_METHOD_PLUGIN_OPTIONS } from "@/lib/auth/last-login-method";

export const authClient = createAuthClient({
  plugins: [lastLoginMethodClient(LAST_LOGIN_METHOD_PLUGIN_OPTIONS)],
});
