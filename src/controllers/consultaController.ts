import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "../services/consultaService.js";

const consultaSchema = z.object({
  data: z.iso.date().transform((data) => new Date(`${data}T00:00:00.000Z`)),
  turno: z.enum(["manha", "tarde", "noite"]),
  medico: z.number().int().positive().max(2147483647),
  paciente: z.number().int().positive().max(2147483647),
}).transform(({ data, turno, medico, paciente }) => ({
  data, turno, medicoId: medico, pacienteId: paciente,
}));

function validarId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647) {
    res.status(400).json({ erro: "ID inválido." });
    return null;
  }
  return id;
}

export async function listar(req: Request, res: Response) {
  return res.json(await service.listarConsultas());
}
export async function buscarPorId(req: Request, res: Response) {
  const id = validarId(req, res);
  if (id === null) return;
  const consulta = await service.encontrarUmaConsulta(id);
  if (!consulta) return res.status(404).json({ erro: "Consulta não encontrada." });
  return res.json(consulta);
}
export async function cadastrar(req: Request, res: Response) {
  const dados = consultaSchema.safeParse(req.body);
  if (!dados.success) {
    return res.status(400).json({ erro: "Informe data válida (AAAA-MM-DD), turno (manha, tarde ou noite), medico e paciente (IDs positivos)." });
  }
  return res.status(201).json(await service.criarConsulta(dados.data));
}
export async function atualizar(req: Request, res: Response) {
  const id = validarId(req, res);
  if (id === null) return;
  const dados = consultaSchema.safeParse(req.body);
  if (!dados.success) {
    return res.status(400).json({ erro: "Informe data válida (AAAA-MM-DD), turno (manha, tarde ou noite), medico e paciente (IDs positivos)." });
  }
  return res.json(await service.atualizarConsulta(id, dados.data));
}
export async function deletar(req: Request, res: Response) {
  const id = validarId(req, res);
  if (id === null) return;
  await service.deletarConsulta(id);
  return res.status(204).send();
}
