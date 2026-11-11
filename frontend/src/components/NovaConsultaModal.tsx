import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  NativeSelect,
  Stack,
  TextInput,
} from "@mantine/core";
import axios from "axios";
import { consultaSchema } from "@clinica/shared/consulta";
import type { Medico } from "@clinica/shared/medico";
import type { Paciente } from "@clinica/shared/paciente";
import {
  cadastrarConsulta,
  listarMedicos,
  listarPacientes,
} from "../services/api";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: () => void;
};

// Formulário de nova consulta, aberto pelo botão "Nova consulta" da Home
export function NovaConsultaModal({ aberto, onFechar, onSalvar }: Props) {
  // Opções dos selects, vindas da API
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);

  // O que a pessoa escolheu/digitou (o select guarda o id como texto)
  const [pacienteId, setPacienteId] = useState("");
  const [medicoId, setMedicoId] = useState("");
  const [data, setData] = useState("");
  const [turno, setTurno] = useState("");

  // O que vamos mostrar na tela
  const [erro, setErro] = useState("");
  const [erroPaciente, setErroPaciente] = useState("");
  const [erroMedico, setErroMedico] = useState("");
  const [erroData, setErroData] = useState("");
  const [erroTurno, setErroTurno] = useState("");
  const [carregando, setCarregando] = useState(false);

  function limparErros() {
    setErro("");
    setErroPaciente("");
    setErroMedico("");
    setErroData("");
    setErroTurno("");
  }

  async function buscarPacientesEMedicos() {
    try {
      setPacientes(await listarPacientes());
      setMedicos(await listarMedicos());
    } catch {
      setErro("Não foi possível buscar os pacientes e médicos na API");
    }
  }

  // Toda vez que o formulário abre: começa vazio e busca as opções na API
  useEffect(() => {
    if (!aberto) return;
    setPacienteId("");
    setMedicoId("");
    setData("");
    setTurno("");
    limparErros();
    buscarPacientesEMedicos();
  }, [aberto]);

  async function salvar() {
    limparErros();

    // Select vazio vira undefined para o schema responder "é obrigatório"
    const consulta = {
      pacienteId: pacienteId === "" ? undefined : Number(pacienteId),
      medicoId: medicoId === "" ? undefined : Number(medicoId),
      data,
      turno,
    };

    //fail fast
    const validacaoDados = consultaSchema.safeParse(consulta);
    if (!validacaoDados.success) {
      for (const erro of validacaoDados.error.issues) {
        if (erro.path[0] === "pacienteId") setErroPaciente(erro.message);
        if (erro.path[0] === "medicoId") setErroMedico(erro.message);
        if (erro.path[0] === "data") setErroData(erro.message);
        if (erro.path[0] === "turno") setErroTurno(erro.message);
      }
      return;
    }

    setCarregando(true);
    try {
      await cadastrarConsulta(validacaoDados.data);
      onSalvar();
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        const dados = e.response.data;
        setErro(dados.mensagem);
        if (dados.detalhes) {
          for (const detalhe of dados.detalhes) {
            if (detalhe.campo === "pacienteId")
              setErroPaciente(detalhe.mensagem);
            if (detalhe.campo === "medicoId") setErroMedico(detalhe.mensagem);
            if (detalhe.campo === "data") setErroData(detalhe.mensagem);
            if (detalhe.campo === "turno") setErroTurno(detalhe.mensagem);
          }
        }
      } else {
        setErro("Não foi possível conectar à API. Ela está rodando?");
      }
    }
    setCarregando(false);
  }

  return (
    <Modal opened={aberto} onClose={onFechar} title="Nova consulta" centered>
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          salvar();
        }}
      >
        <Stack>
          {erro && <Alert color="red">{erro}</Alert>}

          <NativeSelect
            label="Paciente"
            value={pacienteId}
            onChange={(evento) => setPacienteId(evento.target.value)}
            error={erroPaciente}
            data={[
              { label: "Selecione o paciente", value: "" },
              ...pacientes.map((paciente) => ({
                label: paciente.nome,
                value: String(paciente.id),
              })),
            ]}
          />
          <NativeSelect
            label="Médico"
            value={medicoId}
            onChange={(evento) => setMedicoId(evento.target.value)}
            error={erroMedico}
            data={[
              { label: "Selecione o médico", value: "" },
              ...medicos.map((medico) => ({
                label: `${medico.nome} (${medico.especialidade})`,
                value: String(medico.id),
              })),
            ]}
          />
          <TextInput
            label="Data"
            placeholder="DD/MM/AAAA"
            value={data}
            onChange={(evento) => setData(evento.target.value)}
            error={erroData}
          />
          <NativeSelect
            label="Turno"
            value={turno}
            onChange={(evento) => setTurno(evento.target.value)}
            error={erroTurno}
            data={[
              { label: "Selecione o turno", value: "" },
              { label: "Manhã", value: "M" },
              { label: "Tarde", value: "T" },
            ]}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={onFechar}>
              Cancelar
            </Button>
            <Button type="submit" loading={carregando}>
              Salvar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
