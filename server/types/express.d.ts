import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    isAuthenticated?: () => boolean;
    user?: Express.User;
  }
}

declare global {
  namespace Express {
    interface User {
      id?: string;
      claims?: {
        sub?: string;
      };
    }
  }
}