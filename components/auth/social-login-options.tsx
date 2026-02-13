"use client";

import { LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SOCIAL_PROVIDER_OPTIONS, type SocialProvider } from "@/components/auth/social-provider-options";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type SocialLoginOptionsProps = {
  callbackURL?: string;
};

export function SocialLoginOptions({ callbackURL = "/" }: SocialLoginOptionsProps = {}) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUsedLoginMethod, setLastUsedLoginMethod] = useState<string | null>(null);

  useEffect(() => {
    setLastUsedLoginMethod(authClient.getLastUsedLoginMethod());
  }, []);

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setError(null);
      setLoadingProvider(provider);
      await authClient.signIn.social({
        provider,
        callbackURL,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "소셜 로그인 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2">
        {SOCIAL_PROVIDER_OPTIONS.map((option) => (
          <Button
            key={option.provider}
            variant="outline"
            size={"lg"}
            className={cn("relative py-6 shadow-none", option.buttonClassName)}
            disabled={loadingProvider !== null}
            onClick={() => handleSocialLogin(option.provider)}
            aria-label={`${option.label} 로그인 (${option.loginOption})`}
            title={`${option.label} 로그인 (${option.loginOption})`}
          >
            {loadingProvider === option.provider ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <div>
                <span className="flex items-center gap-1">
                  <option.Icon className="size-4" />
                  Login with {option.label}
                </span>
                {lastUsedLoginMethod === option.provider ? (
                  <Badge variant="default" className="absolute -top-2.5 -right-2.5 ml-1">
                    Last used
                  </Badge>
                ) : null}
              </div>
            )}
          </Button>
        ))}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
