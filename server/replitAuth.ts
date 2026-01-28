import type { Express, Request, Response, NextFunction } from "express";

export function setupAuth(app: Express) {
  // Stub authentication - can be expanded later
  console.log("Auth setup initialized");
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Skip authentication for now - emergency access
  next();
}
