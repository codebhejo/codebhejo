<script setup>
import { ref, computed, onMounted } from "vue";
import Navbar from "../components/Navbar.vue";
import Footer from "../components/Footer.vue";
import { LayoutDashboard, Users, FileCode, CircleCheck, CircleDashed, ShieldCheck, UserX } from "lucide-vue-next";

const API = import.meta.env.VITE_API_URL;

const activeTab = ref("dashboard");
const users = ref([]);
const anonymousFileCount = ref(0);
const loading = ref(true);
const error = ref(null);
const search = ref("");

const stats = computed(() => ({
  total: users.value.length,
  verified: users.value.filter(u => u.last_login_at).length,
  files: users.value.reduce((sum, u) => sum + Number(u.file_count), 0),
}));

const filtered = computed(() => {
  if (!search.value) return users.value;
  return users.value.filter(u => u.email.toLowerCase().includes(search.value.toLowerCase()));
});

function formatDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

onMounted(async () => {
  try {
    const res = await fetch(`${API}/admin/users`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to load users");
    const data = await res.json();
    users.value = data.users;
    anonymousFileCount.value = data.anonymousFileCount;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="admin-container">
    <Navbar />

    <div class="admin-body">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-title">
          <ShieldCheck size="14" />
          <span>Admin</span>
        </div>

        <nav class="sidebar-nav">
          <button
            class="nav-item"
            :class="{ active: activeTab === 'dashboard' }"
            @click="activeTab = 'dashboard'"
          >
            <LayoutDashboard size="14" />
            Dashboard
          </button>
          <button
            class="nav-item"
            :class="{ active: activeTab === 'users' }"
            @click="activeTab = 'users'"
          >
            <Users size="14" />
            Users
          </button>
        </nav>
      </aside>

      <!-- Content -->
      <main class="admin-content">

        <!-- Dashboard -->
        <template v-if="activeTab === 'dashboard'">
          <h2 class="page-title">Dashboard</h2>

          <div v-if="loading" class="state-msg">Loading...</div>
          <div v-else-if="error" class="state-msg error">{{ error }}</div>

          <div v-else class="stat-grid">
            <div class="stat-card">
              <div class="stat-icon users-icon"><Users size="18" /></div>
              <div class="stat-info">
                <span class="stat-value">{{ stats.verified }}</span>
                <span class="stat-label">Active Users</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon files-icon"><FileCode size="18" /></div>
              <div class="stat-info">
                <span class="stat-value">{{ stats.files }}</span>
                <span class="stat-label">Files Shared</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon total-icon"><ShieldCheck size="18" /></div>
              <div class="stat-info">
                <span class="stat-value">{{ stats.total }}</span>
                <span class="stat-label">Total Registered</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon anon-icon"><UserX size="18" /></div>
              <div class="stat-info">
                <span class="stat-value">{{ anonymousFileCount }}</span>
                <span class="stat-label">Unverified Files (S3)</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Users -->
        <template v-else-if="activeTab === 'users'">
          <h2 class="page-title">Users</h2>

          <div v-if="loading" class="state-msg">Loading...</div>
          <div v-else-if="error" class="state-msg error">{{ error }}</div>

          <template v-else>
            <input
              v-model="search"
              class="search-input"
              placeholder="Search by email..."
            />

            <table class="user-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Verified</th>
                  <th>Files</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filtered" :key="user.id">
                  <td class="email-cell">
                    <span>{{ user.email }}</span>
                    <span v-if="user.is_admin" class="admin-badge">admin</span>
                  </td>
                  <td>
                    <CircleCheck v-if="user.last_login_at" size="14" class="verified" />
                    <CircleDashed v-else size="14" class="unverified" />
                  </td>
                  <td class="num-cell">
                    <FileCode size="12" class="file-icon" />
                    {{ user.file_count }}
                  </td>
                  <td class="muted">{{ formatDate(user.last_login_at) }}</td>
                  <td class="muted">{{ formatDate(user.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </template>

      </main>
    </div>

    <Footer />
  </div>
</template>

<style scoped>
.admin-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #0e0e0e;
  color: #e0e0e0;
  font-family: 'Fira Code', monospace;
}

/* Layout */
.admin-body {
  flex: 1;
  display: flex;
}

/* Sidebar */
.sidebar {
  width: 200px;
  min-height: 100%;
  border-right: 1px solid #1a1a1a;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-shrink: 0;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  font-size: 11px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 6px;
  color: #888;
  font-size: 13px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.nav-item:hover {
  background: #161616;
  color: #ccc;
}

.nav-item.active {
  background: #1e1e1e;
  color: #ffffff;
}

/* Content */
.admin-content {
  flex: 1;
  padding: 32px 36px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.page-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

/* Stats */
.stat-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: #111;
  border: 1px solid #1a1a1a;
  border-radius: 10px;
  min-width: 180px;
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.users-icon  { background: #0d1f12; color: #4ade80; }
.files-icon  { background: #0f1a2e; color: #4a6fa5; }
.total-icon  { background: #1a1208; color: #a37c40; }
.anon-icon   { background: #1f0f0f; color: #a05050; }

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  color: #777;
}

/* Users table */
.search-input {
  width: 100%;
  max-width: 320px;
  padding: 8px 12px;
  background: #161616;
  border: 1px solid #1e1e1e;
  border-radius: 6px;
  color: #e0e0e0;
  font-family: inherit;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.search-input:focus { border-color: #333; }
.search-input::placeholder { color: #333; }

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.user-table th {
  text-align: left;
  padding: 8px 12px;
  color: #666;
  font-weight: 500;
  border-bottom: 1px solid #1a1a1a;
}

.user-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #141414;
  vertical-align: middle;
}

.user-table tbody tr:hover td { background: #111; }

.email-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #1a1f2e;
  color: #4a6fa5;
  border: 1px solid #1e2a3a;
}

.verified   { color: #4ade80; }
.unverified { color: #2a2a2a; }

.num-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
}

.file-icon { color: #333; }
.muted { color: #777; }

.state-msg {
  font-size: 13px;
  color: #444;
  padding: 20px 0;
}

.state-msg.error { color: #ef4444; }
</style>
