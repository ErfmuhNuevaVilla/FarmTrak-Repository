import { API_BASE } from "./config";
import { supabase } from "./supabase";

export async function apiFetch(path, { token, ...options } = {}) {
  // For Supabase, we need to use the REST API format
  // Convert paths like '/api/users' to '/rest/v1/users'
  let supabasePath = path;
  
  // If path starts with /api/, convert to Supabase REST format
  if (path.startsWith('/api/')) {
    supabasePath = path.replace('/api/', '/rest/v1/');
  } else if (!path.startsWith('/rest/v1/')) {
    supabasePath = `/rest/v1${path}`;
  }

  const res = await fetch(`${API_BASE}${supabasePath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Supabase direct functions for complex operations
export async function supabaseQuery(table, options = {}) {
  let query = supabase.from(table);

  // Apply filters
  if (options.select) {
    query = query.select(options.select);
  } else {
    query = query.select('*');
  }

  if (options.eq) {
    Object.entries(options.eq).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  if (options.neq) {
    Object.entries(options.neq).forEach(([key, value]) => {
      query = query.neq(key, value);
    });
  }

  if (options.in) {
    Object.entries(options.in).forEach(([key, values]) => {
      query = query.in(key, values);
    });
  }

  if (options.order) {
    query = query.order(options.order.column, { 
      ascending: options.order.ascending !== false 
    });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.range) {
    query = query.range(options.range.start, options.range.end);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function supabaseInsert(table, data) {
  const { result, error } = await supabase
    .from(table)
    .insert(data)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return result;
}

export async function supabaseUpdate(table, data, condition) {
  let query = supabase.from(table).update(data);

  if (condition.eq) {
    Object.entries(condition.eq).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { result, error } = await query.select();

  if (error) {
    throw new Error(error.message);
  }

  return result;
}

export async function supabaseDelete(table, condition) {
  let query = supabase.from(table).delete();

  if (condition.eq) {
    Object.entries(condition.eq).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

