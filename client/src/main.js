import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

// 引入vue-router
import router from './router/index.js'
// 引入vuex仓库
import store from './store/index.js'
// 按需引入elementUI
import "./utils/auto-import-elementUI.js"
import 'element-ui/lib/theme-chalk/index.css';

new Vue({
    router,
    store,
    render: h => h(App),
}).$mount('#app')
