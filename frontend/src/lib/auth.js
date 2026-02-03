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

export function setSession({ token, user }) {
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
      
      setSession({
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

// Registration flag to prevent auto-login
let isRegistering = false;
let registeringUserId = null;

export async function signUp(email, password, name, role = 'worker') {
  try {
    isRegistering = true; // Set flag to prevent auto-login
    
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

    // Store the user ID being registered to prevent their auto-login
    if (data.user) {
      registeringUserId = data.user.id;
    }

    // If user was created but trigger didn't work, create profile manually
    if (data.user && !data.session) {
      try {
        // Try to create profile manually
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: name,
            role: role
          });
        
        if (profileError) {
          console.warn('Profile creation failed, but user was created:', profileError);
        }
      } catch (profileErr) {
        console.warn('Manual profile creation failed:', profileErr);
      }
    }

    // DON'T auto-login after registration - user should login manually
    // This prevents new users from getting immediate access
    
    return { 
      success: true, 
      message: "User created successfully. Please login with your credentials.",
      user: data.user 
    };
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  } finally {
    isRegistering = false; // Reset flag
    registeringUserId = null; // Reset user ID
  }
}

export async function updateUser(updates) {
  try {
    let result;
    
    // Handle password update separately
    if (updates.password) {
      const { data, error } = await supabase.auth.updateUser({
        password: updates.password
      });
      
      if (error) throw error;
      result = data;
    }
    
    // Handle metadata updates (name, etc.)
    const metadataUpdates = {};
    if (updates.name) {
      metadataUpdates.data = {
        name: updates.name
      };
    }
    
    if (Object.keys(metadataUpdates).length > 0) {
      const { data, error } = await supabase.auth.updateUser(metadataUpdates);
      
      if (error) throw error;
      result = data;
    }

    // Update localStorage with new user data
    if (result?.user) {
      const currentUser = getUser();
      const updatedUser = {
        ...currentUser,
        name: updates.name || currentUser.name,
        email: result.user.email || currentUser.email
      };
      
      setSession({
        token: result.session?.access_token || getToken(),
        user: updatedUser
      });

      return { user: updatedUser, session: result.session };
    }

    return result;
  } catch (error) {
    throw new Error(error.message || 'Profile update failed');
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
    // Prevent auto-login only for the specific user being registered
    // This allows the admin to stay logged in while preventing new user auto-login
    if (!isRegistering || session.user.id !== registeringUserId) {
      const userData = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email,
        role: session.user.user_metadata?.role || 'worker'
      };
      
      localStorage.setItem(TOKEN_KEY, session.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }
  } else if (event === 'SIGNED_OUT') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
});
