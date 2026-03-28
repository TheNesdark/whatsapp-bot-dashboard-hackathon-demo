export interface HelpRequest {
  id: number;
  phone_number: string;
  full_name: string | null;
  cedula: string | null;
  instance_id: number;
  status: string;
  created_at: string;
}
