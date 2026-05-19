import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service.js";
import { ApiError } from "../../lib/ApiError.js";
import { LoginInput, RefreshInput, RegisterInput } from "./auth.schema.js";

export async function register(
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { user, tokens } = await authService.login(req.body);
    res.status(200).json({
      success: true,
      data: {
        user,
        token: tokens.token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request<unknown, unknown, RefreshInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { tokens } = await authService.refresh(req.body.refresh_token);
    res.status(200).json({
      success: true,
      data: {
        token: tokens.token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request<unknown, unknown, RefreshInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    await authService.logout(req.body.refresh_token);
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.getMe(req.user.sub);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}
