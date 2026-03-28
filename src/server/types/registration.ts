/** Fila mínima de registrations usada en controladores (selectRegistrationById) */
export interface RegistrationRow {
  id: number;
  status: string;
  instance_id: number | null;
  attended_by?: string | null;
  whatsapp_number: string;
}
