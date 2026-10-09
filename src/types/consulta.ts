import type { Medico } from "./medico.js";
import type { Paciente } from "./paciente.js";

export interface ConsultaDTO {
  data: Date;
  turno: string;
  medicoId: number;
  pacienteId: number;
}

export interface Consulta extends ConsultaDTO {
  id: number;
  medico: Medico;
  paciente: Paciente;
}
