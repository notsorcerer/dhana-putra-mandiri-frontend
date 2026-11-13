"use client";

import { PageHeader } from "@/components/app/page-header";
import { EmployeeForm } from "../employee-form";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";

export default function NewEmployeePage() {
  const { session } = useAuth();

  if (!can(CAN.manageEmployees, session?.role)) {
    return (
      <div>
        <PageHeader title="Tambah karyawan" />
        <p className="empty-state panel">Peran Anda tidak berhak menambah karyawan.</p>
      </div>
    );
  }

  return <EmployeeForm />;
}
