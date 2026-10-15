import { CATEGORIES, type ProfileInput } from "./types";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export class InputError extends Error {}

export function textField(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== "string") throw new InputError(`${label} inválido.`);
  const text = value.trim();
  if (text.length < min || text.length > max) throw new InputError(`${label} deve ter entre ${min} e ${max} caracteres.`);
  return text;
}

export function validateProfile(input: unknown): ProfileInput {
  if (!input || typeof input !== "object") throw new InputError("Perfil inválido.");
  const p = input as Record<string, unknown>;
  const name = textField(p.name, "Nome", 2, 60);
  const handle = textField(p.handle, "Nome de usuário", 3, 30).toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9][a-z0-9._]{2,29}$/.test(handle) || handle.endsWith(".demo")) throw new InputError("Use 3 a 30 letras, números, pontos ou sublinhados no seu @. O sufixo .demo é reservado.");
  const bio = textField(p.bio ?? "", "Bio", 0, 600);
  const instagram = textField(p.instagram ?? "", "Instagram", 0, 30).replace(/^@/, "");
  if (instagram && !/^[a-zA-Z0-9._]{1,30}$/.test(instagram)) throw new InputError("Informe apenas seu @ do Instagram.");
  const portfolio = textField(p.portfolio ?? "", "Portfólio", 0, 500);
  if (portfolio) {
    let url: URL;
    try { url = new URL(portfolio); } catch { throw new InputError("Informe um link completo para seu portfólio, começando com https://."); }
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".")) throw new InputError("O link do portfólio precisa começar com https://.");
  }
  const contactEmail = textField(p.contactEmail ?? "", "E-mail de contato", 0, 254);
  if (contactEmail && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(contactEmail)) throw new InputError("Informe um e-mail de contato válido.");
  const whatsapp = textField(p.whatsapp ?? "", "WhatsApp", 0, 25).replace(/[\s()+-]/g, "");
  if (whatsapp && !/^\d{10,15}$/.test(whatsapp)) throw new InputError("Informe o WhatsApp com código do país e DDD, por exemplo 5549999999999.");
  if (!instagram && !portfolio && !contactEmail && !whatsapp) throw new InputError("Adicione pelo menos um contato: Instagram, portfólio, e-mail ou WhatsApp.");
  if (typeof p.open !== "boolean") throw new InputError("Disponibilidade inválida.");
  return { name, handle, bio, instagram, portfolio, contactEmail, whatsapp, open: p.open };
}

export function validateWorkFields(form: FormData) {
  const title = textField(form.get("title"), "Título", 2, 100);
  const description = textField(form.get("description") ?? "", "Descrição", 0, 1500);
  const category = textField(form.get("category"), "Estilo", 1, 30);
  if (!(CATEGORIES as readonly string[]).includes(category)) throw new InputError("Escolha um dos estilos disponíveis.");
  const tags = textField(form.get("tags") ?? "", "Tags", 0, 200).split(",").map(t => t.trim()).filter(Boolean).slice(0, 8);
  if (tags.some(t => t.length > 30)) throw new InputError("Cada tag pode ter até 30 caracteres.");
  if (form.get("rights") !== "true") throw new InputError("Confirme que tem autorização para publicar esta arte.");
  return { title, description, category, tags };
}

export function imageMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n)) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP") return "image/webp";
  return null;
}
