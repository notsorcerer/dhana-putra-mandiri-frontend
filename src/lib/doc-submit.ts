import { ApiError, apiPost } from "./api";

/**
 * POST dokumen ber-item dengan strategi fallback.
 *
 * Latar belakang: serializer backend saat ini menyimpan field nested `items`
 * ke dalam validated_data sehingga `Model.objects.create(**validated_data)`
 * melempar TypeError (HTTP 500) ketika items dikirim bersama dokumen
 * (lihat README frontend, bagian "Keterbatasan Backend").
 *
 * Strategi: coba kirim sesuai kontrak API (dengan items). Jika server balas
 * 500, ulangi tanpa items agar draft dokumen tetap tersimpan, lalu tandai
 * `degraded = true` agar UI dapat memberi tahu pengguna.
 */
export async function postDocumentWithItems<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ data: T; degraded: boolean }> {
  try {
    const data = await apiPost<T>(path, body);
    return { data, degraded: false };
  } catch (err) {
    const hasItems = Array.isArray(body.items) && body.items.length > 0;
    if (err instanceof ApiError && err.status === 500 && hasItems) {
      const { items: _dropped, ...header } = body;
      void _dropped;
      const data = await apiPost<T>(path, header);
      return { data, degraded: true };
    }
    throw err;
  }
}
