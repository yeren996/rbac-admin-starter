<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import type { NotificationRow } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { Descriptions, Modal } from 'ant-design-vue';

import {
  clearNotificationsApi,
  getNotificationDetailApi,
  getNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  removeNotificationApi,
} from '#/api';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();

/**
 * 顶部栏通知数据。
 * 数据从后端 `/notifications` 获取，避免继续使用模板内置的演示/推广消息。
 */
const notifications = ref<NotificationItem[]>([]);
const notificationDetail = ref<NotificationRow | null>(null);

const showDot = computed(() =>
  notifications.value.some((item) => !item.isRead),
);

/** 用户下拉菜单仅保留业务相关入口，移除外部文档/社区等模板推广链接。 */
const menus = computed(() => [
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: 'lucide:user',
    text: $t('page.auth.profile'),
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar || preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

async function loadNotifications() {
  notifications.value = await getNotificationsApi();
}

async function handleNoticeClear() {
  await clearNotificationsApi();
  notifications.value = [];
}

async function markRead(id: number | string) {
  await markNotificationReadApi(String(id));
  const item = notifications.value.find((item) => item.id === id);
  if (item) {
    item.isRead = true;
  }
}

async function remove(id: number | string) {
  await removeNotificationApi(String(id));
  notifications.value = notifications.value.filter((item) => item.id !== id);
}

async function handleMakeAll() {
  await markAllNotificationsReadApi();
  notifications.value.forEach((item) => (item.isRead = true));
}

function viewAll() {
  router.push('/notifications');
}

function notificationSourceLabel(source?: NotificationRow['source']) {
  const map = {
    audit: 'page.notification.sourceAudit',
    security: 'page.notification.sourceSecurity',
    system: 'page.notification.sourceSystem',
  } as const;
  return source ? $t(map[source]) : '';
}

async function handleClick(item: NotificationItem) {
  if (item.id && !item.isRead) {
    await markRead(item.id);
  }
  if (item.id) {
    /**
     * 顶部栏单击消息应优先展示详情，而不是直接跳走。
     * 详情来自后端实时读模型，可展示完整 message、来源和扩展 detail。
     */
    notificationDetail.value = await getNotificationDetailApi(String(item.id));
  }
}

function scheduleNotificationsLoad() {
  if (typeof window === 'undefined') {
    void loadNotifications();
    return;
  }

  const runWhenIdle = window.requestIdleCallback;
  if (typeof runWhenIdle === 'function') {
    runWhenIdle(() => void loadNotifications(), { timeout: 2000 });
    return;
  }

  globalThis.setTimeout(() => void loadNotifications(), 0);
}

onMounted(scheduleNotificationsLoad);

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
    isDark: isDark.value,
  }),
  async ({ enable, content, isDark: isDarkValue }) => {
    if (enable) {
      const watermarkColor = isDarkValue
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)';

      await updateWatermark({
        advancedStyle: {
          colorStops: [
            {
              color: watermarkColor,
              offset: 0,
            },
            {
              color: watermarkColor,
              offset: 1,
            },
          ],
          type: 'linear',
        },
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :description="userStore.userInfo?.username"
        :menus
        :text="userStore.userInfo?.realName"
        @logout="handleLogout"
        @clear-preferences-and-logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @read="(item) => item.id && markRead(item.id)"
        @remove="(item) => item.id && remove(item.id)"
        @make-all="handleMakeAll"
        @on-click="handleClick"
        @view-all="viewAll"
      />
      <Modal
        :open="!!notificationDetail"
        :title="$t('page.notification.detailTitle')"
        width="680px"
        @cancel="notificationDetail = null"
        @ok="notificationDetail = null"
      >
        <Descriptions
          v-if="notificationDetail"
          bordered
          :column="1"
          size="small"
        >
          <Descriptions.Item :label="$t('page.notification.title')">
            {{ notificationDetail.title }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('page.notification.source')">
            {{ notificationSourceLabel(notificationDetail.source) }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('page.notification.status')">
            {{
              notificationDetail.isRead
                ? $t('page.notification.read')
                : $t('page.notification.unread')
            }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('page.notification.time')">
            {{ notificationDetail.date }}
          </Descriptions.Item>
          <Descriptions.Item :label="$t('page.notification.content')">
            {{ notificationDetail.message }}
          </Descriptions.Item>
          <Descriptions.Item
            v-if="notificationDetail.detail"
            :label="$t('page.notification.extra')"
          >
            <pre class="max-h-[260px] overflow-auto rounded bg-gray-50 p-3">{{
              JSON.stringify(notificationDetail.detail, null, 2)
            }}</pre>
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
