import { randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient } from '@repo/db';

type AuditDbClient = PrismaClient | Prisma.TransactionClient;

export type AuditLogEvent = {
  actorUserId: string;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: unknown;
};

export async function writeAuditLog(db: AuditDbClient, event: AuditLogEvent): Promise<void> {
  const payloadJson = event.payload === undefined ? null : JSON.stringify(event.payload);

  try {
    await db.$executeRaw`
      INSERT INTO "audit_logs" (
        "id",
        "actorUserId",
        "actorRole",
        "action",
        "entityType",
        "entityId",
        "payload",
        "createdAt"
      )
      VALUES (
        ${randomUUID()},
        ${event.actorUserId},
        ${event.actorRole ?? null},
        ${event.action},
        ${event.entityType},
        ${event.entityId ?? null},
        (${payloadJson})::jsonb,
        NOW()
      )
    `;
  } catch (error) {
    console.error('[audit.log.write_failed]', {
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ?? null,
      actorUserId: event.actorUserId,
      error,
    });
  }
}
