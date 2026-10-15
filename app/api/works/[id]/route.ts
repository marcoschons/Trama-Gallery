import { db, bucket, json, writeUser, errorResponse, ownArtist } from "../../../lib/server";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await writeUser(request);
    if (auth.response) return auth.response;
    const profile = await ownArtist(auth.user!.userId);
    const { id } = await context.params;
    const work = profile ? await db().prepare("SELECT image_key FROM works WHERE id = ? AND artist_id = ?").bind(id, profile.id).first<{ image_key: string }>() : null;
    if (!work) return json({ error: "Esta arte não foi encontrada no seu portfólio." }, 404);
    await db().prepare("DELETE FROM works WHERE id = ? AND artist_id = ?").bind(id, profile!.id).run();
    await bucket().delete(work.image_key);
    return json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
