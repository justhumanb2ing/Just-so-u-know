import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { lastLoginMethod } from "better-auth/plugins";
import { ACCOUNT_LINKING_CONFIG } from "@/lib/auth/account-linking";
import { LAST_LOGIN_METHOD_PLUGIN_OPTIONS } from "@/lib/auth/last-login-method";
import { AUTH_USER_CONFIG } from "@/lib/auth/user-config";
import { dialect } from "../kysely";

export const auth = betterAuth({
  logger: {
    disabled: false,
    disableColors: false,
    level: "warn",
    log: (level, message, ...args) => {
      // Custom logging implementation
      console.log(`[${level}] ${message}`, ...args);
    },
  },
  database: {
    dialect,
    type: "postgres",
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    kakao: {
      clientId: process.env.KAKAO_CLIENT_ID as string,
      clientSecret: process.env.KAKAO_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    naver: {
      clientId: process.env.NAVER_CLIENT_ID as string,
      clientSecret: process.env.NAVER_CLIENT_SECRET as string,
    },
  },
  account: {
    accountLinking: ACCOUNT_LINKING_CONFIG,
  },
  user: AUTH_USER_CONFIG,
  plugins: [nextCookies(), lastLoginMethod(LAST_LOGIN_METHOD_PLUGIN_OPTIONS)],
});
