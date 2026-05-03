<script setup>
import { ref, watch, onMounted } from "vue";
import EasyDataTable from "vue3-easy-data-table";
import "vue3-easy-data-table/dist/style.css";
import Navbar from "../components/Navbar.vue";
import Footer from "../components/Footer.vue";
import { LayoutDashboard, Users, FileCode, CircleCheck, CircleDashed, ShieldCheck, UserX } from "lucide-vue-next";

const API = import.meta.env.VITE_API_URL;

const activeTab = ref("dashboard");

// Dashboard
const dashboardStats = ref(null);
const anonymousFileCount = ref(0);
const dashboardLoading = ref(true);
const dashboardError = ref(null);

// Users table
const users = ref([]);
const total = ref(0);
const search = ref("");
const usersLoading = ref(false);
const usersError = ref(null);

const serverOptions = ref({ page: 1, rowsPerPage: 10, sortBy: "created_at", sortType: "desc" });

const headers = [
  { text: "Email",      value: "email",         sortable: true },
  { text: "Verified",   value: "verified",       sortable: false },
  { text: "Files",      value: "file_count",     sortable: true },
  { text: "Last Login", value: "last_login_at",  sortable: true },
  { text: "Joined",     value: "created_at",     sortable: true },
];

async function fetchUsers() {
  usersLoading.value = true;
  usersError.value = null;
  try {
    const { page, rowsPerPage, sortBy, sortType } = serverOptions.value;
    const params = new URLSearchParams({
      page,
      limit: rowsPerPage,
      search: search.value,
      sortBy:    sortBy    || "created_at",
      sortOrder: sortType  || "desc",
    });
    const res = await fetch(`${API}/admin/users?${params}`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to load users");
    const data = await res.json();
    users.value = data.users;
    total.value = data.total;
    if (!dashboardStats.value) {
      dashboardStats.value = data.dashboardStats;
      anonymousFileCount.value = data.anonymousFileCount;
      dashboardLoading.value = false;
    }
  } catch (e) {
    usersError.value = e.message;
  } finally {
    usersLoading.value = false;
  }
}

function onSearch() {
  serverOptions.value = { ...serverOptions.value, page: 1 };
}

function formatDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

watch(serverOptions, fetchUsers, { deep: true });
watch(search, onSearch);
onMounted(fetchUsers);
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
          <button class="nav-item" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
            <LayoutDashboard size="14" /> Dashboard
          </button>
          <button class="nav-item" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
            <Users size="14" /> Users
          </button>
        </nav>
      </aside>

      <!-- Content -->
      <main class="admin-content">

        <!-- Dashboard -->
        <template v-if="activeTab === 'dashboard'">
          <h2 class="page-title">Dashboard</h2>
          <div v-if="dashboardLoading" class="state-msg">Loading...</div>
          <div v-else-if="dashboardError" class="state-msg error">{{ dashboardError }}</div>
          <div v-else class="stat-grid">
            <div class="stat-card">
              <div class="stat-icon users-icon"><Users size="18" /></div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboardStats?.verifiedUsers ?? 0 }}</span>
                <span class="stat-label">Active Users</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon files-icon"><FileCode size="18" /></div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboardStats?.totalFiles ?? 0 }}</span>
                <span class="stat-label">Files Shared</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon total-icon"><ShieldCheck size="18" /></div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboardStats?.totalUsers ?? 0 }}</span>
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

          <div v-if="usersError" class="state-msg error">{{ usersError }}</div>

          <div class="users-toolbar">
            <input v-model="search" class="search-input" placeholder="Search by email..." />
            <span class="total-label" v-if="total > 0">{{ total }} users</span>
          </div>

          <EasyDataTable
            :headers="headers"
            :items="users"
            :server-items-length="total"
            v-model:server-options="serverOptions"
            :loading="usersLoading"
            theme-color="#4a6fa5"
            :rows-per-page-options="[10, 20, 50]"
          >
            <template #item-verified="{ last_login_at }">
              <CircleCheck v-if="last_login_at" size="14" class="verified" />
              <CircleDashed v-else size="14" class="unverified" />
            </template>

            <template #item-email="{ email, is_admin }">
              <span class="email-cell">
                {{ email }}
                <span v-if="is_admin" class="admin-badge">admin</span>
              </span>
            </template>

            <template #item-file_count="{ file_count }">
              <span class="num-cell">
                <FileCode size="12" class="file-icon" />
                {{ file_count }}
              </span>
            </template>

            <template #item-last_login_at="{ last_login_at }">
              <span class="muted">{{ formatDate(last_login_at) }}</span>
            </template>

            <template #item-created_at="{ created_at }">
              <span class="muted">{{ formatDate(created_at) }}</span>
            </template>
          </EasyDataTable>
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

.admin-body { flex: 1; display: flex; }

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

.sidebar-nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; }

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

.nav-item:hover { background: #161616; color: #ccc; }
.nav-item.active { background: #1e1e1e; color: #ffffff; }

/* Content */
.admin-content {
  flex: 1;
  padding: 32px 36px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.page-title { font-size: 15px; font-weight: 600; color: #fff; margin: 0; }

/* Stats */
.stat-grid { display: flex; gap: 16px; flex-wrap: wrap; }

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

.stat-info { display: flex; flex-direction: column; gap: 3px; }
.stat-value { font-size: 26px; font-weight: 700; color: #fff; line-height: 1; }
.stat-label { font-size: 11px; color: #777; }

/* Toolbar */
.users-toolbar { display: flex; align-items: center; gap: 12px; }

.search-input {
  width: 100%;
  max-width: 300px;
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
.total-label { font-size: 12px; color: #444; }

/* Table cells */
.email-cell { display: flex; align-items: center; gap: 8px; }

.admin-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #1a1f2e;
  color: #4a6fa5;
  border: 1px solid #1e2a3a;
}

.verified   { color: #4ade80; }
.unverified { color: #444; }
.num-cell   { display: flex; align-items: center; gap: 6px; color: #666; }
.file-icon  { color: #333; }
.muted      { color: #777; }

/* Table library theming */
:deep(.vue3-easy-data-table) {
  border: 1px solid #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

:deep(.vue3-easy-data-table__header) {
  background-color: #111 !important;
}

:deep(.vue3-easy-data-table__header th) {
  background-color: #111 !important;
  color: #888 !important;
  border-bottom: 1px solid #1e1e1e !important;
  font-size: 13px !important;
  font-weight: 500 !important;
}

:deep(.vue3-easy-data-table__body td) {
  background-color: #0e0e0e !important;
  color: #e0e0e0 !important;
  border-bottom: 1px solid #141414 !important;
  font-size: 13px !important;
}

:deep(.vue3-easy-data-table__body tr:hover td) {
  background-color: #161616 !important;
}

:deep(.vue3-easy-data-table__main),
:deep(.vue3-easy-data-table__main table),
:deep(.vue3-easy-data-table__main tbody),
:deep(.vue3-easy-data-table__main tbody tr),
:deep(.vue3-easy-data-table__main tbody tr td) {
  background-color: #0e0e0e !important;
}

:deep(.vue3-easy-data-table__footer) {
  background-color: #111 !important;
  color: #888 !important;
  border-top: 1px solid #1e1e1e !important;
  font-size: 12px !important;
}

:deep(.vue3-easy-data-table__footer .rows-per-page select),
:deep(.vue3-easy-data-table__footer .rows-per-page span) {
  background-color: #161616 !important;
  color: #888 !important;
  border-color: #2a2a2a !important;
}

.state-msg { font-size: 13px; color: #444; padding: 20px 0; }
.state-msg.error { color: #ef4444; }
</style>
