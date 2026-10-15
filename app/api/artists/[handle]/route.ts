import { db, json, errorResponse, artistFromRow, WORK_SELECT, workFromRow, type WorkRow } from "../../../lib/server";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await context.params;
    const profile = await db().prepare("SELECT * FROM artists WHERE handle = ?").bind(handle).first();
    if (!profile) return json({ error: "Artista não encontrado." }, 404);
    const works = await db().prepare(`${WORK_SELECT} WHERE a.handle = ? ORDER BY w.created_at DESC`).bind(handle).all<WorkRow>();
    return json({ artist: artistFromRow(profile as unknown as Parameters<typeof artistFromRow>[0]), works: works.results.map(workFromRow) });
  } catch (error) { return errorResponse(error); }
}
