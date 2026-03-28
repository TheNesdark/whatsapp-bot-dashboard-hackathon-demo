import { Request, Response } from 'express';
import { DEFAULT_ATTENDED_BY, MAX_ATTENDED_BY_LENGTH, REGISTRATION_CONTROLLER_ERRORS } from '@server/constants/registrations';
import { stmts } from '@server/db/db';
import {
  claimRegistrationSchema,
  registrationDecisionSchema,
  registrationOperatorDecisionSchema,
  rejectRegistrationSchema,
} from '@server/schemas/registrations';
import { flowEngine } from '@server/services/whatsapp/handler';
import { REJECTION_MESSAGES } from '@server/services/whatsapp/messages';
import { resolveInstanceId } from '@server/services/whatsapp/instanceResolver';
import { sendWhatsAppMessage } from '@server/services/whatsapp/index';
import { broadcast } from '@server/services/wsServer';
import {
  applyAttendedBy,
  findRegistrationById,
  validatePhoneAndId,
} from '@server/utils/registrationHelpers';
import { getValidatedUploadedImage } from '@server/utils/requestFiles';
import { REGISTRATION_ACCEPTABLE_STATUSES, REGISTRATION_REJECTABLE_STATUSES, includesStatus } from '@shared/registration';
import { requireConnected } from './whatsapp.controller';

async function resolveConnectedRegistrationInstance(
  res: Response,
  registrationInstanceId: number | null,
  missingInstanceError: string,
): Promise<number | null> {
  const instanceId = resolveInstanceId(registrationInstanceId);
  if (!instanceId) {
    res.status(409).json({ error: missingInstanceError });
    return null;
  }

  if (!(await requireConnected(res, instanceId))) {
    return null;
  }

  return instanceId;
}

function hasUploadedFile(req: Request): boolean {
  return Boolean((req as Request & { file?: unknown }).file);
}

export function getRegistrationsController(req: Request, res: Response): void {
  const instanceId = req.query.instanceId ? Number(req.query.instanceId) : undefined;
  const registrations = instanceId
    ? (stmts.selectRegistrationsByInstance.all(instanceId) as any[])
    : (stmts.selectAllRegistrations.all() as any[]);

  if (registrations.length === 0) {
    res.json([]);
    return;
  }

  // Enriquecer cada registro con sus datos dinámicos y acciones de aprobación
  const enriched = registrations.map((reg) => {
    const dataRows = stmts.selectRegistrationData.all(reg.id) as Array<{
      variable_key: string;
      value: string;
    }>;
    const dataObj = Object.fromEntries(dataRows.map((row) => [row.variable_key, row.value]));
    
    // Obtener ramas de aprobación del flujo si aplica
    const approvalBranches = flowEngine.getApprovalBranchesForRegistration(reg.whatsapp_number, reg.instance_id);

    return { ...reg, data: dataObj, approvalBranches };
  });

  res.json(enriched);
}

export function claimRegistrationController(req: Request, res: Response): void {
  const parsed = claimRegistrationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos' });
    return;
  }

  const { id } = parsed.data;
  const attendedBy = parsed.data.attended_by?.trim().slice(0, MAX_ATTENDED_BY_LENGTH) || DEFAULT_ATTENDED_BY;

  const reg = findRegistrationById(id, res);
  if (!reg) return;
  if (reg.status !== 'pending') {
    res.status(409).json({ error: REGISTRATION_CONTROLLER_ERRORS.CLAIM_INVALID_STATUS });
    return;
  }

  const info = stmts.claimRegistration.run(attendedBy, id) as { changes: number };
  if (info.changes === 0) {
    res.status(409).json({ error: REGISTRATION_CONTROLLER_ERRORS.ALREADY_CLAIMED });
    return;
  }

  broadcast('registrations:changed', { id, status: 'attending' });
  res.json({ success: true });
}

export function releaseRegistrationController(req: Request, res: Response): void {
  const parsed = registrationDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'ID invalido' });
    return;
  }

  const { id } = parsed.data;
  const reg = findRegistrationById(id, res);
  if (!reg) return;
  if (reg.status !== 'attending') {
    res.status(409).json({ error: REGISTRATION_CONTROLLER_ERRORS.RELEASE_INVALID_STATUS });
    return;
  }

  stmts.releaseRegistration.run(id);
  broadcast('registrations:changed', { id, status: 'pending' });
  res.json({ success: true });
}

export async function approveRegistrationController(req: Request, res: Response): Promise<void> {
  const parsed = registrationOperatorDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'ID invalido' });
    return;
  }

  const { id, event = 'approved', reason } = parsed.data;
  const reg = findRegistrationById(id, res);
  if (!reg) return;

  const instanceId = await resolveConnectedRegistrationInstance(
    res,
    reg.instance_id,
    REGISTRATION_CONTROLLER_ERRORS.APPROVAL_INSTANCE_REQUIRED,
  );
  if (!instanceId) return;

  const file = getValidatedUploadedImage(req, res, REGISTRATION_CONTROLLER_ERRORS.INVALID_IMAGE);
  if (hasUploadedFile(req) && !file) return;

  try {
    await flowEngine.resumeFromExternalEvent(
      reg.whatsapp_number,
      reg.instance_id ?? instanceId,
      id,
      event,
      {
        approvalImage: file
          ? {
              buffer: file.buffer,
              mimeType: file.mimetype ?? 'image/jpeg',
              filename: file.originalname ?? 'image.jpg',
            }
          : undefined,
        rejectionReason: reason || undefined,
      },
    );
    applyAttendedBy(req, id);
    res.json({ success: true, message: `Operacion ${event} completada` });
  } catch (err) {
    console.error(`[registrations] Error al procesar evento ${event}:`, err);
    res.status(500).json({ error: REGISTRATION_CONTROLLER_ERRORS.APPROVE_ERROR });
  }
}

export async function rejectRegistrationController(req: Request, res: Response): Promise<void> {
  // Redirigimos a approveRegistrationController con evento 'rejected' para unificar lógica
  req.body.event = 'rejected';
  return approveRegistrationController(req, res);
}

export async function denyRegistrationController(req: Request, res: Response): Promise<void> {
  // Redirigimos a approveRegistrationController con evento 'rejected' para unificar lógica
  req.body.event = 'rejected';
  return approveRegistrationController(req, res);
}
