"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { useApi } from "@/lib/use-api";
import type { Supplier } from "@/types/api";
import { SupplierForm } from "../../supplier-form";

export default function EditSupplierPage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const allowed = can(CAN.manageMasterData, session?.role);
  const { data, loading, error } = useApi<Supplier>(allowed ? `/finance/suppliers/${params.id}/` : null);

  if (!allowed) {
    return (
      <div>
        <PageHeader title="Ubah pemasok" />
        <p className="empty-state panel">Peran Anda tidak berhak mengubah pemasok.</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Memuat pemasok…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Ubah pemasok" />
        <p className="errorlist">Gagal memuat pemasok — {error}</p>
      </div>
    );
  }

  return <SupplierForm supplier={data} />;
}
