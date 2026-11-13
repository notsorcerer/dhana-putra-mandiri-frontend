"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { useApi } from "@/lib/use-api";
import type { Customer } from "@/types/api";
import { CustomerForm } from "../../customer-form";

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const allowed = can(CAN.manageMasterData, session?.role);
  const { data, loading, error } = useApi<Customer>(allowed ? `/finance/customers/${params.id}/` : null);

  if (!allowed) {
    return (
      <div>
        <PageHeader title="Ubah pelanggan" />
        <p className="empty-state panel">Peran Anda tidak berhak mengubah pelanggan.</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Memuat pelanggan…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Ubah pelanggan" />
        <p className="errorlist">Gagal memuat pelanggan — {error}</p>
      </div>
    );
  }

  return <CustomerForm customer={data} />;
}
