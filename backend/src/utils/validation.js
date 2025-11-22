'use strict';

const { z } = require('zod');

/**
 * Validation schemas using Zod
 */

// Utorid: Alphanumeric, 7-8 characters
const utoridSchema = z.string()
  .min(7, 'Utorid must be at least 7 characters')
  .max(8, 'Utorid must be at most 8 characters')
  .regex(/^[a-zA-Z0-9]+$/, 'Utorid must be alphanumeric');

// Name: 1-50 characters
const nameSchema = z.string()
  .min(1, 'Name must be at least 1 character')
  .max(50, 'Name must be at most 50 characters')
  .trim();

// Email: Valid University of Toronto email
const utEmailSchema = z.string()
  .email('Invalid email format')
  .refine(
    (email) => email.endsWith('@mail.utoronto.ca') || 
               email.endsWith('@utoronto.ca'),
    'Email must be a valid University of Toronto email'
  );

// Password: 8-20 characters with upper/lower/number/special
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(20, 'Password must be at most 20 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Birthday: YYYY-MM-DD format
const birthdaySchema = z.string().date('Birthday must be in YYYY-MM-DD format');

// Role enum
const roleSchema = z.enum(['regular', 'cashier', 'manager', 'superuser']);

// User registration schema
const createUserSchema = z.object({
  utorid: utoridSchema,
  name: nameSchema,
  email: utEmailSchema
});

// User update schema
const updateUserSchema = z.object({
  email: utEmailSchema.nullish(),
  verified: z.boolean().nullish().refine(
    (val) => val == null || val === true,
    { message: 'Verified can only be set to true, cannot unverify a user' }
  ),
  suspicious: z.boolean().nullish(),
  role: roleSchema.nullish()
});

// Profile update schema
const updateProfileSchema = z.object({
  name: nameSchema.nullish(),
  email: utEmailSchema.nullish(),
  birthday: birthdaySchema.nullish(),
  avatarUrl: z.string().nullish()
});

// Password change schema
const changePasswordSchema = z.object({
  old: z.string().min(1, 'Old password is required'),
  new: passwordSchema
});

// Login schema
const loginSchema = z.object({
  utorid: z.string().min(1, 'Utorid is required'),
  password: z.string().min(1, 'Password is required')
});

// Reset request schema
const resetRequestSchema = z.object({
  utorid: z.string().min(1, 'Utorid is required')
});

// Reset password schema
const resetPasswordSchema = z.object({
  utorid: z.string().min(1, 'Utorid is required'),
  password: passwordSchema
});

// Promotion creation schema
const createPromotionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['automatic', 'one-time'], { 
    errorMap: () => ({ message: 'Type must be either "automatic" or "one-time"' })
  }),
  startTime: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: 'Start time must be a valid ISO 8601 datetime' }),
  endTime: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: 'End time must be a valid ISO 8601 datetime' }),
  minSpending: z.number().nonnegative('Minimum spending must be non-negative').nullable().optional(),
  rate: z.number().nonnegative('Rate must be non-negative').nullable().optional(),
  points: z.number().int('Points must be an integer').nonnegative('Points must be non-negative').nullable().optional()
}).refine((data) => {
  const start = new Date(data.startTime);
  const now = new Date();
  // Allow 5 second tolerance for test timing issues
  const fiveSecondsAgo = new Date(now.getTime() - 5000);
  return start >= fiveSecondsAgo;
}, {
  message: 'Start time must not be in the past',
  path: ['startTime']
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime']
});

// Promotion update schema
const updatePromotionSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').max(100, 'Name must be at most 100 characters').nullable().optional(),
  description: z.string().min(1, 'Description must not be empty').nullable().optional(),
  type: z.enum(['automatic', 'one-time'], { 
    errorMap: () => ({ message: 'Type must be either "automatic" or "one-time"' })
  }).nullable().optional(),
  startTime: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: 'Start time must be a valid ISO 8601 datetime' }).nullable().optional(),
  endTime: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: 'End time must be a valid ISO 8601 datetime' }).nullable().optional(),
  minSpending: z.number().nonnegative('Minimum spending must be non-negative').nullable().optional(),
  rate: z.number().nonnegative('Rate must be non-negative').nullable().optional(),
  points: z.number().int('Points must be an integer').nonnegative('Points must be non-negative').nullable().optional()
});

/**
 * Validate user creation payload
 * @param {Object} data - Request body
 * @returns {Object} Validated data
 * @throws {z.ZodError} If validation fails
 */
function validateCreateUser(data) {
  return createUserSchema.parse(data);
}

function validateUpdateUser(data) {
  return updateUserSchema.parse(data);
}

function validateUpdateProfile(data) {
  return updateProfileSchema.parse(data);
}

function validateChangePassword(data) {
  return changePasswordSchema.parse(data);
}

function validateLogin(data) {
  return loginSchema.parse(data);
}

function validateResetRequest(data) {
  return resetRequestSchema.parse(data);
}

function validateResetPassword(data) {
  return resetPasswordSchema.parse(data);
}

function validateCreatePromotion(data) {
  return createPromotionSchema.parse(data);
}

function validateUpdatePromotion(data) {
  return updatePromotionSchema.parse(data);
}

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateProfile,
  validateChangePassword,
  validateLogin,
  validateResetRequest,
  validateResetPassword,
  validateCreatePromotion,
  validateUpdatePromotion,
  utoridSchema,
  nameSchema,
  utEmailSchema,
  passwordSchema,
  birthdaySchema,
  roleSchema,
  createPromotionSchema,
  updatePromotionSchema
};

