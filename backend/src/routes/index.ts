import { Router } from 'express';
import type { AuthConfig } from '../config/env.js';
import type { Database } from '../config/database.js';
import { createAuthController } from '../controllers/auth.controller.js';
import { createUserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { verifyTokenOnly } from '../middleware/verify-token.js';
import { createAuthenticationModels } from '../models/index.js';
import { AuthService } from '../services/auth.service.js';
import { SessionService } from '../services/session.service.js';
import { UserService } from '../services/user.service.js';
import { createAuthRouter } from './auth.routes.js';
import { createSystemRouter } from './system.routes.js';
import type { SystemRouteDependencies } from './system.routes.js';
import { createUserRouter } from './user.routes.js';

export interface ApiRouteDependencies extends SystemRouteDependencies {
  database: Database;
  auth: AuthConfig;
}

export function createApiRouter(dependencies: ApiRouteDependencies) {
  const router = Router();
  const models = createAuthenticationModels(dependencies.database.sequelize);
  const sessions = new SessionService(models, dependencies.auth);
  const authService = new AuthService(
    models,
    dependencies.database.sequelize,
    sessions,
    dependencies.auth,
  );
  const userService = new UserService(
    models,
    dependencies.database.sequelize,
    dependencies.auth.bcryptCost,
  );

  router.use(createSystemRouter(dependencies));
  router.use(
    createAuthRouter({
      controller: createAuthController(authService, sessions),
      verifyTokenOnly: verifyTokenOnly(sessions),
    }),
  );
  router.use(
    createUserRouter({
      controller: createUserController(userService, authService),
      authenticate: authenticate(sessions),
      requireAdmin: requireRole('admin', 'super_admin'),
      requireSuperAdmin: requireRole('super_admin'),
    }),
  );
  return router;
}
