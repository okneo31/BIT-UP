import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      set({ user: profile, initialized: true });
    } else {
      set({ user: null, initialized: true });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        set({ user: profile });
      } else if (event === 'SIGNED_OUT') {
        set({ user: null });
      }
    });
  },

  signUp: async (email, password) => {
    set({ loading: true });
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    set({ loading: false });
    if (error) return { error: error.message };
    return {};
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    if (error) return { error: error.message };
    return {};
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
