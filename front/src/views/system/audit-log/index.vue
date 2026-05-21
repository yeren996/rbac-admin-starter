<script setup lang="ts">
import type { AuditLogRow } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  DatePicker,
  Form,
  FormItem,
  Input,
  Modal,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import { getAuditLogsApi } from '#/api';

const loading = ref(false);
const rows = ref<AuditLogRow[]>([]);
const total = ref(0);
const detail = ref<AuditLogRow | null>(null);
const query = reactive<Record<string, any>>({
  actorUsername: '',
  module: '',
  method: undefined,
  page: 1,
  pageSize: 20,
  path: '',
  range: [],
});
async function load() {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      ...query,
      endAt: query.range?.[1]?.toISOString?.(),
      startAt: query.range?.[0]?.toISOString?.(),
    };
    delete params.range;
    const data = await getAuditLogsApi(params);
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>

<template>
  <Page content-class="rbac-page-content" title="操作日志">
    <Card class="rbac-table-card">
      <Form
        class="rbac-section-toolbar rbac-responsive-form"
        layout="inline"
        :model="query"
      >
        <FormItem label="操作人">
          <Input v-model:value="query.actorUsername" allow-clear />
        </FormItem>
        <FormItem label="模块">
          <Input v-model:value="query.module" allow-clear />
        </FormItem>
        <FormItem label="方法">
          <Select
            v-model:value="query.method"
            allow-clear
            style="width: 120px"
            :options="
              ['GET', 'POST', 'PATCH', 'DELETE'].map((value) => ({
                label: value,
                value,
              }))
            "
          />
        </FormItem>
        <FormItem label="路径">
          <Input v-model:value="query.path" allow-clear />
        </FormItem>
        <FormItem label="时间">
          <DatePicker.RangePicker v-model:value="query.range" />
        </FormItem>
        <Button type="primary" @click="load">查询</Button>
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
        :columns="[
          { title: '操作人', dataIndex: 'actorUsername' },
          { title: '模块', dataIndex: 'module' },
          { title: '动作', dataIndex: 'action' },
          { title: '方法', dataIndex: 'method' },
          { title: '路径', dataIndex: 'path' },
          { title: '状态', dataIndex: 'responseStatus' },
          { title: '耗时', dataIndex: 'durationMs' },
          { title: '时间', dataIndex: 'createdAt' },
          { title: '操作', key: 'actionBtn' },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <Space v-if="column.key === 'actionBtn'">
            <Button size="small" @click="detail = record as AuditLogRow">
              详情
            </Button>
          </Space>
        </template>
      </Table>
    </Card>
    <Modal
      :open="!!detail"
      title="日志详情"
      width="720px"
      @cancel="detail = null"
      @ok="detail = null"
    >
      <pre class="max-h-[420px] overflow-auto rounded bg-gray-50 p-3">{{
        JSON.stringify(detail, null, 2)
      }}</pre>
    </Modal>
  </Page>
</template>
