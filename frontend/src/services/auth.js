import axios from "axios";

const ACCESS_TOKEN_KEY = "fitprogress_access_token";
const REFRESH_TOKEN_KEY = "fitprogress_refresh_token";
const USER_KEY = "fitprogress_user";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  const expiresAt = payload.exp * 1000;
  const refreshMargin = 60 * 1000;
  return Date.now() >= expiresAt - refreshMargin;
}

function saveSession(data) {
  if (data.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  }

  if (data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  }

  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getCurrentUser() {
  const storedUser = localStorage.getItem(USER_KEY);
  return storedUser ? JSON.parse(storedUser) : null;
}

export function isAuthenticated() {
  return Boolean(getAccessToken() || getRefreshToken());
}

export async function refreshSession() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }

  const { data } = await axios.post(
    `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    { refresh_token: refreshToken },
    {
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
    },
  );

  saveSession(data);
  return data.access_token;
}

export async function ensureAccessToken() {
  const token = getAccessToken();

  if (token && !isTokenExpired(token)) {
    return token;
  }

  return refreshSession();
}

export async function login(email, password) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }

  const { data } = await axios.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    { email, password },
    {
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
    },
  );

  saveSession(data);

  return data;
}

export async function register(name, email, password) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }

  const { data } = await axios.post(
    `${supabaseUrl}/auth/v1/signup`,
    {
      email,
      password,
      data: { name },
    },
    {
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
    },
  );

  saveSession(data);

  return data;
}

export function logout({ redirect = true } = {}) {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  if (redirect) {
    window.location.href = "/login";
  }
}
