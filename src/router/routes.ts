import type { RouteRecordRaw } from 'vue-router'

import { ROUTE_NAMES } from '@/router/route-names'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: ROUTE_NAMES.home,
    component: () => import('@/views/LegacyTodoAppView.vue'),
  },
]
