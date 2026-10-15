"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Check, ChevronDown, Copy, ExternalLink, Heart, LoaderCircle, Mail, Menu, MessageCircle, Palette, Plus, Search, Share2, SlidersHorizontal, Sparkles, Users, X } from "lucide-react";
import { DEMO_WORKS } from "./lib/demo";
import { CATEGORIES, type Artist, type Work } from "./lib/types";
import Studio from "./studio";
import { apiData } from "./lib/client";

type ModalState = { type: "work"; work: Work } | { type: "artist"; artist: Artist } | { type: "contact"; artist: Artist; work?: Work } | { type: "studio" } | { type: "signin" } | null;
type Props = { user: { name: string } | null; signInPath: string };
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const initials = (name: string) => name.split(" ").map(s => s[0]).slice(0, 2).join("");
const mod = (n: number, len: number) => ((n % len) + len) % len;

function Brand() {
  return <span className="brand"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 5v18c0 9 13 9 13 0V5m0 0v30M9 15h24M9 27h24" /></svg>trama<span className="brand-dot">✳</span></span>;
}
function Instagram({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".9" fill="currentColor" stroke="none" /></svg>;
}
function Star({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="m50 0 8 29 23-20-11 29 30 12-30 9 12 30-24-19-8 30-9-30-24 19 12-29L0 50l29-11L18 10l23 20z" /></svg>;
}
function Avatar({ artist, large = false }: { artist: Artist; large?: boolean }) {
  return <span className={`avatar ${large ? "avatar-large" : ""}`} style={{ background: ["#e0d7fb", "#f9d8b6", "#d2ebdc"][artist.name.length % 3] }}>{initials(artist.name)}</span>;
}
function Modal({ children, onClose, wide = false }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => { document.body.style.overflow = previous; dialog?.close(); };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? "modal-wide" : ""}`} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }} aria-label="Detalhes da galeria"><button className="icon-button modal-close" onClick={onClose} aria-label="Fechar"><X size={21} /></button>{children}</dialog>;
}

export default function Gallery({ user, signInPath }: Props) {
  const [works, setWorks] = useState<Work[]>([]);
  const [profile, setProfile] = useState<Artist | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [dataError, setDataError] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"discover" | "artists" | "saved">("discover");
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sort, setSort] = useState("recent");
  const [showExamples, setShowExamples] = useState(true);
  const touch = useRef({ x: 0, y: 0 });
  const allWorks = useMemo(() => [...works, ...(showExamples ? DEMO_WORKS : [])], [works, showExamples]);
  const filtered = useMemo(() => allWorks.filter(w =>
    (category === "Todos" || w.category === category) && (!openOnly || (w.artist.open && !w.demo)) &&
    (view !== "saved" || saved.includes(w.id)) &&
    normalize(`${w.title} ${w.category} ${w.artist.name} ${w.artist.handle} ${w.tags.join(" ")}`).includes(normalize(query))
  ).sort((a, b) => sort === "az" ? a.title.localeCompare(b.title, "pt-BR") : 0), [allWorks, category, openOnly, view, saved, query, sort]);
  const artists = useMemo(() => {
    const seen = new Map<string, Artist>();
    for (const w of allWorks) if (!seen.has(w.artist.id)) seen.set(w.artist.id, w.artist);
    if (profile) seen.set(profile.id, profile);
    return [...seen.values()].filter(a => (!openOnly || (a.open && !a.demo)) && normalize(`${a.name} ${a.handle} ${a.bio}`).includes(normalize(query)));
  }, [allWorks, profile, query, openOnly]);
  const current = filtered.length ? filtered[mod(index, filtered.length)] : null;
  const slides = filtered.length > 2 ? [-1, 0, 1] : filtered.length === 2 ? [0, 1] : [0];

  async function loadWorks() {
    setLoading(true); setDataError("");
    try {
      const r = await fetch("/api/works", { cache: "no-store" });
      const data = await apiData<{ works: Work[] }>(r);
      setWorks(data.works);
    } catch { setDataError("A galeria não carregou agora. As obras de exemplo continuam disponíveis."); }
    finally { setLoading(false); }
  }
  async function loadProfile() {
    setProfileError(""); setProfileLoaded(false);
    try {
      const r = await fetch("/api/profile", { cache: "no-store" }); const data = await apiData<{ profile: Artist | null }>(r);
      setProfile(data.profile);
    } catch { setProfileError("Não foi possível carregar seu perfil. Tente novamente."); }
    finally { setProfileLoaded(true); }
  }
  useEffect(() => {
    loadWorks(); if (user) loadProfile(); else setProfileLoaded(true);
    try { const v = JSON.parse(localStorage.getItem("trama-favorites") || "[]"); if (Array.isArray(v)) setSaved(v.filter(id => typeof id === "string").slice(0, 2000)); } catch {}
    if (new URLSearchParams(window.location.search).has("studio") && user) setModal({ type: "studio" });
  }, []);
  useEffect(() => { setIndex(0); }, [category, query, view, openOnly, sort, showExamples]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 4200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (loading) return;
    async function readLocation() {
      const q = new URLSearchParams(window.location.search);
      const workId = q.get("work"); const handle = q.get("artist");
      if (workId) { const work = [...works, ...DEMO_WORKS].find(w => w.id === workId); if (work) setModal({ type: "work", work }); else setToast("Esta arte não está mais disponível."); }
      else if (handle) {
        const sample = DEMO_WORKS.find(w => w.artist.handle === handle)?.artist;
        if (sample) setModal({ type: "artist", artist: sample });
        else {
          try { const r = await fetch(`/api/artists/${encodeURIComponent(handle)}`); const d = await apiData<{ artist: Artist; works: Work[] }>(r); setModal({ type: "artist", artist: d.artist }); setWorks(old => [...old, ...d.works.filter(w => !old.some(x => x.id === w.id))]); }
          catch { setToast("Este perfil não foi encontrado."); }
        }
      }
    }
    readLocation();
    const onPop = () => { if (!window.location.search) setModal(null); else readLocation(); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [loading]);

  function openWork(work: Work) { setModal({ type: "work", work }); window.history.pushState({}, "", `/?work=${encodeURIComponent(work.id)}`); }
  function openArtist(artist: Artist) { setModal({ type: "artist", artist }); window.history.pushState({}, "", `/?artist=${encodeURIComponent(artist.handle)}`); }
  function closeModal() { setModal(null); window.history.replaceState({}, "", window.location.pathname); }
  function openStudio() { if (user) { setModal({ type: "studio" }); window.history.pushState({}, "", "/?studio=1"); } else setModal({ type: "signin" }); }
  function selectView(v: typeof view) { setView(v); setCategory("Todos"); setQuery(""); setOpenOnly(false); setMobileMenu(false); closeModal(); }
  function toggleSave(id: string) {
    const next = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
    setSaved(next);
    try { localStorage.setItem("trama-favorites", JSON.stringify(next)); } catch { setToast("Favoritos guardados apenas nesta sessão."); }
  }
  function navigate(delta: number) { if (filtered.length) setIndex(i => mod(i + delta, filtered.length)); }
  async function share(kind: "work" | "artist", value: string) {
    const url = `${window.location.origin}/?${kind}=${encodeURIComponent(value)}`;
    try { await navigator.clipboard.writeText(url); setToast("Link copiado. Compartilhe essa descoberta!"); } catch { setToast("Copie o link na barra de endereço para compartilhar."); }
  }
  function profileSaved(p: Artist) { setProfile(p); setWorks(old => old.map(w => w.artist.id === p.id ? { ...w, artist: p } : w)); setToast("Seu perfil está pronto para novas conexões."); }
  function workPublished(w: Work) { setWorks(old => [w, ...old]); setCategory("Todos"); setQuery(""); setOpenOnly(false); setView("discover"); setIndex(0); closeModal(); setToast("Arte publicada! Seu traço já faz parte da galeria."); }
  function workDeleted(id: string) { setWorks(old => old.filter(w => w.id !== id)); const next = saved.filter(x => x !== id); setSaved(next); try { localStorage.setItem("trama-favorites", JSON.stringify(next)); } catch {} setToast("Arte removida do seu portfólio."); }
  function showHow(event: React.MouseEvent<HTMLAnchorElement>) { event.preventDefault(); setView("discover"); setMobileMenu(false); requestAnimationFrame(() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })); }

  return <>
    <header className="site-header">
      <button className="brand-button" onClick={() => selectView("discover")} aria-label="Trama, início"><Brand /></button>
      <nav className="desktop-nav" aria-label="Navegação principal">
        <button className={view === "discover" ? "active" : ""} onClick={() => selectView("discover")}>Descobrir<span /></button>
        <button className={view === "artists" ? "active" : ""} onClick={() => selectView("artists")}>Artistas<span /></button>
        <a href="#como-funciona" onClick={showHow}>Como funciona</a>
      </nav>
      <div className="header-actions">
        <button className={`icon-button favorites-button ${view === "saved" ? "selected" : ""}`} onClick={() => selectView("saved")} aria-label={`Favoritos, ${saved.length} artes salvas`}><Bookmark size={20} />{saved.length > 0 && <span>{saved.length}</span>}</button>
        {user && <button className="studio-link" onClick={openStudio}>Meu ateliê</button>}
        <button className="button button-dark publish-button" onClick={openStudio}>Publicar arte <Plus size={17} /></button>
        <button className="icon-button mobile-menu-button" aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menu"><Menu size={23} /></button>
      </div>
      {mobileMenu && <nav className="mobile-nav"><button onClick={() => selectView("discover")}>Descobrir</button><button onClick={() => selectView("artists")}>Artistas</button><button onClick={() => selectView("saved")}>Favoritos</button><button onClick={openStudio}>Meu ateliê / Publicar</button><a href="#como-funciona" onClick={showHow}>Como funciona</a></nav>}
    </header>

    <main>
      <section className="intro content-width">
        <div className="intro-main">
          <p className="eyebrow"><span className="live-dot" /> UM ENCONTRO ENTRE ARTE E GENTE</p>
          <h1>{view === "discover" ? <>Encontre um traço.<br />Comece uma <span className="underlined">conexão.<svg viewBox="0 0 440 20" aria-hidden="true"><path d="M4 13Q190 0 430 10M24 18Q230 8 420 17" /></svg></span></> : view === "artists" ? <>Cada artista,<br />um novo <span className="underlined">universo.</span></> : <>As artes que<br />ficaram com <span className="underlined">você.</span></>}</h1>
        </div>
        <div className="intro-side">
          <div className="doodle"><Star className="doodle-star" /><svg className="doodle-orbit" viewBox="0 0 170 100" aria-hidden="true"><path d="M12 70C75 102 163 53 141 20C126-3 74 12 78 50c5 36 62 22 58 1M114 57l22-6-4 24" /></svg><span>feito de encontros</span></div>
          <p>{view === "discover" ? <>Explore estilos. Conheça quem cria.<br />Dê vida àquela ideia que só você tem.</> : view === "artists" ? <>Conheça a pessoa por trás da arte.<br />Seu próximo projeto pode começar aqui.</> : <>Seu pequeno acervo de descobertas.<br />Favoritos ficam salvos neste navegador.</>}</p>
          <a href="#galeria" className="text-link">{view === "artists" ? "Conhecer artistas" : "Explorar a galeria"}<ArrowDown size={16} /></a>
        </div>
      </section>

      <section className="gallery-section" id="galeria">
        <div className="gallery-toolbar content-width">
          <div className="gallery-label"><span className="section-number">01 /</span><span>{view === "artists" ? "QUEM DÁ VIDA ÀS IDEIAS" : view === "saved" ? "SUAS DESCOBERTAS" : "UM MUNDO DE POSSIBILIDADES"}</span></div>
          <label className="search-box"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Busque uma arte, estilo ou @" aria-label="Buscar artes e artistas" />{query && <button onClick={() => setQuery("")} aria-label="Limpar busca"><X size={16} /></button>}</label>
        </div>
        <div className="filters content-width">
          {view !== "artists" && <div className="category-list" aria-label="Filtrar por estilo">{["Todos", ...CATEGORIES].map(c => <button key={c} className={`chip ${category === c ? "chip-active" : ""}`} aria-pressed={category === c} onClick={() => setCategory(c)}>{c === "Todos" && <Sparkles size={14} />}{c}</button>)}</div>}
          <button className={`availability-filter ${openOnly ? "on" : ""}`} onClick={() => setOpenOnly(!openOnly)} aria-pressed={openOnly}><span className="mini-switch"><span /></span>Comissões abertas</button>
        </div>
        {dataError && <div className="error-banner content-width" role="alert">{dataError}<button onClick={loadWorks}>Tentar novamente</button></div>}
        {view === "discover" && <>
          {current ? <>
            <div className="carousel" role="region" aria-roledescription="carrossel" aria-label="Artes em destaque" tabIndex={0}
              onKeyDown={e => { if (e.key === "ArrowLeft") { e.preventDefault(); navigate(-1); } if (e.key === "ArrowRight") { e.preventDefault(); navigate(1); } }}
              onPointerDown={e => { touch.current = { x: e.clientX, y: e.clientY }; }}
              onPointerUp={e => { const dx = e.clientX - touch.current.x; const dy = e.clientY - touch.current.y; if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.3) navigate(dx < 0 ? 1 : -1); }}>
              <div className="carousel-line" /><Star className="carousel-spark spark-left" /><Star className="carousel-spark spark-right" />
              <span className="carousel-annotation annotation-left">um estilo<br />que é a sua cara <svg viewBox="0 0 110 80" aria-hidden="true"><path d="M5 5q70-5 86 63m-17-9 17 9 8-19" /></svg></span>
              <span className="carousel-annotation annotation-right">a próxima ideia<br />começa aqui <span>✳</span></span>
              {slides.map(offset => {
                const w = filtered[mod(index + offset, filtered.length)];
                return <article key={w.id} className={`art-slide ${offset === 0 ? "slide-center" : offset < 0 ? "slide-left" : "slide-right"}`} aria-label={`${w.title}, ${w.artist.name}`}>
                  <button className="slide-image" onClick={() => offset ? navigate(offset) : openWork(w)} aria-label={offset ? `Mostrar ${w.title}` : `Ver detalhes de ${w.title}`}><img src={w.image} alt={w.title} draggable={false} />{w.demo && <span className="demo-tag">EXEMPLO</span>}{!w.demo && w.artist.open && <span className="open-tag"><span />COMISSÕES ABERTAS</span>}</button>
                  <button className={`save-button ${saved.includes(w.id) ? "is-saved" : ""}`} onClick={() => toggleSave(w.id)} aria-label={saved.includes(w.id) ? "Remover dos favoritos" : "Salvar nos favoritos"} aria-pressed={saved.includes(w.id)}><Heart size={19} fill={saved.includes(w.id) ? "currentColor" : "none"} /></button>
                  <div className="slide-info"><button className="artist-mini" onClick={() => openArtist(w.artist)}><Avatar artist={w.artist} /><span><strong>{w.artist.name}</strong><small>@{w.artist.handle}</small></span></button><span className="category-pill">{w.category}</span></div>
                </article>;
              })}
            </div>
            <div className="carousel-controls content-width">
              <div className="carousel-counter"><strong>{String(mod(index, filtered.length) + 1).padStart(2, "0")}</strong><span>/ {String(filtered.length).padStart(2, "0")}</span><i /><small>NAVEGUE E DESCUBRA</small></div>
              <div className="carousel-buttons"><button className="icon-button round-arrow" onClick={() => navigate(-1)} disabled={filtered.length < 2} aria-label="Arte anterior"><ArrowLeft size={22} /></button><button className="button button-green like-art-button" onClick={() => openWork(current)}>Gostei dessa <ArrowUpRight size={20} /></button><button className="icon-button round-arrow" onClick={() => navigate(1)} disabled={filtered.length < 2} aria-label="Próxima arte"><ArrowRight size={22} /></button></div>
              <span className="carousel-hint">Use as setas ou arraste <ArrowRight size={15} /></span>
            </div>
          </> : <div className="empty-state"><Palette size={38} /><h2>{loading ? "Carregando a galeria…" : "Ainda não encontramos esse traço."}</h2><p>Experimente outro estilo ou publique a primeira arte desta coleção.</p><button className="button button-dark" onClick={() => { setCategory("Todos"); setQuery(""); setOpenOnly(false); setShowExamples(true); }}>Ver todas as artes <ArrowRight size={17} /></button></div>}
          <div className="example-note content-width"><span><span className="tiny-star">✳</span> Obras e perfis de exemplo ajudam a imaginar a comunidade. Sua arte pode ser a próxima.</span><label><input type="checkbox" checked={showExamples} onChange={e => setShowExamples(e.target.checked)} />Mostrar exemplos</label></div>
        </>}

        {view === "artists" && <div className="artist-grid content-width">{artists.map(a => <article className="artist-card" key={a.id}><div className="artist-preview" onClick={() => openArtist(a)}>{allWorks.filter(w => w.artist.id === a.id).slice(0, 3).map(w => <img key={w.id} src={w.image} alt={w.title} loading="lazy" />)}{!allWorks.some(w => w.artist.id === a.id) && <Palette size={44} />}</div><div className="artist-card-content"><div className="artist-card-heading"><Avatar artist={a} /><div><h2>{a.name}</h2><small>@{a.handle}</small></div></div><p>{a.bio || "Um novo artista na comunidade. Conheça seu perfil."}</p><div className="artist-card-bottom"><span className={`status-label ${a.open ? "" : "closed"}`}><span />{a.demo ? "Perfil de exemplo" : a.open ? "Comissões abertas" : "Comissões fechadas"}</span><button className="icon-button" onClick={() => openArtist(a)} aria-label={`Ver perfil de ${a.name}`}><ArrowUpRight size={22} /></button></div></div></article>)}{!artists.length && <div className="empty-state"><Users size={38} /><h2>Nenhum artista por aqui ainda.</h2><p>Tente outra busca ou comece seu próprio perfil.</p><button className="button button-green" onClick={openStudio}>Criar meu perfil <Plus size={18} /></button></div>}</div>}

        {view === "saved" && <div className="saved-content content-width">{filtered.length > 0 ? <div className="works-grid">{filtered.map(w => <WorkCard key={w.id} work={w} saved={saved.includes(w.id)} onOpen={() => openWork(w)} onSave={() => toggleSave(w.id)} onArtist={() => openArtist(w.artist)} />)}</div> : <div className="empty-state"><Bookmark size={38} /><h2>Uma coleção começa com uma descoberta.</h2><p>Toque no coração de uma arte para encontrá-la aqui depois.</p><button className="button button-green" onClick={() => selectView("discover")}>Descobrir artes <ArrowRight size={18} /></button></div>}</div>}
      </section>

      {view === "discover" && <>
        <section className="more-section content-width">
          <div className="section-heading"><div><p className="eyebrow">SEM PRESSA. TEM MUITO PARA EXPLORAR.</p><h2>Mais traços, <span>mais possibilidades.</span></h2></div><label className="sort-label"><SlidersHorizontal size={16} /><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Ordenar obras"><option value="recent">Mais recentes</option><option value="az">Título: A–Z</option></select><ChevronDown size={14} /></label></div>
          <div className="works-grid">{filtered.slice(0, 12).map(w => <WorkCard key={w.id} work={w} saved={saved.includes(w.id)} onOpen={() => openWork(w)} onSave={() => toggleSave(w.id)} onArtist={() => openArtist(w.artist)} />)}</div>
          {!filtered.length && <p className="muted">Nenhuma arte nesta seleção. Altere os filtros acima.</p>}
        </section>
        <section className="how-section content-width" id="como-funciona"><div className="how-intro"><p className="eyebrow">02 / SIMPLES ASSIM</p><h2>Da descoberta<br />à sua próxima ideia.</h2><p>A Trama aproxima quem cria de quem<br className="desktop-break" /> tem uma ideia esperando para acontecer.</p></div><div className="how-steps"><div><span>01</span><div><h3>Encontre seu estilo</h3><p>Navegue pelas artes e salve as que combinam com você.</p></div></div><div><span>02</span><div><h3>Conheça o artista</h3><p>Explore o portfólio, veja o @ e descubra quem está por trás do traço.</p></div></div><div><span>03</span><div><h3>Conversem e criem</h3><p>Peça sua comissão diretamente. Escopo, prazo e valor são combinados com o artista.</p></div></div></div></section>
        <section className="creator-banner content-width"><div><p className="eyebrow">EI, ESSA PARTE É PARA QUEM CRIA</p><h2>Seu traço merece<br />encontrar o mundo.</h2><p>Um perfil, suas artes e um caminho<br />direto para novas conexões.</p><button className="button button-dark" onClick={openStudio}>Quero mostrar minha arte <ArrowUpRight size={20} /></button></div><div className="banner-art"><div className="banner-paper"><Star /><span>mais arte.<br />mais gente.<br />mais <em>trama.</em></span><i>FEITO POR QUEM IMAGINA.</i></div><div className="banner-stamp">VEM<br />CRIAR!<ArrowUpRight size={26} /></div></div></section>
      </>}
    </main>
    <footer className="site-footer content-width"><div><button className="brand-button" onClick={() => selectView("discover")}><Brand /></button><span>Arte encontra conexão.</span></div><p>Feito para aproximar ideias e artistas.</p><button onClick={openStudio}>Faça parte <ArrowUpRight size={16} /></button></footer>

    {modal && <Modal key={modal.type} onClose={closeModal} wide={modal.type === "work" || modal.type === "studio"}>
      {modal.type === "work" && <div className="work-detail"><div className="work-detail-image"><img src={modal.work.image} alt={modal.work.title} /><button className="expand-original" onClick={() => window.open(modal.work.image, "_blank", "noopener,noreferrer")}><ExternalLink size={15} /> Ver imagem inteira</button></div><div className="work-detail-info"><p className="eyebrow">{modal.work.demo ? "OBRA DE DEMONSTRAÇÃO" : "UMA NOVA DESCOBERTA"}</p><span className="category-pill">{modal.work.category}</span><h2>{modal.work.title}</h2><button className="artist-mini detail-artist" onClick={() => openArtist(modal.work.artist)}><Avatar artist={modal.work.artist} /><span><strong>{modal.work.artist.name}</strong><small>@{modal.work.artist.handle} <ArrowUpRight size={13} /></small></span></button><p className="description">{modal.work.description || "Às vezes, a arte conta sua própria história."}</p><div className="tags">{modal.work.tags.map(t => <span key={t}>#{t}</span>)}</div><span className={`status-label ${modal.work.artist.open ? "" : "closed"}`}><span />{modal.work.demo ? "Perfil fictício para demonstração" : modal.work.artist.open ? "Artista com comissões abertas" : "Comissões fechadas no momento"}</span><div className="detail-bottom"><button className="button button-green" disabled={!modal.work.artist.open} onClick={() => setModal({ type: "contact", artist: modal.work.artist, work: modal.work })}>{modal.work.artist.open ? "Pedir uma comissão" : "Comissões fechadas"}<MessageCircle size={18} /></button><div className="detail-secondary"><button className={`button button-outline ${saved.includes(modal.work.id) ? "saved" : ""}`} onClick={() => toggleSave(modal.work.id)}><Heart size={17} fill={saved.includes(modal.work.id) ? "currentColor" : "none"} />{saved.includes(modal.work.id) ? "Salva" : "Salvar"}</button><button className="button button-outline" onClick={() => share("work", modal.work.id)}><Share2 size={17} />Compartilhar</button></div><button className="text-link" onClick={() => openArtist(modal.work.artist)}>Ver perfil e portfólio <ArrowRight size={16} /></button></div></div></div>}
      {modal.type === "artist" && <div className="artist-detail"><div className="profile-cover"><Star /><span>cada pessoa, um universo.</span></div><div className="profile-body"><Avatar artist={modal.artist} large /><div className="profile-title"><div><p className="eyebrow">{modal.artist.demo ? "PERFIL DE EXEMPLO" : "ARTISTA NA TRAMA"}</p><h2>{modal.artist.name}</h2><p>@{modal.artist.handle}</p></div><button className="icon-button button-outline" onClick={() => share("artist", modal.artist.handle)} aria-label="Compartilhar perfil"><Share2 size={19} /></button></div><p className="description">{modal.artist.bio || "Um novo traço na comunidade."}</p><div className="profile-actions"><button className="button button-green" disabled={!modal.artist.open} onClick={() => setModal({ type: "contact", artist: modal.artist })}>{modal.artist.open ? "Vamos criar juntos?" : "Comissões fechadas"}<MessageCircle size={18} /></button>{modal.artist.instagram && <a className="button button-outline" target="_blank" rel="noopener noreferrer" href={`https://www.instagram.com/${encodeURIComponent(modal.artist.instagram)}/`}><Instagram size={17} />Instagram</a>}{modal.artist.portfolio && <a className="button button-outline" target="_blank" rel="noopener noreferrer" href={modal.artist.portfolio}>Portfólio <ArrowUpRight size={16} /></a>}</div><h3 className="portfolio-label">Um pouco desse universo <span>{allWorks.filter(w => w.artist.id === modal.artist.id).length} artes</span></h3><div className="profile-works">{allWorks.filter(w => w.artist.id === modal.artist.id).map(w => <button key={w.id} onClick={() => openWork(w)}><img src={w.image} alt={w.title} /><span>{w.title}</span></button>)}</div>{!allWorks.some(w => w.artist.id === modal.artist.id) && <p className="muted">Este artista está preparando seu portfólio.</p>}</div></div>}
      {modal.type === "contact" && <Contact artist={modal.artist} work={modal.work} notify={setToast} />}
      {modal.type === "signin" && <div className="contact-detail"><span className="contact-symbol"><Palette size={28} /></span><p className="eyebrow">SEU PRÓXIMO TRAÇO COMEÇA AQUI</p><h2>Um ateliê só seu.</h2><p>Entre para criar seu perfil, publicar artes e mostrar como encontrar você.</p><a className="button button-green signin-link" href={signInPath} target="_top">Entrar com ChatGPT <ArrowRight size={18} /></a></div>}
      {modal.type === "studio" && (!profileLoaded ? <div className="modal-loading"><LoaderCircle className="spinner" /><p>Abrindo seu ateliê…</p></div> : profileError ? <div className="modal-loading"><p role="alert">{profileError}</p><button className="button button-green" onClick={loadProfile}>Tentar novamente</button></div> : <Studio profile={profile} works={works.filter(w => w.artist.id === profile?.id)} onProfile={profileSaved} onPublish={workPublished} onDelete={workDeleted} notify={setToast} />)}
    </Modal>}
    {toast && <div className="toast" role="status"><Check size={18} />{toast}<button onClick={() => setToast("")} aria-label="Dispensar"><X size={15} /></button></div>}
  </>;
}

function WorkCard({ work, saved, onOpen, onSave, onArtist }: { work: Work; saved: boolean; onOpen: () => void; onSave: () => void; onArtist: () => void }) {
  return <article className="work-card"><div className="work-card-image"><button onClick={onOpen} aria-label={`Ver ${work.title}`}><img src={work.image} alt={work.title} loading="lazy" />{work.demo && <span className="demo-tag">EXEMPLO</span>}<span className="card-hover">Conhecer essa arte <ArrowUpRight size={19} /></span></button><button className={`save-button ${saved ? "is-saved" : ""}`} onClick={onSave} aria-label={saved ? "Remover dos favoritos" : "Salvar nos favoritos"} aria-pressed={saved}><Heart size={18} fill={saved ? "currentColor" : "none"} /></button><span className="category-pill">{work.category}</span></div><div className="work-card-title"><button onClick={onOpen}><h3>{work.title}</h3></button><ArrowUpRight size={19} /></div><button className="work-card-artist" onClick={onArtist}><span className="avatar-tiny">{initials(work.artist.name)}</span>{work.artist.name}<span className="artist-handle">@{work.artist.handle}</span></button></article>;
}

function Contact({ artist, work, notify }: { artist: Artist; work?: Work; notify: (text: string) => void }) {
  const [idea, setIdea] = useState("");
  const message = `Olá, ${artist.name}! Encontrei seu trabalho na Trama${work ? ` e gostei da arte “${work.title}”` : ""}. Gostaria de conversar sobre uma comissão.\n\nMinha ideia: ${idea || "[conte sua ideia aqui]"}`;
  const encoded = encodeURIComponent(message);
  return <div className="contact-detail"><span className="contact-symbol"><MessageCircle size={28} /></span><p className="eyebrow">UMA IDEIA PODE VIRAR ARTE</p><h2>Vamos conversar<br />com {artist.name.split(" ")[0]}?</h2><p>Conte um pouquinho do que você imagina. Depois, escolha como entrar em contato.</p><label className="field">Sua ideia<textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Um personagem, um presente, a capa do meu projeto…" rows={4} maxLength={1500} /></label>{artist.demo ? <div className="demo-contact"><Sparkles size={20} /><div><strong>Este é um perfil de demonstração.</strong><p>Com um artista real, estes botões levam ao Instagram, WhatsApp ou e-mail cadastrado. Publique seu perfil para experimentar com seus contatos.</p></div></div> : <div className="contact-options">{artist.whatsapp && <a className="button button-green" href={`https://wa.me/${artist.whatsapp}?text=${encoded}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} />Abrir WhatsApp <ArrowUpRight size={17} /></a>}{artist.instagram && <a className="button button-outline" href={`https://www.instagram.com/${encodeURIComponent(artist.instagram)}/`} target="_blank" rel="noopener noreferrer"><Instagram size={18} />@{artist.instagram} <ArrowUpRight size={17} /></a>}{artist.contactEmail && <a className="button button-outline" href={`mailto:${artist.contactEmail}?subject=${encodeURIComponent("Uma comissão pela Trama")}&body=${encoded}`}><Mail size={18} />Escrever um e-mail <ArrowUpRight size={17} /></a>}{artist.portfolio && <a className="button button-outline" href={artist.portfolio} target="_blank" rel="noopener noreferrer"><ExternalLink size={18} />Site do artista <ArrowUpRight size={17} /></a>}</div>}<button className="text-link" onClick={async () => { try { await navigator.clipboard.writeText(message); notify("Mensagem copiada. Agora é só começar a conversa."); } catch { notify("Selecione e copie sua ideia no campo acima."); } }}><Copy size={16} />Copiar mensagem pronta</button><p className="contact-note">Prazo, valor e detalhes são combinados diretamente com o artista.</p></div>;
}
