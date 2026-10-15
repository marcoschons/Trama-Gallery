import { createRequire } from "node:module";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve("wrangler/package.json"));
const { Miniflare } = await import(wranglerRequire.resolve("miniflare"));
const moduleFiles = (await readdir("dist/server", { recursive: true })).filter(f => /\.(m?js)$/.test(f) && f !== "index.js");
const mf = new Miniflare({
  modules: ["index.js", ...moduleFiles].map(file => ({ type: "ESModule", path: resolve("dist/server", file) })),
  modulesRoot: resolve("dist/server"),
  compatibilityDate: "2026-05-15", compatibilityFlags: ["nodejs_compat"],
  d1Databases: { DB: "trama-test-database" }, r2Buckets: { BUCKET: "trama-test-images" },
  d1Persist: false, r2Persist: false,
});
let checks = 0;
function check(condition, label) { assert.ok(condition, label); checks++; console.log(`✓ ${label}`); }
async function call(path, init = {}, user = "") {
  const headers = new Headers(init.headers);
  if (init.method && init.method !== "GET") headers.set("Origin", headers.get("Origin") || "https://trama.test");
  if (user) { headers.set("oai-authenticated-user-id", user); headers.set("oai-authenticated-user-email", `${user}@example.test`); }
  const request = new Request(`https://trama.test${path}`, { ...init, headers });
  return mf.dispatchFetch(request.url, { method: request.method, headers: request.headers, body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer() });
}
const profile = { name: "Artista Teste", handle: "teste.artista", bio: "Perfil usado apenas em teste local.", instagram: "", portfolio: "https://portfolio.example.test", contactEmail: "artista@example.test", whatsapp: "5549999999999", open: true };
const profileBody = value => ({ method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
try {
  const db = await mf.getD1Database("DB");
  for (const file of (await readdir("drizzle")).filter(f => f.endsWith(".sql")).sort()) {
    const sql = await readFile(`drizzle/${file}`, "utf8");
    for (const statement of sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean)) await db.prepare(statement).run();
  }
  let response = await call("/api/works");
  check(response.status === 200 && (await response.json()).works.length === 0, "Galeria vazia pode ser lida sem identidade");
  response = await call("/api/profile", profileBody(profile));
  check(response.status === 401, "Criação de perfil exige autenticação");
  response = await call("/api/profile", { ...profileBody(profile), headers: { "Content-Type": "application/json", Origin: "https://other.test" } }, "owner");
  check(response.status === 403, "Escrita a partir de outra origem é recusada");
  response = await call("/api/profile", profileBody({ ...profile, portfolio: "javascript:alert(1)" }), "owner");
  check(response.status === 400, "Link de portfólio inseguro é recusado");
  response = await call("/api/profile", profileBody({ ...profile, portfolio: "", contactEmail: "", whatsapp: "" }), "owner");
  check(response.status === 400, "Perfil precisa de pelo menos um contato");
  response = await call("/api/profile", profileBody(profile), "owner");
  const created = await response.json();
  check(response.status === 200 && created.profile.name === profile.name, "Perfil e contatos são persistidos");
  response = await call("/api/profile", profileBody(profile), "other");
  check(response.status === 409, "Um @ não pode pertencer a duas contas");
  response = await call("/api/profile", {}, "owner");
  check((await response.json()).profile.id === created.profile.id, "Perfil próprio é recuperado em outra requisição");
  const png = await readFile("public/art/moon-courier.png");
  const form = () => {
    const data = new FormData();
    data.append("title", "Arte de teste"); data.append("description", "Descrição de teste");
    data.append("category", "Ilustração"); data.append("tags", "teste, integração"); data.append("rights", "true");
    data.append("image", new Blob([png], { type: "image/png" }), "teste.png");
    return data;
  };
  const bad = form(); bad.set("image", new Blob(["not an image"], { type: "image/png" }), "fake.png");
  response = await call("/api/works", { method: "POST", body: bad }, "owner");
  check(response.status === 400, "Arquivo com conteúdo inválido é recusado");
  const unauthorized = form(); unauthorized.set("rights", "false");
  response = await call("/api/works", { method: "POST", body: unauthorized }, "owner");
  check(response.status === 400, "Publicação exige confirmação de direitos");
  response = await call("/api/works", { method: "POST", body: form() }, "owner");
  const published = await response.json();
  check(response.status === 201 && published.work.title === "Arte de teste", "Upload de PNG e metadados funciona");
  const id = published.work.id;
  response = await call(`/api/images/${id}`);
  const stored = new Uint8Array(await response.arrayBuffer());
  check(response.status === 200 && response.headers.get("Content-Type") === "image/png" && Buffer.from(stored).equals(png), "Imagem é recuperada integralmente do R2");
  response = await call("/api/works");
  const listing = await response.json();
  check(listing.works.length === 1 && listing.works[0].artist.id === created.profile.id && !JSON.stringify(listing).includes("owner@example.test"), "Obra aparece na galeria sem expor identidade da conta");
  response = await call("/api/profile", profileBody({ ...profile, name: "Nome atualizado", open: false }), "owner");
  check(response.status === 200, "Nome e disponibilidade podem ser editados");
  response = await call(`/api/artists/${profile.handle}`);
  const publicProfile = await response.json();
  check(publicProfile.artist.name === "Nome atualizado" && publicProfile.works.length === 1 && !publicProfile.artist.open, "Perfil compartilhável mostra obras e disponibilidade atualizadas");
  response = await call(`/api/works/${id}`, { method: "DELETE" }, "other");
  check(response.status === 404, "Outra conta não consegue excluir a arte");
  response = await call(`/api/works/${id}`, { method: "DELETE" }, "owner");
  check(response.status === 200, "O autor consegue remover sua própria arte");
  response = await call(`/api/images/${id}`);
  check(response.status === 404 && await (await mf.getR2Bucket("BUCKET")).get(`works/${id}`) === null, "Exclusão remove metadados e arquivo");
  response = await call("/", {}, "owner");
  const html = await response.text();
  check(response.status === 200 && html.includes("Encontre um traço") && html.includes("/art/moon-courier.png") && html.includes("pt-BR"), "Página principal renderiza o carrossel e conteúdo em português");
  console.log(`\n${checks} verificações de integração passaram. Nenhum dado de produção foi alterado.`);
} finally { await mf.dispose(); }
