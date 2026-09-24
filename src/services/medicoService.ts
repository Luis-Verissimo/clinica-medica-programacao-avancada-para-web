import * as repository from "../repositories/medicoRepository.js";
import type { MedicoDTO } from "../types/medico.js";

export async function listarMedicos() {
  return repository.findAll();
}
export async function encontrarUmMedico(id: number) {
  return repository.findById(id);
}
export async function criarMedico(dados: MedicoDTO) {
  return repository.create(dados);
}
export async function atualizarMedico(id: number, dados: MedicoDTO) {
  return repository.update(id, dados);
}
export async function deletarMedico(id: number) {
  return repository.remove(id);
}
