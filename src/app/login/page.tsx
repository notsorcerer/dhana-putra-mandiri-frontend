"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ROLES, useAuth } from "@/lib/auth";

const ERROR_MESSAGES: Record<string, string> = {
  no_role: "Akun Anda berhasil masuk, tetapi belum memiliki peran aplikasi (Direktur, Admin, Gudang, atau Stakeholder). Hubungi administrator.",
  access_denied: "Login dibatalkan atau ditolak oleh identity provider.",
  invalid_state: "Sesi login tidak valid atau kedaluwarsa. Silakan coba lagi.",
  callback_failed: "Gagal menyelesaikan login. Silakan coba lagi.",
  missing_id_token: "Identity provider tidak mengirim ID token.",
  subject_mismatch: "Identitas token tidak konsisten.",
  idp_unavailable: "Server identitas (Keycloak) tidak dapat dihubungi.",
  idp_error: "Identity provider mengembalikan kesalahan.",
  session_expired: "Sesi Anda telah berakhir. Silakan masuk kembali.",
};

function LoginContent() {
  const { session, status, login, logout } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = useState(false);

  const returnTo = params.get("returnTo") ?? "/";
  const errorCode = status === "no_role" ? "no_role" : params.get("error");
  const loggedOut = params.get("logged_out") === "1";

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/");
    }
  }, [status, session, router, returnTo]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    login(returnTo);
  };

  return (
    <div className="signin">
      <header className="signin-header">
        <div className="brand">
          <span className="brandmark" aria-hidden="true">
            dp<span>.</span>
          </span>
          <span className="brandwords">
            <b>Dhana Putra</b>
            <span>Mandiri</span>
          </span>
        </div>
        <span className="system">
          <i aria-hidden="true" />
          Single Sign-On
        </span>
      </header>

      <div className="signin-body">
        <section className="signin-intro">
          <h1>
            Masuk ke
            <br />
            <span>ruang kerja.</span>
          </h1>
          <p>
            Masuk dengan akun perusahaan melalui OAuth 2.0 / OpenID Connect. Menu dan hak akses
            ditentukan oleh peran yang diberikan administrator di identity provider.
          </p>
        </section>

        <section className="signin-form">
          <form onSubmit={handleSubmit}>
            {errorCode ? (
              <p role="alert" data-testid="login-error">
                {ERROR_MESSAGES[errorCode] ?? "Login gagal. Silakan coba lagi."}
              </p>
            ) : loggedOut ? (
              <p role="status">Anda telah keluar.</p>
            ) : null}

            <fieldset>
              <legend>Peran yang didukung</legend>
              {ROLES.map((role) => (
                <div key={role.value} className="role-choice">
                  <span>{role.label}</span>
                  <small>{role.hint}</small>
                </div>
              ))}
            </fieldset>

            <button type="submit" disabled={pending || status === "loading"}>
              {pending ? "Mengalihkan ke Keycloak…" : "Masuk dengan SSO"} <span aria-hidden="true">→</span>
            </button>

            {status === "no_role" ? (
              <button type="button" onClick={() => void logout()}>
                Keluar dan ganti akun
              </button>
            ) : null}
          </form>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
