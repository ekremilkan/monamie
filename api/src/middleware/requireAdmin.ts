import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

/**
 * Ensures the current user is an admin. Accepts either explicit role=admin
 * or matching ADMIN_EMAIL fallback defined in environment variables.
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Nicht authentifiziert" });
    return;
  }

  const role = (user as { role?: string } | undefined)?.role;
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const isAdmin =
    role === "admin" || (adminEmail ? user.email === adminEmail : false);

  if (!isAdmin) {
    res
      .status(403)
      .json({ error: "Nur Admins dürfen diesen Vorgang durchführen" });
    return;
  }

  next();
};
