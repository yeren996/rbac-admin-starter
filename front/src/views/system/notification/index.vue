<script setup lang="ts">
import type { NotificationRow } from '#/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Descriptions,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  clearSystemNotificationsApi,
  getNotificationPageApi,
  getSystemNotificationDetailApi,
  markAllSystemNotificationsReadApi,
  markSystemNotificationReadApi,
  removeSystemNotificationApi,
} from '#/api';
import { $t } from '#/locales';
import { hasPermission } from '#/utils/permission';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const rows = ref<NotificationRow[]>([]);
const total = ref(0);
const detail = ref<NotificationRow | null>(null);

const query = reactive<Record<string, any>>({
  isRead: undefined,
  keyword: '',
  page: 1,
  pageSize: 20,
  source: undefined,
});

const sourceOptions = computed(() => [
  { label: $t('page.notification.sourceSystem'), value: 'system' },
  { label: $t('page.notification.sourceSecurity'), value: 'security' },
  { label: $t('page.notification.sourceAudit'), value: 'audit' },
]);

const statusOptions = computed(() => [
  { label: $t('page.notification.unread'), value: 'false' },
  { label: $t('page.notification.read'), value: 'true' },
]);

const tableColumns = computed(() => [
  { title: $t('page.notification.title'), dataIndex: 'title' },
  { title: $t('page.notification.source'), dataIndex: 'source' },
  { title: $t('page.notification.status'), dataIndex: 'isRead' },
  { title: $t('page.notification.content'), dataIndex: 'message' },
  { title: $t('page.notification.time'), dataIndex: 'date' },
  { title: $t('page.notification.action'), key: 'action' },
]);

function sourceLabel(source: NotificationRow['source']) {
  return (
    sourceOptions.value.find((item) => item.value === source)?.label ?? source
  );
}

async function load() {
  loading.value = true;
  try {
    const data = await getNotificationPageApi(query);
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

async function openDetail(id: string) {
  detail.value = await getSystemNotificationDetailApi(id);
  /**
   * 查看详情即代表用户已经阅读完整内容，因此同步标记已读并刷新列表状态。
   * 这里不依赖前端本地改值，避免顶部栏和管理页状态不一致。
   */
  if (!detail.value.isRead && hasPermission('system:notification:update')) {
    await markSystemNotificationReadApi(id);
    detail.value.isRead = true;
    await load();
  }
}

async function markRead(row: NotificationRow) {
  await markSystemNotificationReadApi(row.id);
  message.success($t('page.notification.markReadSuccess'));
  await load();
}

async function markAllRead() {
  await markAllSystemNotificationsReadApi();
  message.success($t('page.notification.markReadSuccess'));
  await load();
}

function remove(row: NotificationRow) {
  Modal.confirm({
    content: $t('page.notification.deleteConfirm', { title: row.title }),
    onOk: async () => {
      await removeSystemNotificationApi(row.id);
      message.success($t('page.notification.deleteSuccess'));
      await load();
    },
    title: $t('page.notification.delete'),
  });
}

function clearAll() {
  Modal.confirm({
    content: $t('page.notification.clearConfirm'),
    onOk: async () => {
      await clearSystemNotificationsApi();
      message.success($t('page.notification.clearSuccess'));
      await load();
    },
    title: $t('page.notification.clear'),
  });
}

function search() {
  query.page = 1;
  void load();
}

function closeDetail() {
  detail.value = null;
  const nextQuery = { ...route.query };
  delete nextQuery.id;
  void router.replace({ path: route.path, query: nextQuery });
}

onMounted(async () => {
  await load();
  const id = typeof route.query.id === 'string' ? route.query.id : '';
  if (id) {
    await openDetail(id);
  }
});

watch(
  () => route.query.id,
  async (id) => {
    if (typeof id === 'string' && id) {
      await openDetail(id);
    }
  },
);
</script>

<template>
  <Page
    content-class="rbac-page-content"
    :title="$t('page.notification.managementTitle')"
  >
    <Card class="rbac-table-card">
      <Form
        class="rbac-section-toolbar rbac-responsive-form"
        layout="inline"
        :model="query"
      >
        <FormItem :label="$t('page.notification.keyword')">
          <Input
            v-model:value="query.keyword"
            allow-clear
            :placeholder="$t('page.notification.keywordPlaceholder')"
          />
        </FormItem>
        <FormItem :label="$t('page.notification.source')">
          <Select
            v-model:value="query.source"
            allow-clear
            style="width: 140px"
            :options="sourceOptions"
          />
        </FormItem>
        <FormItem :label="$t('page.notification.status')">
          <Select
            v-model:value="query.isRead"
            allow-clear
            style="width: 120px"
            :options="statusOptions"
          />
        </FormItem>
        <Space>
          <Button type="primary" @click="search">
            {{ $t('common.query') }}
          </Button>
          <Button
            v-if="hasPermission('system:notification:update')"
            @click="markAllRead"
          >
            {{ $t('page.notification.markAllRead') }}
          </Button>
          <Button
            v-if="hasPermission('system:notification:delete')"
            danger
            @click="clearAll"
          >
            {{ $t('page.notification.clear') }}
          </Button>
        </Space>
      </Form>

      <Table
        row-key="id"
        :loading="loading"
        :data-source="rows"
        :scroll="{ x: 'max-content' }"
        :pagination="{
          current: query.page,
          pageSize: query.pageSize,
          total,
          onChange: (page: number, pageSize: number) => {
            query.page = page;
            query.pageSize = pageSize;
            load();
          },
        }"
        :columns="tableColumns"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'source'">
            <Tag>{{ sourceLabel((record as NotificationRow).source) }}</Tag>
          </template>
          <template v-else-if="column.dataIndex === 'isRead'">
            <Tag :color="(record as NotificationRow).isRead ? 'green' : 'red'">
              {{
                (record as NotificationRow).isRead
                  ? $t('page.notification.read')
                  : $t('page.notification.unread')
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button
                size="small"
                @click="openDetail((record as NotificationRow).id)"
              >
                {{ $t('page.notification.detail') }}
              </Button>
              <Button
                v-if="
                  !(record as NotificationRow).isRead &&
                  hasPermission('system:notification:update')
                "
                size="small"
                @click="markRead(record as NotificationRow)"
              >
                {{ $t('page.notification.markRead') }}
              </Button>
              <Button
                v-if="hasPermission('system:notification:delete')"
                danger
                size="small"
                @click="remove(record as NotificationRow)"
              >
                {{ $t('page.notification.delete') }}
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      :open="!!detail"
      :title="$t('page.notification.detailTitle')"
      width="720px"
      @cancel="closeDetail"
      @ok="closeDetail"
    >
      <Descriptions v-if="detail" bordered :column="1" size="small">
        <Descriptions.Item :label="$t('page.notification.title')">
          {{ detail.title }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('page.notification.source')">
          {{ sourceLabel(detail.source) }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('page.notification.status')">
          {{
            detail.isRead
              ? $t('page.notification.read')
              : $t('page.notification.unread')
          }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('page.notification.time')">
          {{ detail.date }}
        </Descriptions.Item>
        <Descriptions.Item :label="$t('page.notification.content')">
          {{ detail.message }}
        </Descriptions.Item>
        <Descriptions.Item
          v-if="detail.detail"
          :label="$t('page.notification.extra')"
        >
          <pre class="max-h-[360px] overflow-auto rounded bg-gray-50 p-3">{{
            JSON.stringify(detail.detail, null, 2)
          }}</pre>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  </Page>
</template>
