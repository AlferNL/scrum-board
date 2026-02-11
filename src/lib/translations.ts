// ============================================
// Dutch Translations for Scrum Board
// ============================================

export const t = {
  // Column Headers
  columns: {
    todo: 'Te Doen',
    'in-progress': 'In Uitvoering',
    review: 'Review',
    done: 'Voltooid',
  },

  // Board Header
  board: {
    userStories: 'User Stories',
    activeSprint: 'Actieve Sprint',
    daysLeft: 'Dagen Over',
    days: 'dagen',
    stories: 'Stories',
    points: 'Punten',
    tasksDone: 'Taken Klaar',
    sprintProgress: 'Sprint Voortgang',
  },

  // Story Card
  story: {
    progress: 'Voortgang',
    tasks: 'taken',
    storyPoints: 'Story Punten',
    edit: 'Bewerken',
    delete: 'Verwijderen',
    addTask: 'Taak Toevoegen',
  },

  // Task Card
  task: {
    hours: 'u',
    edit: 'Bewerken',
    delete: 'Verwijderen',
  },

  // Priority Labels
  priority: {
    low: 'Laag',
    medium: 'Gemiddeld',
    high: 'Hoog',
    critical: 'Kritiek',
  },

  // Status Labels
  status: {
    todo: 'Te Doen',
    'in-progress': 'In Uitvoering',
    review: 'Review',
    done: 'Voltooid',
  },

  // Modal Forms
  modal: {
    editTask: 'Taak Bewerken',
    editStory: 'Story Bewerken',
    editSprint: 'Sprint Bewerken',
    editProject: 'Project Bewerken',
    newTask: 'Nieuwe Taak',
    newStory: 'Nieuwe Story',
    newSprint: 'Nieuwe Sprint',
    newProject: 'Nieuw Project',
    title: 'Titel',
    description: 'Beschrijving',
    status: 'Status',
    priority: 'Prioriteit',
    assignee: 'Toegewezen aan',
    storyPoints: 'Story Punten',
    estimatedHours: 'Geschatte Uren',
    save: 'Opslaan',
    cancel: 'Annuleren',
    create: 'Aanmaken',
    delete: 'Verwijderen',
    confirmDelete: 'Weet je zeker dat je dit wilt verwijderen?',
    // Sprint specific
    sprintName: 'Sprint Naam',
    sprintGoal: 'Sprint Doel',
    startDate: 'Startdatum',
    endDate: 'Einddatum',
    duration: 'Duur',
    activeSprint: 'Actieve Sprint',
    activeSprintDesc: 'Markeer als huidige actieve sprint',
    teamMembers: 'Teamleden',
    // Project specific
    projectName: 'Project Naam',
    projectColor: 'Project Kleur',
    selectSprint: 'Selecteer Sprint',
    allSprints: 'Alle Sprints',
  },

  // Menu
  menu: {
    newStory: 'Nieuwe Story',
    newSprint: 'Nieuwe Sprint',
    newProject: 'Nieuw Project',
    settings: 'Instellingen',
    darkMode: 'Donkere Modus',
    lightMode: 'Lichte Modus',
    export: 'Exporteren',
    import: 'Importeren',
    editSprint: 'Sprint Bewerken',
    switchProject: 'Project Wisselen',
    switchSprint: 'Sprint Wisselen',
  },

  // Projects
  project: {
    title: 'Projecten',
    active: 'Actief',
    sprints: 'sprints',
    members: 'leden',
    selectProject: 'Selecteer Project',
    noProjects: 'Geen projecten',
    createFirst: 'Maak je eerste project aan',
  },

  // Sprints
  sprint: {
    title: 'Sprints',
    active: 'Actief',
    upcoming: 'Aankomend',
    completed: 'Afgerond',
    noSprints: 'Geen sprints',
    createFirst: 'Maak je eerste sprint aan',
  },

  // Empty States
  empty: {
    noStories: 'Geen stories in deze sprint',
    addStories: 'Voeg user stories toe om te beginnen',
    noTasks: 'Geen taken',
  },

  // Common
  common: {
    loading: 'Laden...',
    error: 'Er is een fout opgetreden',
    success: 'Succesvol opgeslagen',
    unassigned: 'Niet toegewezen',
    selectAssignee: 'Selecteer persoon',
  },
};

export type TranslationKey = keyof typeof t;
