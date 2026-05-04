import { createContext, useContext, useState } from "react";
import {
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  cadastrarUsuario,
  loginUsuario,
} from "../services/authApi";
import { getLocations, getUnlockedPoints } from "../services/gamificationApi";
import { getInitialApiBaseUrl, normalizeApiBaseUrl } from "../config/api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [apiBaseUrl, setApiBaseUrl] = useState(getInitialApiBaseUrl());
  const [usuario, setUsuario] = useState(null);
  const [locations, setLocations] = useState([]);
  const [pontosDesbloqueados, setPontosDesbloqueados] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [autenticando, setAutenticando] = useState(false);
  const [cadastrando, setCadastrando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [ultimaConquista, setUltimaConquista] = useState(null);

  async function carregarSnapshotGamificacao(baseUrlAtual, usuarioIdAtual) {
    return Promise.all([
      buscarUsuarioPorId(baseUrlAtual, usuarioIdAtual),
      getLocations(baseUrlAtual),
      getUnlockedPoints(baseUrlAtual, usuarioIdAtual),
    ]);
  }

  async function sincronizarGamificacao(
    usuarioIdAtual = usuario?.id,
    baseUrlAtual = apiBaseUrl
  ) {
    if (!usuarioIdAtual) {
      return;
    }

    setCarregandoDados(true);

    try {
      const [usuarioAtualizado, points, desbloqueios] =
        await carregarSnapshotGamificacao(baseUrlAtual, usuarioIdAtual);

      setUsuario(usuarioAtualizado);
      setLocations(points);
      setPontosDesbloqueados(desbloqueios.pontos_desbloqueados || []);
    } finally {
      setCarregandoDados(false);
    }
  }

  async function login({ baseUrl, email, senha }) {
    const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);

    setAutenticando(true);

    try {
      const respostaLogin = await loginUsuario(normalizedBaseUrl, {
        email,
        senha,
      });

      const usuarioEncontrado = await buscarUsuarioPorEmail(
        normalizedBaseUrl,
        email
      );

      const [usuarioAtualizado, points, desbloqueios] =
        await carregarSnapshotGamificacao(
          normalizedBaseUrl,
          usuarioEncontrado.id
        );

      setApiBaseUrl(normalizedBaseUrl);
      setUsuario(usuarioAtualizado);
      setLocations(points);
      setPontosDesbloqueados(desbloqueios.pontos_desbloqueados || []);
      setUserLocation(null);
      setUltimaConquista(null);

      return respostaLogin;
    } catch (error) {
      setUsuario(null);
      setLocations([]);
      setPontosDesbloqueados([]);
      setUserLocation(null);
      setUltimaConquista(null);
      throw error;
    } finally {
      setAutenticando(false);
    }
  }

  async function cadastrar({
    baseUrl,
    nome,
    email,
    senha,
    fotoVerificacao,
    origemFoto,
  }) {
    const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);

    setCadastrando(true);

    try {
      const respostaCadastro = await cadastrarUsuario(normalizedBaseUrl, {
        nome,
        email,
        senha,
        foto_verificacao: fotoVerificacao,
        verificacao_origem_foto: origemFoto,
      });

      setApiBaseUrl(normalizedBaseUrl);

      return respostaCadastro;
    } finally {
      setCadastrando(false);
    }
  }

  function registrarDesbloqueioLocal(pontoId, resposta) {
    setPontosDesbloqueados((current) =>
      current.includes(pontoId) ? current : [...current, pontoId]
    );

    setUsuario((current) =>
      current
        ? {
            ...current,
            pontos_totais: resposta.pontos_totais_usuario,
          }
        : current
    );

    setUltimaConquista(resposta);
  }

  function logout() {
    setUsuario(null);
    setLocations([]);
    setPontosDesbloqueados([]);
    setUserLocation(null);
    setUltimaConquista(null);
  }

  return (
    <AppContext.Provider
      value={{
        apiBaseUrl,
        setApiBaseUrl,
        usuario,
        locations,
        pontosDesbloqueados,
        userLocation,
        setUserLocation,
        autenticando,
        cadastrando,
        carregandoDados,
        ultimaConquista,
        login,
        cadastrar,
        logout,
        sincronizarGamificacao,
        registrarDesbloqueioLocal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext precisa ser usado dentro de AppProvider");
  }

  return context;
}
