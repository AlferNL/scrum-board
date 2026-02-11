import { UserRole, ProjectRole } from '@/types';

/**
 * Permission checking utilities for role-based access control
 */

export interface Permissions {
  canDragTasks: boolean;        // Drag tasks horizontally (change status)
  canDragStories: boolean;      // Drag stories vertically (reorder)
  canEditTasks: boolean;        // Create/Edit/Delete tasks
  canEditStories: boolean;      // Create/Edit/Delete stories
  canEditSprints: boolean;      // Create/Edit/Delete sprints
  canEditProjects: boolean;     // Create/Edit/Delete projects
  canEditColumns: boolean;      // Modify board columns
  canManageUsers: boolean;      // Manage team members
  canDeleteProject: boolean;    // Delete entire project
  isReadOnly: boolean;          // View-only mode
}

/**
 * Get permissions based on user role
 */
export function getPermissions(role: UserRole | undefined): Permissions {
  switch (role) {
    case 'ADMIN':
      return {
        canDragTasks: true,
        canDragStories: true,
        canEditTasks: true,
        canEditStories: true,
        canEditSprints: true,
        canEditProjects: true,
        canEditColumns: true,
        canManageUsers: true,
        canDeleteProject: true,
        isReadOnly: false,
      };

    case 'PRODUCT_OWNER':
    case 'SCRUM_MASTER':
      return {
        canDragTasks: true,
        canDragStories: true,      // Can reorder stories
        canEditTasks: true,
        canEditStories: true,
        canEditSprints: true,
        canEditProjects: false,
        canEditColumns: true,
        canManageUsers: false,
        canDeleteProject: false,
        isReadOnly: false,
      };

    case 'MEMBER':
      return {
        canDragTasks: true,        // Can only drag tasks horizontally
        canDragStories: false,     // Cannot reorder stories
        canEditTasks: true,
        canEditStories: false,
        canEditSprints: false,
        canEditProjects: false,
        canEditColumns: false,
        canManageUsers: false,
        canDeleteProject: false,
        isReadOnly: false,
      };

    case 'VIEWER':
      return {
        canDragTasks: false,       // Cannot drag anything
        canDragStories: false,
        canEditTasks: false,
        canEditStories: false,
        canEditSprints: false,
        canEditProjects: false,
        canEditColumns: false,
        canManageUsers: false,
        canDeleteProject: false,
        isReadOnly: true,
      };

    default:
      // Default to viewer permissions if role is undefined
      return {
        canDragTasks: false,
        canDragStories: false,
        canEditTasks: false,
        canEditStories: false,
        canEditSprints: false,
        canEditProjects: false,
        canEditColumns: false,
        canManageUsers: false,
        canDeleteProject: false,
        isReadOnly: true,
      };
  }
}

/**
 * Check if a user can perform a specific action
 */
export function canPerformAction(
  role: UserRole | undefined,
  action: keyof Permissions
): boolean {
  const permissions = getPermissions(role);
  return permissions[action] as boolean;
}

/**
 * Get permissions based on global role AND project-specific role
 * - ADMIN: Always full permissions (global admin)
 * - Others: Use project role if available, otherwise fall back to global role
 */
export function getProjectPermissions(
  globalRole: UserRole | undefined,
  projectRole: ProjectRole | undefined
): Permissions {
  // ADMIN is always global - full permissions everywhere
  if (globalRole === 'ADMIN') {
    return getPermissions('ADMIN');
  }

  // Use project-specific role if available
  if (projectRole) {
    // Convert ProjectRole to UserRole for the getPermissions function
    // (ProjectRole doesn't include ADMIN, so this is safe)
    return getPermissions(projectRole as UserRole);
  }

  // If user has no project role, they are effectively a viewer for this project
  // unless they have a global role that grants access
  if (globalRole && globalRole !== 'VIEWER') {
    // User has a global role but no project-specific role
    // Default to VIEWER for this project
    return getPermissions('VIEWER');
  }

  // No role - no permissions
  return getPermissions(undefined);
}
