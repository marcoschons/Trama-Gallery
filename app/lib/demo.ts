import type { Work } from "./types";

export const DEMO_WORKS: Work[] = [
  {
    id: "demo-moon", title: "Entre luas e encontros", category: "Anime & mangá",
    description: "Uma mensageira, um pequeno companheiro e uma cidade cheia de histórias. Obra criada com IA exclusivamente para demonstrar esta galeria; o perfil é fictício.",
    image: "/art/moon-courier.png", tags: ["personagem", "anime", "digital"], createdAt: "2026-10-10T12:00:00.000Z", demo: true,
    artist: { id: "demo-lia", name: "Lia Nami", handle: "lia.nami.demo", bio: "Personagens, pequenos universos e histórias em cores. Este é um perfil fictício para apresentar a experiência da Trama.", instagram: "", portfolio: "", contactEmail: "", whatsapp: "", open: true, demo: true },
  },
  {
    id: "demo-garden", title: "Um jardim que sonha", category: "Ilustração",
    description: "Peixes que parecem flutuar e flores que abraçam o céu. Obra criada com IA exclusivamente para demonstrar esta galeria; o perfil é fictício.",
    image: "/art/dream-garden.png", tags: ["gouache", "natureza", "fantasia"], createdAt: "2026-10-10T11:00:00.000Z", demo: true,
    artist: { id: "demo-julia", name: "Júlia Sol", handle: "julia.sol.demo", bio: "Ilustrações para quem gosta de enxergar poesia nas coisas pequenas. Este é um perfil fictício para apresentar a experiência da Trama.", instagram: "", portfolio: "", contactEmail: "", whatsapp: "", open: true, demo: true },
  },
  {
    id: "demo-orbit", title: "Pequeno universo", category: "3D",
    description: "Um viajante de outra órbita, feito de formas e curiosidade. Obra criada com IA exclusivamente para demonstrar esta galeria; o perfil é fictício.",
    image: "/art/orbit-friend.png", tags: ["3d", "personagem", "toy art"], createdAt: "2026-10-10T10:00:00.000Z", demo: true,
    artist: { id: "demo-theo", name: "Theo Orbit", handle: "theo.orbit.demo", bio: "Formas divertidas, personagens e mundos que cabem na imaginação. Este é um perfil fictício para apresentar a experiência da Trama.", instagram: "", portfolio: "", contactEmail: "", whatsapp: "", open: true, demo: true },
  },
];
