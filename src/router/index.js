import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    // ===== 收藏夹路由 =====
    {
        path: '/favorites',
        name: 'Favorites',
        component: () => import('@/views/Favorites.vue'),
        meta: { requiresAuth: true },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;