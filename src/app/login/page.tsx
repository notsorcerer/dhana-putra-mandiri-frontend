"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES, useAuth, type Role, type RoleInfo } from "@/lib/auth";

export default function LoginPage() {
  const { session, hydrated, login } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [selected, setSelected] = useState<Role>("direktur");

  useEffect(() => {
    if (hydrated && session) {
      router.replace("/");
    }
  }, [hydrated, session, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const role: RoleInfo | undefined = ROLES.find((item) => item.value === selected);
    if (!role) return;
    setPending(role.value);
    login(role);
    router.replace("/");
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
          Demo sintetis
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
            Pilih peran untuk mencoba aplikasi distribusi CV Dhana Putra Mandiri dengan data sintetis.
          </p>
        </section>

        <section className="signin-form">
          <form onSubmit={handleSubmit}>
            <fieldset>
              <legend>Peran pegawai</legend>
              {ROLES.map((role) => (
                <label key={role.value} className="role-choice">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selected === role.value}
                    onChange={() => setSelected(role.value)}
                    required
                  />
                  <span>{role.label}</span>
                  <small>{role.hint}</small>
                </label>
              ))}
            </fieldset>

            <button type="submit" disabled={pending !== null}>
              {pending !== null ? "Memuat ruang kerja…" : "Masuk ke ruang kerja"}{" "}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
