<script setup lang="ts">
import type { AuditLogRow } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Col, Row, Table } from 'ant-design-vue';

import { getDashboardOverviewApi } from '#/api';

const loading = ref(false);
const stats = ref({
  departmentCount: 0,
  menuCount: 0,
  roleCount: 0,
  userCount: 0,
});
const logs = ref<AuditLogRow[]>([]);

async function load() {
  loading.value = true;
  try {
    const data = await getDashboardOverviewApi();
    stats.value = data;
    logs.value = data.recentLogs;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page
    content-class="rbac-page-content"
    description="系统用户、角色、菜单和部门总览"
    title="Dashboard"
  >
    <Row :gutter="[16, 16]">
      <Col :lg="6" :sm="12" :xs="24">
        <Card :loading="loading" title="用户数">
          <div class="text-3xl font-semibold">{{ stats.userCount }}</div>
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card :loading="loading" title="角色数">
          <div class="text-3xl font-semibold">{{ stats.roleCount }}</div>
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card :loading="loading" title="菜单数">
          <div class="text-3xl font-semibold">{{ stats.menuCount }}</div>
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card :loading="loading" title="部门数">
          <div class="text-3xl font-semibold">
            {{ stats.departmentCount }}
          </div>
        </Card>
      </Col>
    </Row>
    <Card class="rbac-table-card" title="最近操作日志">
      <Table
        row-key="id"
        :data-source="logs"
        :pagination="false"
        :scroll="{ x: 'max-content' }"
        :columns="[
          { title: '操作人', dataIndex: 'actorUsername' },
          { title: '模块', dataIndex: 'module' },
          { title: '动作', dataIndex: 'action' },
          { title: '路径', dataIndex: 'path' },
          { title: '时间', dataIndex: 'createdAt' },
        ]"
      />
    </Card>
  </Page>
</template>
