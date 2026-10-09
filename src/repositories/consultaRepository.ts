import { prisma } from "../database/prisma.js";
import type { ConsultaDTO } from "../types/consulta.js";

const include = { medico: true, paciente: true };

export async function findAll() {
  return prisma.consulta.findMany({ include, orderBy: { data: "asc" } });
}
export async function findById(id: number) {
  return prisma.consulta.findUnique({ where: { id }, include });
}
export async function create(data: ConsultaDTO) {
  return prisma.consulta.create({ data, include });
}
export async function update(id: number, data: ConsultaDTO) {
  return prisma.consulta.update({ where: { id }, data, include });
}
export async function remove(id: number) {
  return prisma.consulta.delete({ where: { id } });
}
