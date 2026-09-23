import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "../services/pacienteService.js";

const pacienteSchema = z.object({
  nome: z.string().trim().min(1),
  email: z.string().trim().email(),
  telefone: z.string().trim().min(1),
});

function validarId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ erro: "ID inválido." });
    return null;
  }
  return id;
}

export async function listar(req: Request, res: Response) {
  return res.json(await service.listarPacientes());
}
export async function buscarPorId(req: Request, res: Response) {
  const id = validarId(req, res);
  if (id === null) return;
  const paciente = await service.encontrarUmPaciente(id);
  if (!paciente) return res.status(404).json({ erro: "Paciente não encontrado." });
  return res.json(paciente);
}
export async function cadastrar(req: Request, res: Response) {
  const dados = pacienteSchema.safeParse(req.body);
  if (!dados.success) {
    return res.status(400).json({ erro: "Informe nome, e-mail válido e telefone." });
  }
  return res.status(201).json(await service.criarPaciente(dados.data));
}
export async function atualizar(req: Request, res: Response) {
  const id = validarId(req, res);
  if (id === null) return;
  const dados = pacienteSchema.safeParse(req.body);
  if (!dados.success) {
    return res.status(400).json({ erro: "Informe nome, e-mail válido e telefone." });
  }
  return res.json(await service.atualizarPaciente(id, dados.data));
}
export async function deletar(req: Request, res: Response) {
  const id = validarId(req, res);
  if (id === null) return;
  await service.deletarPaciente(id);
  return res.status(204).send();
}
