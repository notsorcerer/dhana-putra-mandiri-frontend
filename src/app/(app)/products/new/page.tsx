"use client";

import { PageHeader } from "@/components/app/page-header";
import { ProductForm } from "../product-form";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";

export default function NewProductPage() {
  const { session } = useAuth();

  if (!can(CAN.manageProducts, session?.role)) {
    return (
      <div>
        <PageHeader title="Tambah produk" />
        <p className="empty-state panel">Peran Anda tidak berhak menambah produk.</p>
      </div>
    );
  }

  return <ProductForm />;
}
