import express from "express";
import type { ErrorRequestHandler } from "express";
import dotenv from "dotenv";
import pacienteRoutes from "./routes/pacienteRoutes.js";

import medicoRoutes from "./routes/medicoRoutes.js";

import consultaRoutes from "./routes/consultaRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT: number = Number(process.env.PORT || 3000);

app.use(pacienteRoutes);
app.use(medicoRoutes);
app.use(consultaRoutes);

const tratarErro: ErrorRequestHandler = (erro, req, res, next) => {
  if (erro.code === "P2025") {
    const mensagem = erro.meta?.modelName === "Consulta"
      ? "Consulta não encontrada."
      : erro.meta?.modelName === "Medico" ? "Médico não encontrado." : "Paciente não encontrado.";
    res.status(404).json({ erro: mensagem });
    return;
  }
  if (erro.code === "P2003") {
    res.status(409).json({ erro: "Médico ou paciente inexistente, ou registro vinculado a uma consulta." });
    return;
  }
  if (erro.type === "entity.parse.failed") {
    res.status(400).json({ erro: "JSON inválido." });
    return;
  }
  console.error(erro);
  res.status(500).json({ erro: "Erro interno do servidor." });
};
app.use(tratarErro);

app.listen(PORT, () => {
  console.log(`A API subiu na porta ${PORT}`);
});
