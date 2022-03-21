import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import HomeComponent from '../views/home/home.component.vue'
import ShutdownComponent from '../views/shutdown/shutdown.component.vue' 
import MusicHistoryComponent from '../views/music-history/music-history.component.vue'
import MarkdownComponent from '../views/markdown/markdown.component.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeComponent
  },
  {
    path: '/shutdown',
    name: 'shutdown',
    component: ShutdownComponent
  },
  {
    path: '/history',
    name: 'history',
    component: MusicHistoryComponent
  },
  {
    path: '/markdown',
    name: 'markdown',
    component: MarkdownComponent
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
