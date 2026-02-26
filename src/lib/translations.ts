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
    storiesDone: 'Stories Klaar',
    taskProgress: 'Taken',
    storyProgress: 'Stories',
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
    acceptanceCriteria: 'Acceptatiecriteria',
    definitionOfDone: 'Definition of Done',
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

  // Status Labels (Task columns)
  status: {
    todo: 'Te Doen',
    'in-progress': 'In Uitvoering',
    review: 'Review',
    done: 'Voltooid',
  },

  // Story Status Labels
  storyStatus: {
    OPEN: 'Open',
    IN_PROGRESS: 'In Uitvoering',
    DONE: 'Voltooid',
    ARCHIVED: 'Gearchiveerd',
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
    webhookUrl: 'Teams Webhook URL',
    webhookDescription: 'Optioneel: Microsoft Teams webhook URL voor meldingen bij wijzigingen',
    selectSprint: 'Selecteer Sprint',
    allSprints: 'Alle Sprints',
    // Acceptance Criteria
    acceptanceCriteria: 'Acceptatiecriteria',
    acceptanceCriteriaPlaceholder: 'Voeg acceptatiecriterium toe...',
    // Definition of Done
    definitionOfDone: 'Definition of Done',
    definitionOfDonePlaceholder: 'Voeg DoD item toe...',
    defaultDefinitionOfDone: 'Standaard Definition of Done',
    defaultDodPlaceholder: 'Voeg standaard DoD item toe...',
    defaultDodDescription: 'Deze items worden automatisch toegevoegd aan elke nieuwe User Story',
    // Project members
    projectMembers: 'Projectleden',
    addMember: 'Lid Toevoegen',
    removeMember: 'Lid Verwijderen',
    memberRole: 'Rol',
    noMembers: 'Geen leden aan dit project toegevoegd',
    selectUser: 'Selecteer Gebruiker',
    selectRole: 'Selecteer Rol',
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

  // Story Filter
  filter: {
    label: 'Filter',
    active: 'Actief',
    all: 'Alle',
    showArchived: 'Gearchiveerd Tonen',
  },

  // Story Sort
  sort: {
    label: 'Sorteren',
    none: '- Sorteren -',
    priority: 'Prioriteit',
    status: 'Status',
    progress: 'Voortgang',
    tasks: 'Aantal Taken',
    ascending: 'Oplopend',
    descending: 'Aflopend',
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
    delete: 'Verwijderen',
    more: 'meer',
  },
};

export type TranslationKey = keyof typeof t;
