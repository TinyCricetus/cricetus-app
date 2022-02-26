import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/home/HomeView.vue'
import ShutdownView from '../views/shutdown/ShutdownView.vue' 
import MusicHistoryView from '../views/music-history/MusicHistoryView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/shutdown',
    name: 'shutdown',
    component: ShutdownView
  },
  {
    path: '/history',
    name: 'history',
    component: MusicHistoryView
  }
  // {
  //   path: '/about',
  //   name: 'about',
  //   component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  // }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
