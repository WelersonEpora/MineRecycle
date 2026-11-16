import { createRouter, createWebHistory } from 'vue-router'
import { useSession } from '../stores/session.js'

const routes = [
  { path: '/', name: 'catalog', component: () => import('../views/CatalogView.vue') },
  { path: '/packages/:number(\\d+)', name: 'package', component: () => import('../views/PackageView.vue') },
  // O token vem no fragmento (#): /access#<token>.
  { path: '/access', name: 'access', component: () => import('../views/AccessView.vue') },
  { path: '/buyer', name: 'buyer', component: () => import('../views/BuyerView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  {
    path: '/seller',
    component: () => import('../views/seller/SellerLayout.vue'),
    meta: { seller: true },
    children: [
      { path: '', name: 'seller-packages', component: () => import('../views/seller/SellerPackagesView.vue') },
      { path: 'packages/:id', name: 'seller-package', component: () => import('../views/seller/PackageEditView.vue') },
      { path: 'links', name: 'seller-links', component: () => import('../views/seller/AccessLinksView.vue') },
      { path: 'settings', name: 'seller-settings', component: () => import('../views/seller/SettingsView.vue') },
      { path: 'users', name: 'seller-users', component: () => import('../views/seller/UsersView.vue'), meta: { admin: true } },
      { path: 'account', name: 'seller-account', component: () => import('../views/seller/AccountView.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved || (to.path !== from.path ? { top: 0 } : undefined)
})

router.beforeEach(async (to) => {
  const session = useSession()
  await session.load()
  if (to.matched.some((r) => r.meta.seller) && !session.state.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.matched.some((r) => r.meta.admin) && session.state.user?.role !== 'admin') {
    return { name: 'seller-packages' }
  }
  return true
})

export default router
