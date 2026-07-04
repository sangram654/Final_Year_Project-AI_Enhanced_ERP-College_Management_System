// Role-Permission Configuration for RBAC
// Defines which modules and actions each role has access to

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

const ALL_ACTIONS = [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE];
const READ_ONLY = [ACTIONS.READ];

// Role-Module-Action permission mapping
const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: {
        // Full access to everything
        [MODULES.FRONT_OFFICE]: ALL_ACTIONS,
        [MODULES.STUDENT_INFO]: ALL_ACTIONS,
        [MODULES.FEES]: ALL_ACTIONS,
        [MODULES.INCOME]: ALL_ACTIONS,
        [MODULES.EXPENSE]: ALL_ACTIONS,
        [MODULES.ATTENDANCE]: ALL_ACTIONS,
        [MODULES.ACADEMIC]: ALL_ACTIONS,
        [MODULES.HUMAN_RESOURCES]: ALL_ACTIONS,
        [MODULES.COMMUNICATION]: ALL_ACTIONS,
        [MODULES.DOWNLOAD_CENTER]: ALL_ACTIONS,
        [MODULES.LIBRARY]: ALL_ACTIONS,
        [MODULES.INVENTORY]: ALL_ACTIONS,
        [MODULES.CERTIFICATE]: ALL_ACTIONS,
        [MODULES.FRONT_CMS]: ALL_ACTIONS,
        [MODULES.ONLINE_NOTES]: ALL_ACTIONS,
        [MODULES.MARKS]: ALL_ACTIONS,
        [MODULES.LEAVE]: ALL_ACTIONS,
        [MODULES.SCHOLARSHIP]: ALL_ACTIONS,
        [MODULES.GALLERY]: ALL_ACTIONS,
        [MODULES.REPORTS]: ALL_ACTIONS,
        [MODULES.USER_MANAGEMENT]: ALL_ACTIONS,
        [MODULES.SYSTEM_SETTINGS]: ALL_ACTIONS,
    },
    [ROLES.ADMIN]: {
        // All access similar to super admin but no system settings
        [MODULES.FRONT_OFFICE]: ALL_ACTIONS,
        [MODULES.STUDENT_INFO]: ALL_ACTIONS,
        [MODULES.FEES]: ALL_ACTIONS,
        [MODULES.INCOME]: ALL_ACTIONS,
        [MODULES.EXPENSE]: ALL_ACTIONS,
        [MODULES.ATTENDANCE]: ALL_ACTIONS,
        [MODULES.ACADEMIC]: ALL_ACTIONS,
        [MODULES.HUMAN_RESOURCES]: ALL_ACTIONS,
        [MODULES.COMMUNICATION]: ALL_ACTIONS,
        [MODULES.DOWNLOAD_CENTER]: ALL_ACTIONS,
        [MODULES.LIBRARY]: ALL_ACTIONS,
        [MODULES.INVENTORY]: ALL_ACTIONS,
        [MODULES.CERTIFICATE]: ALL_ACTIONS,
        [MODULES.FRONT_CMS]: ALL_ACTIONS,
        [MODULES.ONLINE_NOTES]: ALL_ACTIONS,
        [MODULES.MARKS]: ALL_ACTIONS,
        [MODULES.LEAVE]: ALL_ACTIONS,
        [MODULES.SCHOLARSHIP]: ALL_ACTIONS,
        [MODULES.GALLERY]: ALL_ACTIONS,
        [MODULES.REPORTS]: ALL_ACTIONS,
        [MODULES.USER_MANAGEMENT]: ALL_ACTIONS,
    },
    [ROLES.TEACHER]: {
        [MODULES.ATTENDANCE]: ALL_ACTIONS,
        [MODULES.ACADEMIC]: [ACTIONS.READ, ACTIONS.UPDATE],
        [MODULES.COMMUNICATION]: [ACTIONS.READ, ACTIONS.CREATE],
        [MODULES.DOWNLOAD_CENTER]: ALL_ACTIONS,
        [MODULES.LIBRARY]: READ_ONLY,
        [MODULES.CERTIFICATE]: READ_ONLY,
        [MODULES.ONLINE_NOTES]: ALL_ACTIONS,
        [MODULES.MARKS]: ALL_ACTIONS,
        [MODULES.LEAVE]: [ACTIONS.READ, ACTIONS.UPDATE],
        [MODULES.STUDENT_INFO]: READ_ONLY,
        [MODULES.FEES]: [ACTIONS.READ],
    },
    [ROLES.STUDENT]: {
        [MODULES.ATTENDANCE]: READ_ONLY,
        [MODULES.FEES]: READ_ONLY,
        [MODULES.ACADEMIC]: READ_ONLY,
        [MODULES.COMMUNICATION]: READ_ONLY,
        [MODULES.DOWNLOAD_CENTER]: READ_ONLY,
        [MODULES.LIBRARY]: READ_ONLY,
        [MODULES.ONLINE_NOTES]: READ_ONLY,
        [MODULES.MARKS]: READ_ONLY,
        [MODULES.LEAVE]: [ACTIONS.CREATE, ACTIONS.READ],
        [MODULES.SCHOLARSHIP]: [ACTIONS.CREATE, ACTIONS.READ],
    },
    [ROLES.PARENT]: {
        [MODULES.ATTENDANCE]: READ_ONLY,
        [MODULES.FEES]: READ_ONLY,
        [MODULES.MARKS]: READ_ONLY,
        [MODULES.LEAVE]: [ACTIONS.CREATE, ACTIONS.READ],
        [MODULES.COMMUNICATION]: READ_ONLY,
    },
    [ROLES.ACCOUNTANT]: {
        [MODULES.FEES]: ALL_ACTIONS,
        [MODULES.INCOME]: ALL_ACTIONS,
        [MODULES.EXPENSE]: ALL_ACTIONS,
        [MODULES.STUDENT_INFO]: READ_ONLY,
        [MODULES.REPORTS]: [ACTIONS.READ, ACTIONS.CREATE],
    },
    [ROLES.LIBRARIAN]: {
        [MODULES.LIBRARY]: ALL_ACTIONS,
        [MODULES.STUDENT_INFO]: READ_ONLY,
    },
    [ROLES.RECEPTIONIST]: {
        [MODULES.FRONT_OFFICE]: ALL_ACTIONS,
        [MODULES.STUDENT_INFO]: READ_ONLY,
        [MODULES.COMMUNICATION]: ALL_ACTIONS,
        [MODULES.FRONT_CMS]: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE],
    },
};

// Helper functions
const hasPermission = (role, module, action) => {
    if (role === ROLES.SUPER_ADMIN) return true; // Super admin always has access
    const rolePerms = ROLE_PERMISSIONS[role];
    if (!rolePerms) return false;
    const modulePerms = rolePerms[module];
    if (!modulePerms) return false;
    return modulePerms.includes(action);
};

const getModulesForRole = (role) => {
    if (role === ROLES.SUPER_ADMIN) return Object.values(MODULES);
    const rolePerms = ROLE_PERMISSIONS[role];
    if (!rolePerms) return [];
    return Object.keys(rolePerms);
};

const getRoleLabel = (role) => {
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

module.exports = {
    ROLES,
    MODULES,
    ACTIONS,
    ROLE_PERMISSIONS,
    hasPermission,
    getModulesForRole,
    getRoleLabel,
};
