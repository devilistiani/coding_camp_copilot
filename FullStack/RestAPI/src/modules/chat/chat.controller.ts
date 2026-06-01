import { Request, Response, NextFunction } from 'express';
import * as chatService from './chat.service.js';
import { ApiError } from '../../lib/ApiError.js';
import {
  ChatRequestInput,
  ConversationIdParam,
  ListConversationsQuery,
  UpdateConversationInput,
} from './chat.schema.js';

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function chat(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const result = await chatService.chat(user.sub, user.role, req.body as ChatRequestInput);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function predict(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const body = req.body as { question?: string };
    if (!body.question || typeof body.question !== 'string' || body.question.trim().length < 2) {
      throw ApiError.badRequest('Input tidak valid atau kosong.');
    }
    const result = await chatService.predict(user.role, body.question.trim());
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const result = await chatService.listConversations(
      user.sub,
      user.role,
      req.query as unknown as ListConversationsQuery,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const { id } = req.params as unknown as ConversationIdParam;
    const result = await chatService.getConversationDetail(id, user.sub, user.role);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const { id } = req.params as unknown as ConversationIdParam;
    const result = await chatService.updateConversation(
      id,
      user.sub,
      user.role,
      req.body as UpdateConversationInput,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function deleteConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const user = requireUser(req);
    const { id } = req.params as unknown as ConversationIdParam;
    await chatService.deleteConversation(id, user.sub, user.role);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
