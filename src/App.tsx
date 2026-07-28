import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Vender from "./pages/Vender";
import Produtos from "./pages/Produtos";
import Historico from "./pages/Historico";
import Relatorios from "./pages/Relatorios";
import Ajuda from "./pages/Ajuda";
import Configuracoes from "./pages/Configuracoes";
import Scanner from "./pages/Scanner";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Vender />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/ajuda" element={<Ajuda />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
