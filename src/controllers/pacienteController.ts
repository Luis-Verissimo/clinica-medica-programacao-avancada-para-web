import type { Request, Response } from "express";
import * as service from "../services/pacienteService.js";

export async function listar(req: Request, res: Response) {
  const pacientes: Paciente[] = service.listarPacientes();
  return res.json(pacientes);
}

export async function buscarPorId(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  const paciente: Paciente = service.encontrarUmPaciente(id);
  res.json(paciente);
}

export async function cadastrar(req: Request, res: Response) {
  const dados: PacienteDTO = req.body;
  const paciente: Paciente = service.criarPaciente(dados);
  res.status(201).json(paciente);
}

export async function atualizar(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  const dados: PacienteDTO = req.body;
  const paciente: Paciente = service.atualizarPaciente(id, dados);
  res.json(paciente);
}

export async function deletar(req: Request, res: Response) {
  const id: number = Number(req.params.id);
  service.deletarPaciente(id);
  res.status(204).send();
}
