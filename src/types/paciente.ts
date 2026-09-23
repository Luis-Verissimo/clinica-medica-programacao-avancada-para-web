export interface PacienteDTO {
  nome: string;
  email: string;
  telefone: string;
}
export interface Paciente extends PacienteDTO {
  id: number;
}
