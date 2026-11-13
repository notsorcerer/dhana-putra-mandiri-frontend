"use client";

import { PageHeader } from "@/components/app/page-header";
import { CustomerForm } from "../customer-form";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";

export default function NewCustomerPage() {
  const { session } = useAuth();

  if (!can(CAN.manageMasterData, session?.role)) {
    return (
      <div>
        <PageHeader title="Tambah pelanggan" />
        <p className="empty-state panel">Peran Anda tidak berhak menambah pelanggan.</p>
      </div>
    );
  }

  return <CustomerForm />;
}
