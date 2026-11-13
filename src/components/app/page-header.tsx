interface PageHeaderProps {
  title: string;
  description?: string;
  /** Label kecil di atas judul, mis. "DOKUMEN PENJUALAN". */
  eyebrow?: string;
  children?: React.ReactNode;
}

/** Judul halaman gaya prototipe: H1 besar, deskripsi 13px, aksi di kanan. */
export function PageHeader({ title, description, eyebrow, children }: PageHeaderProps) {
  return (
    <div className="pagehead">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {children ? <div className="inline-actions">{children}</div> : null}
    </div>
  );
}
