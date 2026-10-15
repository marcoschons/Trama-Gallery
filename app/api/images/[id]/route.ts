import { db, bucket, json, errorResponse } from "../../../lib/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!/^[a-f0-9-]{36}$/.test(id)) return json({ error: "Imagem não encontrada." }, 404);
    const row = await db().prepare("SELECT image_key, mime_type FROM works WHERE id = ?").bind(id).first<{ image_key: string; mime_type: string }>();
    if (!row) return json({ error: "Imagem não encontrada." }, 404);
    const file = await bucket().get(row.image_key);
    if (!file) return json({ error: "Imagem não encontrada." }, 404);
    return new Response(file.body, { headers: { "Content-Type": row.mime_type, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'", "Cache-Control": "private, max-age=300", "ETag": file.httpEtag } });
  } catch (error) { return errorResponse(error); }
}
