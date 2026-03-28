export interface HelpRequestRow {
  id: number;
  phone_number: string;
  full_name: string | null;
  cedula: string | null;
  instance_id: number;
  status: string;
  previous_step: string | null;
  previous_data: string | null;
  created_at: string;
}
