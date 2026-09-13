import { supabase } from "@/integrations/supabase/client";

let sessionPromise: Promise<string> | undefined;

export function ensureAnonymousSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const { data: existing, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (existing.session?.user.id) return existing.session.user.id;

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) throw error ?? new Error("The private session could not be created.");
      return data.user.id;
    })().catch((error) => {
      sessionPromise = undefined;
      throw error;
    });
  }

  return sessionPromise;
}