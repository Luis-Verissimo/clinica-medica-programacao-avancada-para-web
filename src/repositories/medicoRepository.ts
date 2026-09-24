import { prisma } from "../database/prisma.js";
import type { MedicoDTO } from "../types/medico.js";

export async function findAll() {
  return await prisma.medico.findMany();
}

export async function findById(id: number) {
  return await prisma.medico.findUnique({ where: { id } });
}

export async function create(data: MedicoDTO) {
  return await prisma.medico.create({ data });
}

export async function update(id: number, data: MedicoDTO) {
  return await prisma.medico.update({ where: { id }, data });
}

export async function remove(id: number) {
  return await prisma.medico.delete({ where: { id } });
}
