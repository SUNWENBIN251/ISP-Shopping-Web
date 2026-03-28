import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";
import "./assets/styles/global.css";
import { initCareMode } from "./services/careModeService";

initCareMode();
createApp(App).use(router).use(i18n).mount("#app");

