const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  login,
  refreshToken,
  createUser,
  updateUser,
  deleteUser,
  getUsers,
  getUser,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/userController');
const { userCheckToken, verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  updateUserSchema,
  checkTokenSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validations/userValidation');
const { authRateLimitMax, rateLimitWindowMs } = require('../config');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'ERROR', data: 'Too many authentication attempts, please try again later' },
});

// Open routes (no token required)
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.post('/token', validate(checkTokenSchema), userCheckToken);
router.post('/register', authLimiter, validate(registerSchema), createUser);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// All routes below require authentication
router.use(verifyToken);

router.route('/').get(checkPermission('users:read'), getUsers);

// Profile routes (current user from JWT)
router.route('/me').get(getMe).put(validate(updateUserSchema), updateMe);

router
  .route('/:id')
  .get(checkPermission('users:read'), getUser)
  .put(checkPermission('users:write'), validate(updateUserSchema), updateUser)
  .delete(checkPermission('users:delete'), deleteUser);

module.exports = router;
