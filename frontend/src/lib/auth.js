const TOKEN_KEY = "farmtrak_token";
const USER_KEY = "farmtrak_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession({ token, user }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getUserRole() {
  const user = getUser();
  return user?.role || null;
}

export function roleHome(role) {
  if (role === "admin") return "/users";
  if (role === "manager") return "/dashboard";
  if (role === "worker") return "/harvest";
  return "/login";
}
