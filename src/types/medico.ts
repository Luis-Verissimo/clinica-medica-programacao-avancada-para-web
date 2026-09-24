export interface MedicoDTO {
  nome: string;
  email: string;
  telefone: string;
  crm: string;
  especialidade: string;
}
export interface Medico extends MedicoDTO {
  id: number;
}
