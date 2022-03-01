import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/home/home-view.vue'
import ShutdownView from '../views/shutdown/shutdown-view.vue' 
import MusicHistoryView from '../views/music-history/music-history-view.vue'
import TextBusView from '../views/textbus/textbus-view.vue'

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
  },
  {
    path: '/textbus',
    name: 'textbus',
    component: TextBusView
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
