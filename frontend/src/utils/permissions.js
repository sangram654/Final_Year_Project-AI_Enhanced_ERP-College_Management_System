// Permission utility functions for frontend RBAC
// Maps to backend roles.js configuration

const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student',
    PARENT: 'parent',
    ACCOUNTANT: 'accountant',
    LIBRARIAN: 'librarian',
    RECEPTIONIST: 'receptionist',
};

const MODULES = {
    FRONT_OFFICE: 'front_office',
    STUDENT_INFO: 'student_info',
    FEES: 'fees',
    INCOME: 'income',
    EXPENSE: 'expense',
    ATTENDANCE: 'attendance',
    ACADEMIC: 'academic',
    HUMAN_RESOURCES: 'human_resources',
    COMMUNICATION: 'communication',
    DOWNLOAD_CENTER: 'download_center',
    LIBRARY: 'library',
    INVENTORY: 'inventory',
    CERTIFICATE: 'certificate',
    FRONT_CMS: 'front_cms',
    ONLINE_NOTES: 'online_notes',
    MARKS: 'marks',
    LEAVE: 'leave',
    SCHOLARSHIP: 'scholarship',
    GALLERY: 'gallery',
    REPORTS: 'reports',
    USER_MANAGEMENT: 'user_management',
    SYSTEM_SETTINGS: 'system_settings',
};

const ACTIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
};

// Role-Module-Action permission mapping (matches backend roles.js)
const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: {
        // Full access to everything
        [MODULES.COMMUNICATION]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE],
        // ... other modules would be added here
    },
    [ROLES.ADMIN]: {
        [MODULES.COMMUNICATION]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE],
        // ... other modules
    },
    [ROLES.TEACHER]: {
        [MODULES.COMMUNICATION]: [ACTIONS.READ, ACTIONS.CREATE],
        // ... other modules
    },
    [ROLES.STUDENT]: {
        [MODULES.COMMUNICATION]: [ACTIONS.READ],
        // ... other modules
    },
    [ROLES.PARENT]: {
        [MODULES.COMMUNICATION]: [ACTIONS.READ],
        // ... other modules
    },
    [ROLES.ACCOUNTANT]: {
        // No communication access in current config
        // ... other modules
    },
    [ROLES.LIBRARIAN]: {
        // No communication access in current config
        // ... other modules
    },
    [ROLES.RECEPTIONIST]: {
        [MODULES.COMMUNICATION]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE],
        // ... other modules
    },
};

/**
 * Check if a user role has permission for a specific module and action
 * @param {string} role - User role
 * @param {string} module - System module
 * @param {string} action - Action to perform
 * @returns {boolean} - Whether user has permission
 */
export const hasPermission = (role, module, action) => {
    // Super admin always has access
    if (role === ROLES.SUPER_ADMIN) return true;

    const rolePerms = ROLE_PERMISSIONS[role];
    if (!rolePerms) return false;

    const modulePerms = rolePerms[module];
    if (!modulePerms) return false;

    return modulePerms.includes(action);
};

/**
 * Get all modules a role has access to
 * @param {string} role - User role
 * @returns {string[]} - Array of accessible modules
 */
export const getModulesForRole = (role) => {
    if (role === ROLES.SUPER_ADMIN) return Object.values(MODULES);

    const rolePerms = ROLE_PERMISSIONS[role];
    if (!rolePerms) return [];

    return Object.keys(rolePerms);
};

/**
 * Get human-readable role label
 * @param {string} role - User role
 * @returns {string} - Formatted role name
 */
export const getRoleLabel = (role) => {
    const labels = {
        [ROLES.SUPER_ADMIN]: 'Super Admin',
        [ROLES.ADMIN]: 'Admin',
        [ROLES.TEACHER]: 'Teacher',
        [ROLES.STUDENT]: 'Student',
        [ROLES.PARENT]: 'Parent',
        [ROLES.ACCOUNTANT]: 'Accountant',
        [ROLES.LIBRARIAN]: 'Librarian',
        [ROLES.RECEPTIONIST]: 'Receptionist',
    };
    return labels[role] || role;
};

/**
 * Check if user can create notices
 * @param {string} role - User role
 * @returns {boolean} - Whether user can create notices
 */
export const canCreateNotice = (role) => {
    return hasPermission(role, MODULES.COMMUNICATION, ACTIONS.CREATE);
};

/**
 * Check if user can manage notices (admin functions)
 * @param {string} role - User role
 * @returns {boolean} - Whether user can manage notices
 */
export const canManageNotices = (role) => {
    return hasPermission(role, MODULES.COMMUNICATION, ACTIONS.UPDATE) &&
           hasPermission(role, MODULES.COMMUNICATION, ACTIONS.DELETE);
};

/**
 * Check if user can view notice analytics
 * @param {string} role - User role
 * @returns {boolean} - Whether user can view analytics
 */
export const canViewAnalytics = (role) => {
    return hasPermission(role, MODULES.COMMUNICATION, ACTIONS.READ) &&
           (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || role === ROLES.RECEPTIONIST);
};

export { ROLES, MODULES, ACTIONS };