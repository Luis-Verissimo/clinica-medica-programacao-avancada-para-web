import express from "express";
import type { ErrorRequestHandler } from "express";
import dotenv from "dotenv";
import pacienteRoutes from "./routes/pacienteRoutes.js";

import medicoRoutes from "./routes/medicoRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT: number = Number(process.env.PORT || 3000);

app.use(pacienteRoutes);
app.use(medicoRoutes);

const tratarErro: ErrorRequestHandler = (erro, req, res, next) => {
  if (erro.code === "P2025") {
    const recurso = erro.meta?.modelName === "Medico" ? "Médico" : "Paciente";
    res.status(404).json({ erro: `${recurso} não encontrado.` });
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
