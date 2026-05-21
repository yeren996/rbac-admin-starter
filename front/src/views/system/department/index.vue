<script setup lang="ts">
import type { DepartmentRow } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Table,
  TreeSelect,
} from 'ant-design-vue';

import {
  createDepartmentApi,
  deleteDepartmentApi,
  getDepartmentsApi,
  updateDepartmentApi,
  updateDepartmentStatusApi,
} from '#/api';
import { hasPermission } from '#/utils/permission';

const rows = ref<DepartmentRow[]>([]);
const modalOpen = ref(false);
const editing = ref<DepartmentRow | null>(null);
const form = reactive<Record<string, any>>({
  code: '',
  email: '',
  leader: '',
  name: '',
  parentId: undefined,
  phone: '',
  sort: 0,
});
function toOptions(items: DepartmentRow[]): any[] {
  return items.map((item) => ({
    children: item.children ? toOptions(item.children) : undefined,
    title: item.name,
    value: item.id,
  }));
}
const treeOptions = computed(() => toOptions(rows.value));
async function load() {
  rows.value = await getDepartmentsApi();
}
function openCreate(parentId?: string) {
  editing.value = null;
  Object.assign(form, {
    code: '',
    email: '',
    leader: '',
    name: '',
    parentId,
    phone: '',
    sort: 0,
  });
  modalOpen.value = true;
}
function openEdit(row: DepartmentRow) {
  editing.value = row;
  Object.assign(form, row);
  modalOpen.value = true;
}
async function save() {
  await (editing.value
    ? updateDepartmentApi(editing.value.id, form)
    : createDepartmentApi(form));
  message.success('保存成功');
  modalOpen.value = false;
  await load();
}
function remove(row: DepartmentRow) {
  Modal.confirm({
    content: `确认删除部门 ${row.name}？`,
    onOk: async () => {
      await deleteDepartmentApi(row.id);
      message.success('删除成功');
      await load();
    },
    title: '删除确认',
  });
}
async function toggleStatus(row: DepartmentRow) {
  await updateDepartmentStatusApi(
    row.id,
    row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED',
  );
  message.success('状态已更新');
  await load();
}
onMounted(load);
</script>

<template>
  <Page content-class="rbac-page-content" title="部门管理">
    <Card class="rbac-table-card">
      <div class="rbac-section-toolbar">
        <Button
          v-if="hasPermission('system:department:create')"
          type="primary"
          @click="openCreate()"
        >
          新增部门
        </Button>
      </div>
      <Table
        row-key="id"
        :data-source="rows"
        :pagination="false"
        :scroll="{ x: 'max-content' }"
        :columns="[
          { title: '部门名称', dataIndex: 'name' },
          { title: '编码', dataIndex: 'code' },
          { title: '负责人', dataIndex: 'leader' },
          { title: '电话', dataIndex: 'phone' },
          { title: '状态', dataIndex: 'status' },
          { title: '排序', dataIndex: 'sort' },
          { title: '操作', key: 'action' },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <Space v-if="column.key === 'action'">
            <Button
              v-if="hasPermission('system:department:create')"
              size="small"
              @click="openCreate((record as DepartmentRow).id)"
            >
              新增下级
            </Button>
            <Button
              v-if="hasPermission('system:department:update')"
              size="small"
              @click="openEdit(record as DepartmentRow)"
            >
              编辑
            </Button>
            <Button
              v-if="hasPermission('system:department:update')"
              size="small"
              @click="toggleStatus(record as DepartmentRow)"
            >
              {{
                (record as DepartmentRow).status === 'ENABLED' ? '禁用' : '启用'
              }}
            </Button>
            <Button
              v-if="hasPermission('system:department:delete')"
              danger
              size="small"
              @click="remove(record as DepartmentRow)"
            >
              删除
            </Button>
          </Space>
        </template>
      </Table>
    </Card>
    <Modal
      v-model:open="modalOpen"
      :title="editing ? '编辑部门' : '新增部门'"
      @ok="save"
    >
      <Form layout="vertical" :model="form">
        <FormItem label="父级">
          <TreeSelect
            v-model:value="form.parentId"
            allow-clear
            :tree-data="treeOptions"
          />
        </FormItem>
        <FormItem label="名称"><Input v-model:value="form.name" /></FormItem>
        <FormItem label="编码">
          <Input v-model:value="form.code" :disabled="!!editing" />
        </FormItem>
        <FormItem label="负责人">
          <Input v-model:value="form.leader" />
        </FormItem>
        <FormItem label="电话"><Input v-model:value="form.phone" /></FormItem>
        <FormItem label="邮箱"><Input v-model:value="form.email" /></FormItem>
        <FormItem label="排序">
          <InputNumber v-model:value="form.sort" class="w-full" />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
