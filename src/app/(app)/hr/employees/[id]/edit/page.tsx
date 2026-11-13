"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { useApi } from "@/lib/use-api";
import type { Employee } from "@/types/api";
import { EmployeeForm } from "../../employee-form";

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const allowed = can(CAN.manageEmployees, session?.role);
  const { data, loading, error } = useApi<Employee>(allowed ? `/hr/employees/${params.id}/` : null);

  if (!allowed) {
    return (
      <div>
        <PageHeader title="Ubah karyawan" />
        <p className="empty-state panel">Peran Anda tidak berhak mengubah karyawan.</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Memuat karyawan…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Ubah karyawan" />
        <p className="errorlist">Gagal memuat karyawan — {error}</p>
      </div>
    );
  }

  return <EmployeeForm employee={data} />;
}
