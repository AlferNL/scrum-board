# 🏃‍♂️ Scrum Board

Een professionele, interactieve Scrum Board applicatie gebouwd met Next.js, TypeScript en Tailwind CSS. Beheer je agile projecten met een intuïtieve drag-and-drop interface.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)

## ✨ Functies

### 📋 Projectbeheer
- **Multi-project ondersteuning** - Beheer meerdere projecten tegelijkertijd
- **Sprint planning** - Maak en beheer sprints per project
- **User Stories** - Organiseer werk in user stories met story points
- **Taken** - Verdeel stories in individuele taken

### 🎯 Scrum Board
- **Swimlane layout** - Elke user story als horizontale swimlane
- **Drag-and-drop** - Sleep taken tussen kolommen (Te Doen, Bezig, Review, Klaar)
- **Real-time updates** - Wijzigingen worden direct opgeslagen in de database
- **Sprint statistieken** - Bekijk voortgang met taken en story points

### 🎨 Gebruikerservaring
- **Donkere modus** - Schakel tussen licht en donker thema
- **Nederlandse interface** - Volledig in het Nederlands
- **Responsief ontwerp** - Werkt op desktop en tablet
- **Moderne UI** - Professionele look met glasmorphism effecten

### 👥 Teambeheer
- **Teamleden** - Wijs taken toe aan teamleden
- **Avatars** - Visuele identificatie van toegewezen personen
- **Prioriteiten** - Markeer taken als laag, gemiddeld, hoog of kritiek

## 🚀 Snel Starten

### Vereisten

- Node.js 18.x of hoger
- npm, yarn of pnpm
- Supabase account (gratis)

### Installatie

1. **Clone de repository**
   ```bash
   git clone https://github.com/AlferNL/scrum-board.git
   cd scrum-board
   ```

2. **Installeer dependencies**
   ```bash
   npm install
   ```

3. **Configureer Supabase**
   
   Maak een nieuw project aan op [supabase.com](https://supabase.com) en voer het SQL schema uit:
   
   ```bash
   # Kopieer de inhoud van supabase/schema.sql naar de SQL Editor in Supabase
   ```

4. **Maak .env.local aan**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=jouw-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
   ```

5. **Start de development server**
   ```bash
   npm run dev
   ```

6. **Open de applicatie**
   
   Ga naar [http://localhost:3000](http://localhost:3000)

## 📁 Projectstructuur

```
scrum-board/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout met ThemeProvider
│   │   └── page.tsx          # Hoofdpagina
│   ├── components/           # React componenten
│   │   ├── Board.tsx         # Hoofd scrumbord component
│   │   ├── BoardHeader.tsx   # Header met project/sprint selectie
│   │   ├── SwimlaneRow.tsx   # User story swimlane
│   │   ├── StoryCard.tsx     # User story kaart
│   │   ├── TaskCard.tsx      # Taak kaart
│   │   ├── TaskModal.tsx     # Modal voor taken
│   │   ├── StoryModal.tsx    # Modal voor stories
│   │   ├── SprintModal.tsx   # Modal voor sprints
│   │   ├── ProjectModal.tsx  # Modal voor projecten
│   │   └── ThemeToggle.tsx   # Donkere modus schakelaar
│   ├── context/              # React Context
│   │   └── ThemeContext.tsx  # Theme management
│   ├── hooks/                # Custom hooks
│   │   └── useSupabaseData.ts# Supabase data hook
│   ├── lib/                  # Hulpfuncties
│   │   ├── supabase.ts       # Supabase client
│   │   └── translations.ts   # Nederlandse vertalingen
│   └── types/                # TypeScript types
│       └── index.ts          # Type definities
├── supabase/
│   └── schema.sql            # Database schema
├── public/                   # Statische bestanden
└── package.json
```

## 🗄️ Database Schema

De applicatie gebruikt Supabase met de volgende tabellen:

| Tabel | Beschrijving |
|-------|-------------|
| `users` | Teamleden met naam en avatar |
| `projects` | Projecten met naam, beschrijving en kleur |
| `sprints` | Sprints gekoppeld aan projecten |
| `stories` | User stories gekoppeld aan sprints |
| `tasks` | Taken gekoppeld aan stories |
| `project_members` | Koppeling tussen projecten en teamleden |
| `sprint_members` | Koppeling tussen sprints en teamleden |

## 🛠️ Technologieën

- **[Next.js 15](https://nextjs.org/)** - React framework met App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS
- **[Supabase](https://supabase.com/)** - Open source Firebase alternatief
- **[@hello-pangea/dnd](https://github.com/hello-pangea/dnd)** - Drag-and-drop bibliotheek
- **[Geist Font](https://vercel.com/font)** - Modern lettertype van Vercel

## 🌐 Deployment

### Vercel (Aanbevolen)

1. Push je code naar GitHub
2. Importeer het project in [Vercel](https://vercel.com)
3. Voeg de environment variables toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Handmatig

```bash
# Build de applicatie
npm run build

# Start de productie server
npm start
```

## 📝 Licentie

Dit project is gemaakt voor educatieve doeleinden.

## 🤝 Bijdragen

Bijdragen zijn welkom! Voel je vrij om een issue aan te maken of een pull request in te dienen.

---

Gemaakt met ❤️ en ☕
