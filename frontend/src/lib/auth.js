import { supabase } from "./supabase";

const TOKEN_KEY = "farmtrak_token";
const USER_KEY = "farmtrak_user";

export function getToken() {
  // Try to get Supabase session first, then fallback to localStorage
  const session = supabase.auth.getSession();
  if (session?.data?.session?.access_token) {
    return session.data.session.access_token;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export async function setSession({ token, user }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  // Sign out from Supabase
  await supabase.auth.signOut();
  // Clear localStorage
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

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Store user data in localStorage for compatibility
    if (data.user) {
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email,
        role: data.user.user_metadata?.role || 'worker'
      };
      
      await setSession({
        token: data.session.access_token,
        user: userData
      });

      return { user: userData, session: data.session };
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
}

export async function signUp(email, password, name, role = 'worker') {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });

    if (error) throw error;

    // Store user data in localStorage for compatibility
    if (data.user) {
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: name,
        role: role
      };
      
      await setSession({
        token: data.session?.access_token,
        user: userData
      });

      return { user: userData, session: data.session };
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
}

export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return true;
  } catch (error) {
    throw new Error(error.message || 'Password reset failed');
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

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const userData = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name || session.user.email,
      role: session.user.user_metadata?.role || 'worker'
    };
    
    setSession({
      token: session.access_token,
      user: userData
    });
  } else if (event === 'SIGNED_OUT') {
    clearSession();
  }
});
