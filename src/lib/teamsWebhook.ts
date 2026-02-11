/**
 * Microsoft Teams Webhook Integration
 * Sends notifications to Teams channels when changes occur in the Scrum Board
 */

import { User } from '@/types';

// Activity types for notifications
export type ActivityType = 
  | 'project_created' | 'project_updated' | 'project_deleted'
  | 'sprint_created' | 'sprint_updated' | 'sprint_deleted'
  | 'story_created' | 'story_updated' | 'story_deleted' | 'story_status_changed'
  | 'task_created' | 'task_updated' | 'task_deleted' | 'task_status_changed'
  | 'member_added' | 'member_removed' | 'member_role_changed';

// Dutch activity descriptions
const ACTIVITY_DESCRIPTIONS: Record<ActivityType, string> = {
  project_created: 'heeft een nieuw project aangemaakt',
  project_updated: 'heeft het project bijgewerkt',
  project_deleted: 'heeft het project verwijderd',
  sprint_created: 'heeft een nieuwe sprint aangemaakt',
  sprint_updated: 'heeft de sprint bijgewerkt',
  sprint_deleted: 'heeft de sprint verwijderd',
  story_created: 'heeft een nieuwe story aangemaakt',
  story_updated: 'heeft de story bijgewerkt',
  story_deleted: 'heeft de story verwijderd',
  story_status_changed: 'heeft de story status gewijzigd',
  task_created: 'heeft een nieuwe taak aangemaakt',
  task_updated: 'heeft de taak bijgewerkt',
  task_deleted: 'heeft de taak verwijderd',
  task_status_changed: 'heeft de taak status gewijzigd',
  member_added: 'heeft een nieuw lid toegevoegd',
  member_removed: 'heeft een lid verwijderd',
  member_role_changed: 'heeft de rol van een lid gewijzigd',
};

// Entity type colors for Teams card
const ENTITY_COLORS: Record<string, string> = {
  project: '#3B82F6', // blue
  sprint: '#10B981', // green
  story: '#F59E0B', // amber
  task: '#8B5CF6', // violet
  member: '#EC4899', // pink
};

interface ActivityDetails {
  entityType: 'project' | 'sprint' | 'story' | 'task' | 'member';
  entityName: string;
  oldValue?: string;
  newValue?: string;
  additionalInfo?: string;
}

/**
 * Format a date in Dutch locale
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Create a Teams Adaptive Card message payload
 */
function createTeamsMessage(
  user: User,
  activityType: ActivityType,
  details: ActivityDetails,
  projectName: string
): object {
  const timestamp = formatDateTime(new Date());
  const activityDescription = ACTIVITY_DESCRIPTIONS[activityType];
  const themeColor = ENTITY_COLORS[details.entityType] || '#3B82F6';

  // Build facts array for details
  const facts: Array<{ title: string; value: string }> = [
    { title: 'Project', value: projectName },
    { title: details.entityType.charAt(0).toUpperCase() + details.entityType.slice(1), value: details.entityName },
  ];

  if (details.oldValue && details.newValue) {
    facts.push({ title: 'Van', value: details.oldValue });
    facts.push({ title: 'Naar', value: details.newValue });
  }

  if (details.additionalInfo) {
    facts.push({ title: 'Details', value: details.additionalInfo });
  }

  facts.push({ title: 'Tijdstip', value: timestamp });

  // Teams Adaptive Card format
  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": themeColor.replace('#', ''),
    "summary": `${user.name} ${activityDescription}`,
    "sections": [
      {
        "activityTitle": `**${user.name}** ${activityDescription}`,
        "activitySubtitle": `Scrum Board - ${projectName}`,
        "activityImage": user.avatar,
        "facts": facts,
        "markdown": true,
      },
    ],
  };
}

/**
 * Send a notification to Teams webhook
 * This is a fire-and-forget operation - errors are logged but don't throw
 */
export async function sendTeamsNotification(
  webhookUrl: string | undefined,
  user: User | undefined,
  activityType: ActivityType,
  details: ActivityDetails,
  projectName: string
): Promise<void> {
  // Skip if no webhook URL or user
  if (!webhookUrl || !user) {
    return;
  }

  try {
    const message = createTeamsMessage(user, activityType, details, projectName);
    
    // Fire and forget - don't await in production to avoid blocking
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }).catch((err) => {
      console.error('Teams webhook error:', err);
    });
  } catch (error) {
    console.error('Error creating Teams notification:', error);
  }
}

/**
 * Helper to get project webhook URL from projects array
 */
export function getProjectWebhookUrl(
  projects: Array<{ id: string; webhookUrl?: string }>,
  projectId: string
): string | undefined {
  const project = projects.find(p => p.id === projectId);
  return project?.webhookUrl;
}

/**
 * Helper to find project by sprint ID
 */
export function findProjectBySprintId(
  projects: Array<{ id: string; webhookUrl?: string; sprints: Array<{ id: string }> }>,
  sprintId: string
): { id: string; webhookUrl?: string; name?: string } | undefined {
  return projects.find(p => p.sprints?.some(s => s.id === sprintId));
}

/**
 * Helper to find project by story ID
 */
export function findProjectByStoryId(
  projects: Array<{ id: string; webhookUrl?: string; name: string; sprints: Array<{ id: string; stories: Array<{ id: string }> }> }>,
  storyId: string
): { id: string; webhookUrl?: string; name: string } | undefined {
  return projects.find(p => 
    p.sprints?.some(s => s.stories?.some(story => story.id === storyId))
  );
}

/**
 * Helper to find project and story by task ID
 */
export function findProjectByTaskId(
  projects: Array<{ id: string; webhookUrl?: string; name: string; sprints: Array<{ id: string; stories: Array<{ id: string; tasks: Array<{ id: string }> }> }> }>,
  taskId: string
): { project?: { id: string; webhookUrl?: string; name: string }; storyTitle?: string } {
  for (const project of projects) {
    for (const sprint of project.sprints || []) {
      for (const story of sprint.stories || []) {
        if (story.tasks?.some(t => t.id === taskId)) {
          return { project, storyTitle: (story as any).title };
        }
      }
    }
  }
  return {};
}
