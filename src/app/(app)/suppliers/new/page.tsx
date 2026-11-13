"use client";

import { PageHeader } from "@/components/app/page-header";
import { SupplierForm } from "../supplier-form";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";

export default function NewSupplierPage() {
  const { session } = useAuth();

  if (!can(CAN.manageMasterData, session?.role)) {
    return (
      <div>
        <PageHeader title="Tambah pemasok" />
        <p className="empty-state panel">Peran Anda tidak berhak menambah pemasok.</p>
      </div>
    );
  }

  return <SupplierForm />;
}
