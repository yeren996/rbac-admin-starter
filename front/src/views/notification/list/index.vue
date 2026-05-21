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
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  getNotificationDetailApi,
  getNotificationsApi,
  markNotificationReadApi,
} from '#/api';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const rows = ref<NotificationRow[]>([]);
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

const filteredRows = computed(() => {
  const keyword = String(query.keyword || '')
    .trim()
    .toLowerCase();
  return rows.value.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.title.toLowerCase().includes(keyword) ||
      item.message.toLowerCase().includes(keyword);
    const matchSource = !query.source || item.source === query.source;
    const matchStatus =
      query.isRead === undefined || String(item.isRead) === query.isRead;
    return matchKeyword && matchSource && matchStatus;
  });
});

const pagedRows = computed(() => {
  const start = (Number(query.page) - 1) * Number(query.pageSize);
  return filteredRows.value.slice(start, start + Number(query.pageSize));
});

function sourceLabel(source: NotificationRow['source']) {
  return (
    sourceOptions.value.find((item) => item.value === source)?.label ?? source
  );
}

async function load() {
  loading.value = true;
  try {
    rows.value = await getNotificationsApi();
  } finally {
    loading.value = false;
  }
}

async function openDetail(id: string) {
  detail.value = await getNotificationDetailApi(id);

  if (!detail.value.isRead) {
    await markNotificationReadApi(id);
    detail.value.isRead = true;
    const row = rows.value.find((item) => item.id === id);
    if (row) {
      row.isRead = true;
    }
  }
}

function search() {
  query.page = 1;
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
    :title="$t('page.notification.title')"
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
        </Space>
      </Form>

      <Table
        row-key="id"
        :loading="loading"
        :data-source="pagedRows"
        :scroll="{ x: 'max-content' }"
        :pagination="{
          current: query.page,
          pageSize: query.pageSize,
          total: filteredRows.length,
          onChange: (page: number, pageSize: number) => {
            query.page = page;
            query.pageSize = pageSize;
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
            <Button
              size="small"
              @click="openDetail((record as NotificationRow).id)"
            >
              {{ $t('page.notification.detail') }}
            </Button>
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
