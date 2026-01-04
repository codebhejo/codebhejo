import { defineStore } from "pinia";

const API = import.meta.env.VITE_API_URL;

export const useFilesStore = defineStore("files", {
  state: () => ({
    files: [],
    loading: false,
  }),

  actions: {
    async fetchFiles() {
      this.loading = true;
      try {
        const res = await fetch(`${API}/code/files`, { 
            credentials: "include",
            method: "POST" 
        });
        
        if (res.ok) {
          const data = await res.json();
          this.files = data.files;
        }
      } finally {
        this.loading = false;
      }
    },
  },
});
