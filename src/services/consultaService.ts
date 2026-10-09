import * as repository from "../repositories/consultaRepository.js";
import type { ConsultaDTO } from "../types/consulta.js";

export async function listarConsultas() {
  return repository.findAll();
}
export async function encontrarUmaConsulta(id: number) {
  return repository.findById(id);
}
export async function criarConsulta(dados: ConsultaDTO) {
  return repository.create(dados);
}
export async function atualizarConsulta(id: number, dados: ConsultaDTO) {
  return repository.update(id, dados);
}
export async function deletarConsulta(id: number) {
  return repository.remove(id);
}
