import * as repository from "../repositories/pacienteRepository.js";
import type { PacienteDTO } from "../types/paciente.js";

export async function listarPacientes() {
  return repository.findAll();
}
export async function encontrarUmPaciente(id: number) {
  return repository.findById(id);
}
export async function criarPaciente(dados: PacienteDTO) {
  return repository.create(dados);
}
export async function atualizarPaciente(id: number, dados: PacienteDTO) {
  return repository.update(id, dados);
}
export async function deletarPaciente(id: number) {
  return repository.remove(id);
}
