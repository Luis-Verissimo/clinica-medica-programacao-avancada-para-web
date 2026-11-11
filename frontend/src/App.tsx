import { useState } from "react";
import { TelaDeEntrada } from "./components/TelaDeEntrada.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { CadastroSecretarioPage } from "./pages/CadastroSecretarioPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { PacientesPage } from "./pages/PacientesPage.tsx";

function App() {
  const [tela, setTela] = useState("login");
  const [nome, setNome] = useState("");

  if (tela === "home")
    return (
      <HomePage
        nome={nome}
        onIrParaPacientes={() => setTela("pacientes")}
        onSair={() => setTela("login")}
      />
    );

  if (tela === "pacientes")
    return (
      <PacientesPage
        nome={nome}
        onIrParaConsultas={() => setTela("home")}
        onSair={() => setTela("login")}
      />
    );

  return (
    <TelaDeEntrada>
      {tela === "login" && (
        <LoginPage
          onIrParaCadastro={() => setTela("cadastro")}
          onEntrar={(nomeDeQuemEntrou) => {
            setNome(nomeDeQuemEntrou);
            setTela("home");
          }}
        />
      )}
      {tela === "cadastro" && (
        <CadastroSecretarioPage onVoltarParaLogin={() => setTela("login")} />
      )}
    </TelaDeEntrada>
  );
}

export default App;
