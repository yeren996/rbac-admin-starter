<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();
const router = useRouter();

/** 工作台能力卡片：只保留当前 RBAC 底座内的业务模块入口，避免模板推广链接。 */
const projectItems: WorkbenchProjectItem[] = [
  {
    color: '#2563eb',
    content: '维护后台账号、状态与角色绑定。',
    date: '持续维护',
    group: '系统管理',
    icon: 'carbon:user-role',
    title: '用户管理',
    url: '/system/user',
  },
  {
    color: '#14b8a6',
    content: '通过角色聚合权限，统一授权菜单与按钮。',
    date: '持续维护',
    group: '权限模型',
    icon: 'carbon:user-multiple',
    title: '角色管理',
    url: '/system/role',
  },
  {
    color: '#f59e0b',
    content: '配置动态路由、菜单层级与按钮权限码。',
    date: '持续维护',
    group: '权限模型',
    icon: 'carbon:menu',
    title: '菜单管理',
    url: '/system/menu',
  },
];

/** 快捷导航是站内路由集合，不打开外部网站，不承担广告位能力。 */
const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#2563eb',
    icon: 'ion:home-outline',
    title: '概览',
    url: '/dashboard',
  },
  {
    color: '#14b8a6',
    icon: 'ion:people-outline',
    title: '用户',
    url: '/system/user',
  },
  {
    color: '#f59e0b',
    icon: 'ion:key-outline',
    title: '角色',
    url: '/system/role',
  },
  {
    color: '#8b5cf6',
    icon: 'ion:layers-outline',
    title: '菜单',
    url: '/system/menu',
  },
  {
    color: '#ef4444',
    icon: 'ion:document-text-outline',
    title: '审计',
    url: '/system/audit-log',
  },
];

const todoItems = ref<WorkbenchTodoItem[]>([
  {
    completed: false,
    content: '检查新增角色是否只分配必要菜单，避免越权。',
    date: '今日',
    title: '复核角色授权',
  },
  {
    completed: true,
    content: '确认默认管理员和演示用户均可正常登录。',
    date: '今日',
    title: '登录链路验证',
  },
  {
    completed: false,
    content: '查看最近操作日志，定位异常接口访问或失败请求。',
    date: '本周',
    title: '审计日志巡检',
  },
  {
    completed: false,
    content: '补充业务模块菜单和按钮权限码，保持前后端一致。',
    date: '本周',
    title: '业务模块接入',
  },
]);

const trendItems: WorkbenchTrendItem[] = [
  {
    avatar: 'svg:avatar-1',
    content: '完成 <a>顶部栏通知</a> 与 <a>中英文切换</a> 接入',
    date: '刚刚',
    title: '系统',
  },
  {
    avatar: 'svg:avatar-2',
    content: '新增 <a>通知接口</a>，基于审计日志生成提醒',
    date: '1 小时前',
    title: '后端',
  },
  {
    avatar: 'svg:avatar-3',
    content: '清理模板推广入口，保留 RBAC 业务导航',
    date: '今天',
    title: '前端',
  },
  {
    avatar: 'svg:avatar-4',
    content: '建议按最小权限原则维护角色菜单',
    date: '本周',
    title: '安全',
  },
];

function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  if (!nav.url) return;
  router.push(nav.url).catch((error) => {
    console.error('Navigation failed:', error);
  });
}
</script>

<template>
  <div class="rbac-page-shell">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        早安，{{ userStore.userInfo?.realName }}，开始管理后台权限吧！
      </template>
      <template #description>
        当前系统提供用户、角色、菜单与审计日志等 RBAC 基础能力。
      </template>
    </WorkbenchHeader>

    <div class="rbac-workspace-grid">
      <div class="rbac-stack">
        <WorkbenchProject
          :items="projectItems"
          title="核心模块"
          @click="navTo"
        />
        <WorkbenchTrends :items="trendItems" title="系统动态" />
      </div>
      <div class="rbac-stack">
        <WorkbenchQuickNav
          :items="quickNavItems"
          title="快捷导航"
          @click="navTo"
        />
        <WorkbenchTodo :items="todoItems" title="待办事项" />
        <AnalysisChartCard title="访问来源">
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>
