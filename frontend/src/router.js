import { createRouter, createWebHistory } from "vue-router";
import { isAuthenticated } from "./services/auth.js";

const Home = () => import("./views/Home.vue");
const Editor = () => import("./views/Editor.vue");
const FilesList = () => import("./views/FilesList.vue");
const SignIn = () => import("./views/SignIn.vue");
const VerifySignIn = () => import("./views/VerifySignIn.vue");
const SendFile = () => import("./views/SendFile.vue");
const ReceiveFile = () => import("./views/ReceiveFile.vue");
const CliDocs = () => import("./views/CliDocs.vue");

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/signin", component: SignIn, meta: { guestOnly: true } },
    { path: "/auth/verify", component: VerifySignIn, meta: { guestOnly: true } },
    { path: "/files", component: FilesList, meta: { requiresAuth: true } },
    { path: "/:fileId", component: Editor },
    { path: "/share-file", component: SendFile },
    { path: "/d/:fileId", component: ReceiveFile },
    { path: "/docs/cli", component: CliDocs },
  ],
});

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.guestOnly) return true;

  const loggedIn = await isAuthenticated();

  if (to.meta.requiresAuth && !loggedIn) {
    return { path: "/signin", query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && loggedIn) return "/";

  return true;
});

export default router;
