export async function listarPacientes(): Paciente[] {}
export async function encontrarUmPaciente(id: number): Paciente {}
export async function criarPaciente(dados: PacienteDTO): Paciente {}
export async function atualizarPaciente(
  id: number,
  dados: PacienteDTO,
): Paciente {}
export async function deletarPaciente(id: number): void {}
