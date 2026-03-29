import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/links/:tag?',
      name: 'links',
      component: () => import('@/views/LinksView.vue'),
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('@/views/TagsView.vue'),
    },
{
      path: '/help',
      name: 'help',
      component: () => import('@/views/HelpView.vue'),
      meta: { public: true },
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('@/views/ContactView.vue'),
      meta: { public: true },
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('@/views/PrivacyView.vue'),
      meta: { public: true },
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('@/views/TermsView.vue'),
      meta: { public: true },
    },
    {
      path: '/imprint',
      name: 'imprint',
      component: () => import('@/views/ImprintView.vue'),
      meta: { public: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('authToken')
  if (!to.meta?.public && !token) {
    return { name: 'login' }
  }
  if (to.name === 'login' && token) {
    return { name: 'links', params: { tag: 'portal' } }
  }
})

export default router
