import { db, bucket, json, writeUser, errorResponse, ownArtist, workFromRow, WORK_SELECT, type WorkRow } from "../../lib/server";
import { validateWorkFields, imageMime, MAX_FILE_BYTES, InputError } from "../../lib/validation";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const result = await db().prepare(`${WORK_SELECT} ORDER BY w.created_at DESC LIMIT 1000`).all<WorkRow>();
    return json({ works: result.results.map(workFromRow) });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await writeUser(request);
    if (auth.response) return auth.response;
    const profile = await ownArtist(auth.user!.userId);
    if (!profile) return json({ error: "Crie seu perfil de artista antes de publicar." }, 409);
    const length = Number(request.headers.get("content-length"));
    if (length > MAX_FILE_BYTES + 65536) return json({ error: "A imagem precisa ter até 10 MB." }, 413);
    const count = await db().prepare("SELECT COUNT(*) AS total FROM works WHERE artist_id = ?").bind(profile.id).first<{ total: number }>();
    if ((count?.total ?? 0) >= 50) return json({ error: "Seu portfólio chegou a 50 obras. Remova uma para publicar outra." }, 409);
    const form = await request.formData();
    const fields = validateWorkFields(form);
    const file = form.get("image");
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_BYTES) throw new InputError("Escolha uma imagem PNG, JPG ou WebP de até 10 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = imageMime(bytes);
    if (!mime || mime !== file.type) throw new InputError("Arquivo inválido. Envie uma imagem PNG, JPG ou WebP.");
    const id = crypto.randomUUID();
    const key = `works/${id}`;
    await bucket().put(key, bytes, { httpMetadata: { contentType: mime } });
    try {
      await db().prepare("INSERT INTO works (id, artist_id, title, description, category, tags, image_key, mime_type, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, profile.id, fields.title, fields.description, fields.category, JSON.stringify(fields.tags), key, mime, file.size, new Date().toISOString()).run();
    } catch (error) { await bucket().delete(key); throw error; }
    const work = await db().prepare(`${WORK_SELECT} WHERE w.id = ?`).bind(id).first<WorkRow>();
    return json({ work: workFromRow(work!) }, 201);
  } catch (error) { return errorResponse(error); }
}
