import { defineStore } from "pinia";

const API = import.meta.env.VITE_API_URL;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    loading: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
  },

  actions: {
    async fetchUser() {
      this.loading = true;

      try {
        const res = await fetch(`${API}/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          this.user = null;
          return;
        }

        const data = await res.json();
        this.user = data;
                
      } catch {
        this.user = null;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      
      this.user = null;
    },
  },
});