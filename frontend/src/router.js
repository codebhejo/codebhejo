import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Editor from "./views/Editor.vue";
import FilesList from "./views/FilesList.vue";
import SignIn from "./views/SignIn.vue";
import VerifySignIn from "./views/VerifySignIn.vue";
import { isAuthenticated } from "./services/auth.js";
import SendFile from "./views/SendFile.vue";
import ReceiveFile from "./views/ReceiveFile.vue";
import CliDocs from "./views/CliDocs.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Home },
    { 
      path: "/signin", 
      component: SignIn,
      meta: { guestOnly: true } 
    },
    { 
      path: "/auth/verify", 
      component: VerifySignIn,
      meta: { guestOnly: true } 
    },
    {
      path: "/files",
      component: FilesList,
      meta: { requiresAuth: true },
    },

    {
      path: "/:fileId",
      component: Editor
    },
    {
      path: "/share-file",
      component: SendFile
    },
    {
      path: "/d/:fileId",
      component: ReceiveFile
    },
    {
      path: "/docs/cli",
      component: CliDocs
    }
  ],
});

router.beforeEach(async (to) => {
  const loggedIn = await isAuthenticated();

  // Block protected routes
  if (to.meta.requiresAuth && !loggedIn) {
    return {
      path: "/signin",
      query: { redirect: to.fullPath },
    };
  }

  // Block guest-only routes
  if (to.meta.guestOnly && loggedIn) {
    return "/";
  }

  return true;
});

export default router;
