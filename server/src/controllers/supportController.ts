import { Response } from 'express';
import { db, SupportTicketDoc } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getTickets(req: AuthenticatedRequest, res: Response) {
  try {
    const data = db.getData();
    let tickets: SupportTicketDoc[];

    if (req.user?.role === 'PLATFORM_ADMIN') {
      tickets = data.supportTickets;
    } else {
      const businessId = req.business?.id;
      tickets = data.supportTickets.filter(
        (t) => t.userId === req.user!.id || (businessId && t.businessId === businessId)
      );
    }

    tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sendSuccess(res, tickets);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function createTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { subject, category, priority, description } = req.body;
    if (!subject || !description) {
      return sendError(res, 'Subject and description are required', 400);
    }

    const data = db.getData();
    const now = new Date().toISOString();

    const newTicket: SupportTicketDoc = {
      id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: req.business?.id,
      userId: req.user!.id,
      subject: subject.trim(),
      category: category || 'TECHNICAL',
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      description: description.trim(),
      createdAt: now,
      updatedAt: now,
    };

    data.supportTickets.push(newTicket);
    db.save();

    return sendSuccess(res, newTicket, 'Support ticket submitted. Our team will review it promptly.', 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function replyTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { adminReply, status } = req.body;

    const data = db.getData();
    const ticket = data.supportTickets.find((t) => t.id === id);
    if (!ticket) {
      return sendError(res, 'Ticket not found', 404);
    }

    if (adminReply) ticket.adminReply = adminReply;
    if (status) ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    db.save();
    return sendSuccess(res, ticket, 'Ticket updated');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
