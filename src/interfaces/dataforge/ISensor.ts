export interface ISensor {
  id: number;
  name: string;
  model?: string | null;
  serial_no?: string | null;
  date_installed?: string | null; 
  date_removed?: string | null; 
  notes?: string | null;
}
