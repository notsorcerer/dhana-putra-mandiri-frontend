"use client";

import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { useAuth } from "@/lib/auth";
import { CAN, can } from "@/lib/menu";
import { useApi } from "@/lib/use-api";
import type { Product } from "@/types/api";
import { ProductForm } from "../../product-form";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const allowed = can(CAN.manageProducts, session?.role);
  const { data, loading, error } = useApi<Product>(allowed ? `/inventory/products/${params.id}/` : null);

  if (!allowed) {
    return (
      <div>
        <PageHeader title="Ubah produk" />
        <p className="empty-state panel">Peran Anda tidak berhak mengubah produk.</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" /> Memuat produk…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Ubah produk" />
        <p className="errorlist">Gagal memuat produk — {error}</p>
      </div>
    );
  }

  return <ProductForm product={data} />;
}
