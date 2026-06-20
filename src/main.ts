import { createApp } from 'vue';
import { createPinia } from 'pinia';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { Toast, Lazyload } from 'vant';
import 'vant/lib/index.css';

import './style.css';
import App from './App.vue';
import router from './router';

dayjs.locale('zh-cn');

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Toast);
app.use(Lazyload);

app.mount('#app');
