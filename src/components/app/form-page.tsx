"use client";

import Link from "next/link";

interface FormPageProps {
  eyebrow?: string;
  title: string;
  description?: string;
  sectionTitle?: string;
  sectionDescription?: string;
  backHref: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  submitLabel: string;
  children: React.ReactNode;
}

/**
 * Kerangka halaman formulir sesuai templates/form.html & templates/create.html:
 * judul halaman di atas dan satu <form class="panel formgrid"> dengan tombol Simpan di dalamnya.
 */
export function FormPage({
  title,
  backHref,
  onSubmit,
  saving,
  submitLabel,
  children,
}: FormPageProps) {
  return (
    <div>
      <div className="pagehead">
        <h1>{title}</h1>
        <div className="inline-actions">
          <Link className="outline" href={backHref}>
            Kembali
          </Link>
        </div>
      </div>

      <form onSubmit={onSubmit} className="panel formgrid">
        {children}
        <div className="wide">
          <button type="submit" disabled={saving}>
            {saving ? "Menyimpan…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
