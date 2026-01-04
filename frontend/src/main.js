import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";

const app = createApp(App);
const pinia = createPinia();

function generateRandomString(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);

  return Array.from(array, x => chars[x % chars.length]).join("");
}

export const createFile = async () => {
  const filename = generateRandomString(8);

  router.push(`/${filename}`);
};

app.use(router)
app.use(pinia)
app.mount("#app");