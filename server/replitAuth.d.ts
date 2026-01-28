declare module "./replitAuth" {
  import type { Express, Request, Response, NextFunction } from "express";

  export function setupAuth(app: Express): void;
  export function isAuthenticated(req: Request, res: Response, next: NextFunction): void;
}