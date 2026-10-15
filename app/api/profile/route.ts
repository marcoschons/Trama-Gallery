import { getChatGPTUser } from "../../chatgpt-auth";
import { db, json, writeUser, errorResponse, ownArtist, artistFromRow } from "../../lib/server";
import { validateProfile } from "../../lib/validation";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return json({ profile: null }, 200);
    const profile = await ownArtist(user.userId);
    return json({ profile: profile ? artistFromRow(profile) : null });
  } catch (error) { return errorResponse(error); }
}
export async function PUT(request: Request) {
  try {
    const auth = await writeUser(request);
    if (auth.response) return auth.response;
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "Formato de perfil inválido." }, 400);
    const p = validateProfile(await request.json());
    const previous = await ownArtist(auth.user!.userId);
    const occupied = await db().prepare("SELECT user_id FROM artists WHERE handle = ?").bind(p.handle).first<{ user_id: string }>();
    if (occupied && occupied.user_id !== auth.user!.userId) return json({ error: "Este @ já está em uso. Escolha outro." }, 409);
    const now = new Date().toISOString();
    const id = previous?.id || crypto.randomUUID();
    await db().prepare(`INSERT INTO artists (id, user_id, name, handle, bio, instagram, portfolio, contact_email, whatsapp, open, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET name = excluded.name, handle = excluded.handle, bio = excluded.bio,
      instagram = excluded.instagram, portfolio = excluded.portfolio, contact_email = excluded.contact_email,
      whatsapp = excluded.whatsapp, open = excluded.open, updated_at = excluded.updated_at`)
      .bind(id, auth.user!.userId, p.name, p.handle, p.bio, p.instagram, p.portfolio, p.contactEmail, p.whatsapp, Number(p.open), now, now).run();
    return json({ profile: { id, ...p } });
  } catch (error) { return errorResponse(error); }
}
