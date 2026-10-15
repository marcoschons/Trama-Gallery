export const CATEGORIES = ["Ilustração", "Anime & mangá", "Pixel art", "3D", "Tradicional", "Design"] as const;
export type Artist = {
  id: string; name: string; handle: string; bio: string;
  instagram: string; portfolio: string; contactEmail: string; whatsapp: string;
  open: boolean; demo?: boolean;
};
export type Work = {
  id: string; title: string; description: string; category: string;
  tags: string[]; image: string; createdAt: string; artist: Artist; demo?: boolean;
};
export type ProfileInput = Omit<Artist, "id" | "demo">;
