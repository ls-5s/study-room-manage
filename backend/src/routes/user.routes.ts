import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { createUserController } from '../controllers/user.controller.js';
import {
  createAdminValidation,
  passwordValidation,
  profileValidation,
  userStatusValidation,
} from '../validators/user.validator.js';

interface UserRouterDependencies {
  controller: ReturnType<typeof createUserController>;
  authenticate: RequestHandler;
  requireAdmin: RequestHandler;
  requireSuperAdmin: RequestHandler;
}

export function createUserRouter(dependencies: UserRouterDependencies) {
  const router = Router();

  router.get('/me', dependencies.authenticate, dependencies.controller.getMe);
  router.patch(
    '/me',
    dependencies.authenticate,
    ...profileValidation,
    dependencies.controller.updateMe,
  );
  router.patch(
    '/me/password',
    dependencies.authenticate,
    ...passwordValidation,
    dependencies.controller.changePassword,
  );

  router.get(
    '/admin/users',
    dependencies.authenticate,
    dependencies.requireAdmin,
    dependencies.controller.listUsers,
  );
  router.post(
    '/admin/users',
    dependencies.authenticate,
    dependencies.requireSuperAdmin,
    ...createAdminValidation,
    dependencies.controller.createAdmin,
  );
  router.get(
    '/admin/users/:userId',
    dependencies.authenticate,
    dependencies.requireAdmin,
    dependencies.controller.getUser,
  );
  router.patch(
    '/admin/users/:userId/status',
    dependencies.authenticate,
    dependencies.requireAdmin,
    ...userStatusValidation,
    dependencies.controller.changeStatus,
  );

  return router;
}
