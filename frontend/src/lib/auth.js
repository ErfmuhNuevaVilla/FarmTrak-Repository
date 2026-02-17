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
    // First, get user by email to check status before signing in
    const { data: existingUsers, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    console.log('Pre-login user check:', { existingUsers, emailError });

    let isDisabled = false;
    
    if (existingUsers && !emailError) {
      // Check if user is disabled in database
      isDisabled = existingUsers.status === 'disabled' || existingUsers.disabled === true;
      console.log('User disabled status from database:', isDisabled);
    } else if (emailError && !emailError.message?.includes('No rows found')) {
      console.error('Error checking user status:', emailError);
    }

    // Also check auth metadata if database fails or user not found
    if (!existingUsers || emailError) {
      // We can't check auth metadata without signing in first, so we'll proceed
      // and check after sign in
      console.log('User not found in database, proceeding with sign in');
    } else if (isDisabled) {
      // User is disabled, don't allow sign in
      throw new Error('Your account has been disabled. Please contact administrator.');
    }

    // Proceed with sign in since user is not disabled (or we couldn't check)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Store user data in localStorage for compatibility
    if (data.user) {
      let userSessionData;

      try {
        // Double-check status after sign in (for cases where we couldn't check before)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        console.log('Post-login user data query result:', { userData, userError });

        if (userError) {
          console.error('Error fetching user data:', userError);
          
          // Check auth metadata for disabled status
          const isDisabledInMetadata = data.user.user_metadata?.disabled === true;
          
          if (isDisabledInMetadata) {
            await supabase.auth.signOut();
            throw new Error('Your account has been disabled. Please contact administrator.');
          }
          
          userSessionData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
            role: data.user.user_metadata?.role || 'worker',
            status: 'enabled'
          };
        } else if (!userData) {
          throw new Error('User profile not found');
        } else {
          // Final check if user account is disabled in database
          const finalDisabledCheck = userData.status === 'disabled' || userData.disabled === true;
          
          if (finalDisabledCheck) {
            await supabase.auth.signOut();
            throw new Error('Your account has been disabled. Please contact administrator.');
          }

          userSessionData = {
            id: userData.id,
            email: userData.email,
            name: userData.name || userData.email,
            role: userData.role || 'worker',
            status: userData.status || 'enabled'
          };
        }
      } catch (dbError) {
        console.error('Database query failed:', dbError);
        
        // Check auth metadata for disabled status
        const isDisabledInMetadata = data.user.user_metadata?.disabled === true;
        
        if (isDisabledInMetadata) {
          await supabase.auth.signOut();
          throw new Error('Your account has been disabled. Please contact administrator.');
        }
        
        // Fallback to original behavior if database query fails
        userSessionData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email,
          role: data.user.user_metadata?.role || 'worker',
          status: 'enabled'
        };
      }
      
      setSession({
        token: data.session.access_token,
        user: userSessionData
      });

      return { user: userSessionData, session: data.session };
    }

    return data;
  } catch (error) {
    // Ensure user is signed out on any error
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error('Error signing out:', signOutError);
    }
    
    // Clear any stored session data
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
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

export async function updateUserPassword(userId, newPassword) {
  try {
    // Create a custom solution using database function
    // We'll create a temporary session for the target user and update their password
    // This approach bypasses admin API requirements
    
    // First, check if current user has admin privileges by checking their role
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only administrators can reset user passwords');
    }

    // Use a database function to update the password
    // This requires creating a PostgreSQL function in Supabase
    const { data, error } = await supabase.rpc('admin_update_user_password', {
      target_user_id: userId,
      new_password: newPassword
    });

    if (error) {
      console.error('Database function error:', error);
      
      // Fallback: Try to update using a different approach
      // If the RPC function doesn't exist, we'll need to create it
      throw new Error('Password update function not available. Please contact your database administrator to set up the admin_update_user_password function.');
    }

    return data;
  } catch (error) {
    console.error('Update user password error:', error);
    throw new Error(error.message || 'Failed to update password');
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
