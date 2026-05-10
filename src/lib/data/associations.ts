export interface Association {
  id: string;
  name: string;
  cause: string;
  description: string;
  logo: string;
  website: string;
}

export const associations: Association[] = [
  {
    id: "restos-du-coeur",
    name: "Les Restos du Cœur",
    cause: "pauvrete",
    description: "Agir contre la pauvreté et l'exclusion sous toutes ses formes par l'aide alimentaire.",
    logo: "❤️",
    website: "https://www.restosducoeur.org"
  },
  {
    id: "wwf-france",
    name: "WWF France",
    cause: "environnement",
    description: "Protection des espèces menacées et des espaces naturels sauvages à travers le monde.",
    logo: "🐼",
    website: "https://www.wwf.fr"
  },
  {
    id: "croix-rouge",
    name: "Croix-Rouge française",
    cause: "urgence",
    description: "Aider les personnes en difficulté en France et à l'international dans les situations d'urgence.",
    logo: "➕",
    website: "https://www.croix-rouge.fr"
  },
  {
    id: "spa",
    name: "La SPA",
    cause: "animaux",
    description: "Agir pour la protection animale, l'accueil et l'adoption d'animaux abandonnés.",
    logo: "🐶",
    website: "https://www.la-spa.fr"
  },
  {
    id: "amnesty",
    name: "Amnesty International",
    cause: "droits",
    description: "Mouvement mondial agissant pour que les droits humains soient respectés partout.",
    logo: "🕯️",
    website: "https://www.amnesty.fr"
  },
  {
    id: "telethon",
    name: "AFM-Téléthon",
    cause: "sante",
    description: "Innover pour guérir les maladies rares et accompagner les malades et leurs familles.",
    logo: "🧬",
    website: "https://www.afm-telethon.fr"
  }
];
