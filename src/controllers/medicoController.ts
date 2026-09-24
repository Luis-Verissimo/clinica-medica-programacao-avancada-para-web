import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "../services/medicoService.js";

const medicoSchema = z.object({
  nome: z.string().trim().min(1),
  email: z.string().trim().email(),
  telefone: z.string().trim().min(1),
  crm: z.string().trim().min(1),
  especialidade: z.string().trim().min(1),
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
  return res.json(await service.listarMedicos());
}
export async function buscarPorId(req: Request, res: Response) {
  const id = validarId(req, res);
  if (id === null) return;
  const medico = await service.encontrarUmMedico(id);
  if (!medico) return res.status(404).json({ erro: "Médico não encontrado." });
  return res.json(medico);
}
export async function cadastrar(req: Request, res: Response) {
  const dados = medicoSchema.safeParse(req.body);
  if (!dados.success) {
    return res.status(400).json({ erro: "Informe nome, e-mail válido, telefone, CRM e especialidade." });
  }
  return res.status(201).json(await service.criarMedico(dados.data));
}
export async function atualizar(req: Request, res: Response) {
  const id = validarId(req, res);
  if (id === null) return;
  const dados = medicoSchema.safeParse(req.body);
  if (!dados.success) {
    return res.status(400).json({ erro: "Informe nome, e-mail válido, telefone, CRM e especialidade." });
  }
  return res.json(await service.atualizarMedico(id, dados.data));
}
export async function deletar(req: Request, res: Response) {
  const id = validarId(req, res);
  if (id === null) return;
  await service.deletarMedico(id);
  return res.status(204).send();
}
