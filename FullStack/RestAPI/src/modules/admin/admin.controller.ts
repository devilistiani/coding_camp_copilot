import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service.js';
import { ApiError } from '../../lib/ApiError.js';
import { ListUsersQuery, UpdateUserInput, UserIdParam } from './admin.schema.js';

function requireAdmin(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const result = await adminService.listUsers(req.query as unknown as ListUsersQuery);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = requireAdmin(req);
    const { id } = req.params as unknown as UserIdParam;
    const user = await adminService.updateUser(admin.sub, id, req.body as UpdateUserInput);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = requireAdmin(req);
    const { id } = req.params as unknown as UserIdParam;
    await adminService.deleteUser(admin.sub, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function analyticsSummary(req: Request, res: Response, next: NextFunction) {
  try {
    requireAdmin(req);
    const data = await adminService.getAnalyticsSummary();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
