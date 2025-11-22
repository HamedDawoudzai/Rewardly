/**
 * Bootstrap script to initialize required database data
 * This runs automatically on server startup to ensure roles, permissions,
 * and role hierarchy are properly configured.
 * 
 * This is idempotent and safe to run multiple times.
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Permission catalog based on requirements
const PERMISSIONS = [
  // User Account & Auth
  { name: 'USER_REGISTER_SELF', description: 'User signs up' },
  { name: 'CASHIER_CREATE_USER', description: 'Cashier creates user accounts' },
  { name: 'USER_ACTIVATE_ACCOUNT', description: 'Complete activation flow' },
  { name: 'USER_LOGIN', description: 'Obtain access token' },
  { name: 'USER_LOGOUT', description: 'Invalidate/rotate refresh token' },
  { name: 'USER_UPDATE_PROFILE', description: 'Update profile fields' },
  { name: 'USER_CHANGE_PASSWORD', description: 'Change password with old password' },
  { name: 'USER_REQUEST_PASSWORD_RESET', description: 'Request reset link' },
  { name: 'USER_RESET_PASSWORD', description: 'Set new password via token' },
  { name: 'USER_VIEW_SELF', description: 'Read own account' },
  { name: 'USER_VIEW_SELF_TRANSACTIONS', description: 'Read own transactions' },
  
  // User Management & Viewing
  { name: 'CASHIER_VIEW_USER', description: 'View user details (limited)' },
  { name: 'MANAGER_VIEW_USERS', description: 'List and view all users' },
  { name: 'MANAGER_UPDATE_USER', description: 'Update user details and status' },
  
  // Verification & Role Management
  { name: 'MANAGER_VERIFY_STUDENT', description: 'Verify student info (unlock redemption)' },
  { name: 'MANAGER_PROMOTE_TO_CASHIER', description: 'Assign cashier role to a user' },
  { name: 'MANAGER_REVOKE_CASHIER', description: 'Remove cashier role' },
  { name: 'MANAGER_CLEAR_SUSPICIOUS_CASHIER', description: 'Clear isSuspicious flag' },
  { name: 'SUPERUSER_PROMOTE_TO_MANAGER', description: 'Assign manager role' },
  { name: 'SUPERUSER_DEMOTE_MANAGER', description: 'Demote manager to regular' },
  
  // Transactions
  { name: 'CASHIER_CREATE_PURCHASE', description: 'Record purchase for user' },
  { name: 'CASHIER_PROCESS_REDEMPTION', description: 'Process user-initiated redemption' },
  { name: 'MANAGER_CREATE_ADJUSTMENT', description: 'Correction against prior transaction' },
  { name: 'MANAGER_UPDATE_TRANSACTION', description: 'Update transaction status (e.g. suspicious flag)' },
  { name: 'USER_CREATE_REDEMPTION', description: 'Create redemption request' },
  { name: 'USER_CREATE_TRANSFER', description: 'Transfer points to another user' },
  { name: 'USER_VIEW_POINT_BALANCE', description: 'Get current points balance' },
  { name: 'MANAGER_VIEW_ALL_TRANSACTIONS', description: 'Audit scope (read-only)' },
  { name: 'USER_VIEW_PROMOTIONS', description: 'See eligible promos' },
  { name: 'CASHIER_APPLY_PROMO', description: 'Apply single-use promo at checkout' },
  
  // Events
  { name: 'MANAGER_CREATE_EVENT', description: 'Create new event' },
  { name: 'MANAGER_ASSIGN_EVENT_ORGANIZER', description: 'Assign organizers to event' },
  { name: 'ORGANIZER_UPDATE_EVENT', description: 'All fields except org list & deletion' },
  { name: 'MANAGER_ALLOCATE_EVENT_POINTS', description: 'Set event point pool' },
  { name: 'ORGANIZER_AWARD_EVENT_POINTS', description: 'Award points to attendees' },
  { name: 'USER_RSVP_EVENT', description: 'RSVP to an event' },
  { name: 'ORGANIZER_CONFIRM_ATTENDANCE', description: 'Confirm user attendance' },
  
  // Promotions
  { name: 'MANAGER_CREATE_PROMO_PERIOD', description: 'Create period promotion' },
  { name: 'MANAGER_CREATE_PROMO_OFFER', description: 'Create single-use promotion' },
  { name: 'MANAGER_ADJUST_PROMOTION', description: 'Modify existing promotion' },
  { name: 'MANAGER_MONITOR_PROMOTIONS', description: 'View promotion usage/stats' }
];

// Role hierarchy: ancestor → descendant
const ROLE_HIERARCHY = [
  // Superuser inherits from all
  { ancestor: 'superuser', descendant: 'manager' },
  { ancestor: 'superuser', descendant: 'cashier' },
  { ancestor: 'superuser', descendant: 'regular' },
  // Manager inherits from cashier and regular
  { ancestor: 'manager', descendant: 'cashier' },
  { ancestor: 'manager', descendant: 'regular' },
  // Cashier inherits from regular
  { ancestor: 'cashier', descendant: 'regular' }
];

// Role → Permission assignments
const ROLE_PERMISSIONS = {
  regular: [
    'USER_LOGIN',
    'USER_LOGOUT',
    'USER_ACTIVATE_ACCOUNT',
    'USER_UPDATE_PROFILE',
    'USER_CHANGE_PASSWORD',
    'USER_REQUEST_PASSWORD_RESET',
    'USER_RESET_PASSWORD',
    'USER_VIEW_SELF',
    'USER_VIEW_SELF_TRANSACTIONS',
    'USER_VIEW_POINT_BALANCE',
    'USER_CREATE_REDEMPTION',
    'USER_CREATE_TRANSFER',
    'USER_RSVP_EVENT',
    'USER_VIEW_PROMOTIONS'
  ],
  cashier: [
    'CASHIER_CREATE_USER',
    'CASHIER_VIEW_USER',
    'CASHIER_CREATE_PURCHASE',
    'CASHIER_PROCESS_REDEMPTION',
    'CASHIER_APPLY_PROMO'
  ],
  manager: [
    'MANAGER_VIEW_USERS',
    'MANAGER_UPDATE_USER',
    'MANAGER_VERIFY_STUDENT',
    'MANAGER_PROMOTE_TO_CASHIER',
    'MANAGER_REVOKE_CASHIER',
    'MANAGER_CLEAR_SUSPICIOUS_CASHIER',
    'MANAGER_VIEW_ALL_TRANSACTIONS',
    'MANAGER_UPDATE_TRANSACTION',
    'MANAGER_CREATE_ADJUSTMENT',
    'MANAGER_CREATE_EVENT',
    'MANAGER_ASSIGN_EVENT_ORGANIZER',
    'ORGANIZER_UPDATE_EVENT',
    'MANAGER_ALLOCATE_EVENT_POINTS',
    'ORGANIZER_AWARD_EVENT_POINTS',
    'ORGANIZER_CONFIRM_ATTENDANCE',
    'MANAGER_CREATE_PROMO_PERIOD',
    'MANAGER_CREATE_PROMO_OFFER',
    'MANAGER_ADJUST_PROMOTION',
    'MANAGER_MONITOR_PROMOTIONS'
  ],
  superuser: [
    'SUPERUSER_PROMOTE_TO_MANAGER',
    'SUPERUSER_DEMOTE_MANAGER'
  ]
};

/**
 * Bootstrap the database with essential data
 * This function is idempotent and safe to call on every startup
 */
async function bootstrap() {
  try {
    console.log('[Bootstrap] Initializing database...');

    // 1. Create Roles
    const roles = {};
    for (const roleName of ['regular', 'cashier', 'manager', 'superuser']) {
      roles[roleName] = await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: {
          name: roleName,
          description: `${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`
        }
      });
    }

    // 2. Create Permissions
    const permissions = {};
    for (const perm of PERMISSIONS) {
      permissions[perm.name] = await prisma.permission.upsert({
        where: { name: perm.name },
        update: { description: perm.description },
        create: {
          name: perm.name,
          description: perm.description
        }
      });
    }

    // 3. Create Role Hierarchy (closure table)
    for (const hierarchy of ROLE_HIERARCHY) {
      await prisma.roleHierarchy.upsert({
        where: {
          ancestorId_descendantId: {
            ancestorId: roles[hierarchy.ancestor].id,
            descendantId: roles[hierarchy.descendant].id
          }
        },
        update: {},
        create: {
          ancestorId: roles[hierarchy.ancestor].id,
          descendantId: roles[hierarchy.descendant].id
        }
      });
    }

    // 4. Assign Permissions to Roles
    for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
      for (const permName of permNames) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roles[roleName].id,
              permissionId: permissions[permName].id
            }
          },
          update: {},
          create: {
            roleId: roles[roleName].id,
            permissionId: permissions[permName].id
          }
        });
      }
    }

    console.log('[Bootstrap] Database initialized successfully');
    console.log(`[Bootstrap] - ${Object.keys(roles).length} roles`);
    console.log(`[Bootstrap] - ${PERMISSIONS.length} permissions`);
    console.log(`[Bootstrap] - ${ROLE_HIERARCHY.length} role hierarchies`);

  } catch (error) {
    console.error('[Bootstrap] Failed to initialize database:', error);
    throw error;
  }
}

module.exports = { bootstrap };

