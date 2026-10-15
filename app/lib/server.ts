import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../chatgpt-auth";
import { InputError } from "./validation";
import type { Artist, Work } from "./types";

export function db(): D1Database {
  if (!env.DB) throw new Error("Armazenamento indisponível.");
  return env.DB;
}
export function bucket(): R2Bucket {
  if (!env.BUCKET) throw new Error("Armazenamento de imagens indisponível.");
  return env.BUCKET;
}
export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export async function writeUser(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return { response: json({ error: "Reabra esta página para continuar." }, 403) };
  const user = await getChatGPTUser();
  if (!user) return { response: json({ error: "Entre na sua conta para continuar." }, 401) };
  return { user };
}
export function errorResponse(error: unknown) {
  if (error instanceof InputError) return json({ error: error.message }, 400);
  console.error("Trama request failed", error instanceof Error ? error.message : "unknown");
  return json({ error: "Não foi possível concluir agora. Tente novamente em instantes." }, 500);
}
type ArtistRow = {
  id: string; user_id: string; name: string; handle: string; bio: string; instagram: string;
  portfolio: string; contact_email: string; whatsapp: string; open: number;
};
export function artistFromRow(r: ArtistRow): Artist {
  return { id: r.id, name: r.name, handle: r.handle, bio: r.bio, instagram: r.instagram, portfolio: r.portfolio, contactEmail: r.contact_email, whatsapp: r.whatsapp, open: Boolean(r.open) };
}
export const WORK_SELECT = `SELECT w.id, w.title, w.description, w.category, w.tags, w.created_at,
  a.id AS artist_id, a.user_id, a.name, a.handle, a.bio, a.instagram, a.portfolio, a.contact_email, a.whatsapp, a.open
  FROM works w JOIN artists a ON a.id = w.artist_id`;
export type WorkRow = ArtistRow & { artist_id: string; title: string; description: string; category: string; tags: string; created_at: string };
export function workFromRow(row: WorkRow): Work {
  return { id: row.id, title: row.title, description: row.description, category: row.category, tags: JSON.parse(row.tags), image: `/api/images/${row.id}`, createdAt: row.created_at, artist: artistFromRow({ ...row, id: row.artist_id }) };
}
export async function ownArtist(userId: string) {
  return await db().prepare("SELECT * FROM artists WHERE user_id = ?").bind(userId).first<ArtistRow>();
}
