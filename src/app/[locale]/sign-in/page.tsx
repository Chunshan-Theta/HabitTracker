"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? `/${locale}/dashboard`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError(tErrors("invalidCredentials"));
      setLoading(false);
      return;
    }

    router.push(result?.url ?? callbackUrl);
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-6 py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl bg-white p-8 shadow-[var(--shadow-soft)]">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl text-[#2f1d1d]">
            {t("signInTitle")}
          </h1>
          <p className="text-sm text-slate-500">{t("switchToSignUp")}</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            {t("email")}
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t("password")}
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#f27c91] px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? t("signIn") : t("signIn")}
          </button>
        </form>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/sign-up`)}
          className="text-sm font-semibold text-[#d14c64]"
        >
          {t("signUp")}
        </button>
      </div>
    </main>
  );
}
