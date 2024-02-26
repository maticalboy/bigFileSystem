import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)


const router = new VueRouter({
    mode: 'history',
    routes: [
        { path: '/', redirect: '/bigFile' },
        { path: '/bigFile', component: () => import('@/components/BigFile.vue') },
    ]
})
export default router