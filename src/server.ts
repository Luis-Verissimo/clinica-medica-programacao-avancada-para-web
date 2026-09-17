import express from "express";

const app = express();
app.use(express.json());

const PORT: number = 3000;

interface Paciente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
}

const pacientes: Paciente[] = [];

pacientes.push({
  id: 1,
  nome: "Douglas",
  cpf: "123.456.789-00",
  telefone: "11999999999",
});

app.get("/pacientes", (req, res) => {
  return res.json(pacientes);
});

app.get("/pacientes/:id", (req, res) => {
  const idPaciente: number = Number(req.params.id);
  const pacienteEncontrado: Paciente | undefined = pacientes.find(
    (p) => p.id === idPaciente,
  );
  if (pacienteEncontrado) return res.json(pacienteEncontrado);
  else return res.status(404).json("Paciente não encontrado");
});

app.post("/pacientes", (req, res) => {
  const { nome, cpf, telefone } = req.body;
  const idUltimoPacienteAdicionado: number = pacientes[pacientes.length - 1].id;
  const novoId: number =
    pacientes.length > 0 ? idUltimoPacienteAdicionado + 1 : 1;
  const novoPaciente: Paciente = { id: novoId, nome, cpf, telefone };
  pacientes.push(novoPaciente);
  res.status(201).json(novoPaciente);
});

app.put("/pacientes/:id", (req, res) => {
  const idPaciente: number = Number(req.params.id);
  const pacienteEncontrado: Paciente | undefined = pacientes.find(
    (p) => p.id === idPaciente,
  );

  if (!pacienteEncontrado) {
    return res.status(404).json("Paciente não encontrado");
  }

  const { nome, cpf, telefone } = req.body;
  pacienteEncontrado.nome = nome ?? pacienteEncontrado.nome;
  pacienteEncontrado.cpf = cpf ?? pacienteEncontrado.cpf;
  pacienteEncontrado.telefone = telefone ?? pacienteEncontrado.telefone;

  return res.json(pacienteEncontrado);
});

app.delete("/pacientes/:id", (req, res) => {
  const idPaciente: number = Number(req.params.id);
  const pacienteEncontrado: Paciente | undefined = pacientes.find(
    (p) => p.id === idPaciente,
  );
  if (!pacienteEncontrado)
    return res.status(404).json("Paciente não encontrado");
  const index: number = pacientes.indexOf(pacienteEncontrado);
  pacientes.splice(index, 1);

  return res.status(204).json("Paciente removido com sucesso");
});

app.listen(PORT, () => {
  console.log(`A API subiu na porta ${PORT}`);
});
