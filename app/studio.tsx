"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, ImagePlus, LoaderCircle, Palette, Plus, Trash2, Upload, UserRound } from "lucide-react";
import { CATEGORIES, type Artist, type ProfileInput, type Work } from "./lib/types";
import { MAX_FILE_BYTES, validateProfile } from "./lib/validation";
import { apiData } from "./lib/client";

type Props = { profile: Artist | null; works: Work[]; onProfile: (p: Artist) => void; onPublish: (w: Work) => void; onDelete: (id: string) => void; notify: (text: string) => void };
const emptyProfile: ProfileInput = { name: "", handle: "", bio: "", instagram: "", portfolio: "", contactEmail: "", whatsapp: "", open: true };

export default function Studio({ profile, works, onProfile, onPublish, onDelete, notify }: Props) {
  const [tab, setTab] = useState<"upload" | "profile" | "portfolio">(profile ? "upload" : "profile");
  const [fields, setFields] = useState<ProfileInput>(profile || emptyProfile);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [rights, setRights] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!file) { setPreview(""); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  function field(key: keyof ProfileInput, value: string | boolean) { setFields(old => ({ ...old, [key]: value })); }
  function pickFile(f?: File) {
    setError(""); if (!f) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type) || f.size > MAX_FILE_BYTES || f.size === 0) { setError("Envie uma imagem PNG, JPG ou WebP de até 10 MB."); return; }
    setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").slice(0, 100));
  }
  async function saveProfile(e: FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const valid = validateProfile(fields);
      const r = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(valid) });
      const data = await apiData<{ profile: Artist }>(r);
      onProfile(data.profile); setFields(data.profile); setTab("upload");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar seu perfil."); }
    finally { setBusy(false); }
  }
  async function upload(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!file) { setError("Escolha a arte que quer publicar."); return; }
    setBusy(true);
    try {
      const form = new FormData(); form.append("image", file); form.append("title", title); form.append("category", category); form.append("description", description); form.append("tags", tags); form.append("rights", String(rights));
      const r = await fetch("/api/works", { method: "POST", body: form }); const data = await apiData<{ work: Work }>(r);
      onPublish(data.work);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível publicar agora. Sua imagem continua aqui para tentar de novo."); }
    finally { setBusy(false); }
  }
  async function deleteWork(id: string) {
    setBusy(true); setError("");
    try { const r = await fetch(`/api/works/${id}`, { method: "DELETE" }); await apiData<{ ok: boolean }>(r); onDelete(id); setDeleteId(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível remover agora."); }
    finally { setBusy(false); }
  }
  function changeTab(t: typeof tab) { if (busy) return; setTab(t); setError(""); setDeleteId(null); }

  return <div className="studio"><aside className="studio-sidebar"><span className="studio-mark"><Palette size={28} /></span><p className="eyebrow">SEU ESPAÇO CRIATIVO</p><h2>Meu<br /> ateliê.</h2><p className="studio-welcome">Seu portfólio começa<br />com um primeiro traço.</p><nav aria-label="Meu ateliê"><button className={tab === "upload" ? "active" : ""} disabled={!profile} onClick={() => changeTab("upload")}><ImagePlus size={18} />Publicar arte</button><button className={tab === "profile" ? "active" : ""} onClick={() => changeTab("profile")}><UserRound size={18} />Meu perfil</button><button className={tab === "portfolio" ? "active" : ""} disabled={!profile} onClick={() => changeTab("portfolio")}><Palette size={18} />Minhas artes<span>{works.length}</span></button></nav><div className="studio-tip"><span>✳</span><p>O mundo ainda não viu<br />o que só você pode criar.</p></div></aside>
    <div className="studio-main">
      {tab === "profile" && <form onSubmit={saveProfile}><p className="eyebrow">{profile ? "UM POUCO MAIS SOBRE VOCÊ" : "PRIMEIRO, VAMOS NOS CONHECER"}</p><h2>{profile ? "Seu perfil, do seu jeito." : "Quem está por trás do traço?"}</h2><p className="form-intro">Deixe um contato para que boas ideias cheguem até você.</p><div className="field-row"><label className="field">Nome artístico<input required minLength={2} maxLength={60} value={fields.name} onChange={e => field("name", e.target.value)} placeholder="Como você gosta de ser chamado?" /></label><label className="field">Seu @ na Trama<input required minLength={3} maxLength={30} pattern="[a-z0-9][a-z0-9._]{2,29}" value={fields.handle} onChange={e => field("handle", e.target.value.toLowerCase().replace(/^@/, ""))} placeholder="seu.nome" /><small>Letras, números, ponto ou sublinhado.</small></label></div><label className="field">Uma bio com a sua cara<textarea maxLength={600} rows={3} value={fields.bio} onChange={e => field("bio", e.target.value)} placeholder="O que você cria? O que inspira seu trabalho?" /></label><p className="field-section-title">Onde podemos encontrar você?</p><div className="field-row"><label className="field">Instagram<input maxLength={30} value={fields.instagram} onChange={e => field("instagram", e.target.value.replace(/^@/, ""))} placeholder="@seu.usuario" /></label><label className="field">WhatsApp<input type="tel" maxLength={25} value={fields.whatsapp} onChange={e => field("whatsapp", e.target.value)} placeholder="55 + DDD + número" /></label></div><div className="field-row"><label className="field">E-mail para comissões<input type="email" maxLength={254} value={fields.contactEmail} onChange={e => field("contactEmail", e.target.value)} placeholder="contato@seuatelie.com" /></label><label className="field">Site / portfólio<input type="url" maxLength={500} value={fields.portfolio} onChange={e => field("portfolio", e.target.value)} placeholder="https://seuportfolio.com" /></label></div><p className="form-note">Adicione pelo menos um contato. Os contatos preenchidos aparecem no seu perfil.</p><label className="checkbox-field availability-setting"><input type="checkbox" checked={fields.open} onChange={e => field("open", e.target.checked)} /><span><strong>Estou aceitando comissões</strong><small>Você pode mudar isso quando quiser.</small></span></label>{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" className="button button-dark" disabled={busy}>{busy ? <LoaderCircle className="spinner" size={18} /> : <Check size={18} />}{busy ? "Salvando…" : "Salvar perfil e continuar"}</button></form>}
      {tab === "upload" && <form onSubmit={upload}><p className="eyebrow">MAIS UM TRAÇO NA GALERIA</p><h2>O que você criou hoje?</h2><p className="form-intro">Compartilhe uma arte. Deixe a próxima conexão acontecer.</p><input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => pickFile(e.target.files?.[0])} /><div className={`upload-zone ${dragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}>{preview ? <><img src={preview} alt="Prévia da arte escolhida" /><button type="button" className="button button-outline change-image" onClick={() => fileInput.current?.click()}><ImagePlus size={16} />Trocar imagem</button></> : <button type="button" onClick={() => fileInput.current?.click()}><span className="upload-icon"><Upload size={25} /></span><strong>Solte sua arte por aqui</strong><span>ou clique para escolher uma imagem</span><small>PNG, JPG ou WebP · até 10 MB</small></button>}</div><div className="field-row"><label className="field">Nome da obra<input value={title} onChange={e => setTitle(e.target.value)} required minLength={2} maxLength={100} placeholder="Toda arte tem uma história…" /></label><label className="field">Estilo<select value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label></div><label className="field">Sobre essa arte <span className="optional">opcional</span><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={1500} placeholder="Conte sobre a inspiração, o processo ou os detalhes." /></label><label className="field">Tags <span className="optional">opcional</span><input value={tags} onChange={e => setTags(e.target.value)} maxLength={200} placeholder="personagem, fantasia, digital" /><small>Separe por vírgulas. Até 8 tags.</small></label><label className="checkbox-field"><input type="checkbox" required checked={rights} onChange={e => setRights(e.target.checked)} /><span>Esta arte é minha ou tenho autorização para publicá-la.</span></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-bottom"><span>{works.length} / 50 artes no seu portfólio</span><button type="submit" className="button button-green" disabled={busy || works.length >= 50}>{busy ? <LoaderCircle className="spinner" size={18} /> : <Plus size={18} />}{busy ? "Publicando sua arte…" : "Publicar minha arte"}</button></div></form>}
      {tab === "portfolio" && <><p className="eyebrow">SUAS IDEIAS GANHARAM FORMA</p><h2>Um universo que é seu.</h2><p className="form-intro">{works.length} {works.length === 1 ? "obra" : "obras"} no seu portfólio.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="studio-works">{works.map(w => <article key={w.id}><img src={w.image} alt={w.title} /><div><h3>{w.title}</h3><small>{w.category}</small></div>{deleteId === w.id ? <div className="delete-confirm"><p>Remover esta arte?</p><button className="delete-yes" disabled={busy} onClick={() => deleteWork(w.id)}>{busy ? "Removendo…" : "Sim, remover"}</button><button disabled={busy} onClick={() => setDeleteId(null)}>Cancelar</button></div> : <button className="icon-button delete-art" onClick={() => setDeleteId(w.id)} aria-label={`Remover ${w.title}`}><Trash2 size={17} /></button>}</article>)}</div>{!works.length && <div className="empty-state"><Palette size={36} /><h3>Seu primeiro traço vai morar aqui.</h3><p>Comece publicando uma arte que represente você.</p><button className="button button-green" onClick={() => changeTab("upload")}>Publicar minha primeira arte <ArrowRight size={17} /></button></div>}</>}
    </div>
  </div>;
}
