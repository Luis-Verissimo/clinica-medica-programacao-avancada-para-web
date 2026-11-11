import { Alert, Button, Group, Table, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { MenuLateral } from "../components/MenuLateral";
import { NovaConsultaModal } from "../components/NovaConsultaModal";
import { useEffect, useState } from "react";
import type { Consulta } from "@clinica/shared/consulta";
import { listarConsultas } from "../services/api";

type Props = {
  nome: string;
  onIrParaPacientes: () => void;
  onSair: () => void;
};

export function HomePage({ nome, onIrParaPacientes, onSair }: Props) {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [erro, setErro] = useState("");
  const [formularioAberto, setFormularioAberto] = useState(false);

  async function buscarConsultas() {
    setErro("");
    try {
      setConsultas(await listarConsultas());
    } catch {
      setErro("Não foi possível buscar as consultas na API");
    }
  }

  useEffect(() => {
    buscarConsultas();
  }, []); //executa uma única vez (ao construir este comp) a função buscarConsultas()

  return (
    <MenuLateral
      nome={nome}
      paginaAtual="consultas"
      onNavegar={(pagina) => {
        if (pagina === "pacientes") onIrParaPacientes();
      }}
      onSair={onSair}
    >
      <Group justify="space-between" mb="xl">
        <Title order={1}>Consultas</Title>
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={() => setFormularioAberto(true)}
        >
          Nova consulta
        </Button>
      </Group>
      {erro && (
        <Alert color="red" mb="md">
          {erro}
        </Alert>
      )}
      <Table.ScrollContainer minWidth={560}>
        <Table bg="white" highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Data</Table.Th>
              <Table.Th>Turno</Table.Th>
              <Table.Th>Paciente</Table.Th>
              <Table.Th>Médico</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {consultas.map((consulta) => (
              <Table.Tr key={consulta.id}>
                <Table.Td>{consulta.data}</Table.Td>
                <Table.Td>
                  {consulta.turno === "M" ? "Manhã" : "Tarde"}
                </Table.Td>
                <Table.Td>{consulta.paciente.nome}</Table.Td>
                <Table.Td>{consulta.medico.nome}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <NovaConsultaModal
        aberto={formularioAberto}
        onFechar={() => setFormularioAberto(false)}
        onSalvar={() => {
          setFormularioAberto(false);
          buscarConsultas(); // atualiza a lista com a consulta nova
        }}
      />
    </MenuLateral>
  );
}
