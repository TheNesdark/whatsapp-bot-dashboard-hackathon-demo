import type { RegistrationStatus } from '@shared/registration';
import type { OperatorApprovalBranch } from '@shared/flow';

export interface Registration {
  id: number;
  whatsapp_number: string;
  status: RegistrationStatus;
  attended_by: string | null;
  instance_id: number | null;
  created_at: string;
  data: Record<string, string>;
  approvalBranches?: OperatorApprovalBranch[];
}

export interface Operator {
  id: number;
  name: string;
}

