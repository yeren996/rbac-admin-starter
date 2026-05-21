<script setup lang="ts">
import type { MenuRow, RoleRow } from '#/api';

import { onMounted, reactive, ref } from 'vue';

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
  Select,
  Space,
  Table,
  Tree,
} from 'ant-design-vue';

import {
  assignRoleMenusApi,
  createRoleApi,
  deleteRoleApi,
  getMenusApi,
  getRoleMenusApi,
  getRolesApi,
  updateRoleApi,
  updateRoleStatusApi,
} from '#/api';
import { hasPermission } from '#/utils/permission';

const loading = ref(false);
const rows = ref<RoleRow[]>([]);
const total = ref(0);
const query = reactive({
  code: '',
  name: '',
  page: 1,
  pageSize: 20,
  status: undefined as string | undefined,
});
const modalOpen = ref(false);
const editing = ref<null | RoleRow>(null);
const form = reactive<Record<string, any>>({
  code: '',
  description: '',
  name: '',
  sort: 0,
});
const menuOpen = ref(false);
const menuTree = ref<any[]>([]);
const checkedMenuIds = ref<string[]>([]);
const currentRole = ref<null | RoleRow>(null);

function toTree(items: MenuRow[]): any[] {
  return items.map((item) => ({
    children: item.children ? toTree(item.children) : undefined,
    key: item.id,
    title: `${item.title}${item.permission ? `（${item.permission}）` : ''}`,
  }));
}
async function load() {
  loading.value = true;
  try {
    const data = await getRolesApi(query);
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}
function openCreate() {
  editing.value = null;
  Object.assign(form, { code: '', description: '', name: '', sort: 0 });
  modalOpen.value = true;
}
function openEdit(row: RoleRow) {
  editing.value = row;
  Object.assign(form, row);
  modalOpen.value = true;
}
async function save() {
  await (editing.value
    ? updateRoleApi(editing.value.id, form)
    : createRoleApi(form));
  message.success('保存成功');
  modalOpen.value = false;
  await load();
}
function remove(row: RoleRow) {
  Modal.confirm({
    content: `确认删除角色 ${row.name}？`,
    onOk: async () => {
      await deleteRoleApi(row.id);
      message.success('删除成功');
      await load();
    },
    title: '删除确认',
  });
}
async function toggleStatus(row: RoleRow) {
  await updateRoleStatusApi(
    row.id,
    row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED',
  );
  message.success('状态已更新');
  await load();
}
async function openMenus(row: RoleRow) {
  currentRole.value = row;
  const [menus, ids] = await Promise.all([
    getMenusApi(),
    getRoleMenusApi(row.id),
  ]);
  menuTree.value = toTree(menus);
  checkedMenuIds.value = ids;
  menuOpen.value = true;
}
async function saveMenus() {
  if (!currentRole.value) return;
  await assignRoleMenusApi(currentRole.value.id, checkedMenuIds.value);
  message.success('授权成功');
  menuOpen.value = false;
}
onMounted(load);
</script>

<template>
  <Page content-class="rbac-page-content" title="角色管理">
    <Card class="rbac-table-card">
      <Form
        class="rbac-section-toolbar rbac-responsive-form"
        layout="inline"
        :model="query"
      >
        <FormItem label="编码">
          <Input v-model:value="query.code" allow-clear />
        </FormItem>
        <FormItem label="名称">
          <Input v-model:value="query.name" allow-clear />
        </FormItem>
        <FormItem label="状态">
          <Select
            v-model:value="query.status"
            allow-clear
            style="width: 120px"
            :options="[
              { label: '启用', value: 'ENABLED' },
              { label: '禁用', value: 'DISABLED' },
            ]"
          />
        </FormItem>
        <Space>
          <Button type="primary" @click="load">查询</Button
          ><Button
            v-if="hasPermission('system:role:create')"
            type="primary"
            @click="openCreate"
          >
            新增角色
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
        :columns="[
          { title: '编码', dataIndex: 'code' },
          { title: '名称', dataIndex: 'name' },
          { title: '状态', dataIndex: 'status' },
          { title: '系统角色', dataIndex: 'isSystem' },
          { title: '排序', dataIndex: 'sort' },
          { title: '操作', key: 'action' },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <Space v-if="column.key === 'action'">
            <Button
              v-if="hasPermission('system:role:update')"
              size="small"
              @click="openEdit(record as RoleRow)"
            >
              编辑
            </Button>
            <Button
              v-if="hasPermission('system:role:update')"
              size="small"
              @click="toggleStatus(record as RoleRow)"
            >
              {{ (record as RoleRow).status === 'ENABLED' ? '禁用' : '启用' }}
            </Button>
            <Button
              v-if="hasPermission('system:role:assign-menu')"
              size="small"
              @click="openMenus(record as RoleRow)"
            >
              分配菜单
            </Button>
            <Button
              v-if="hasPermission('system:role:delete')"
              danger
              size="small"
              @click="remove(record as RoleRow)"
            >
              删除
            </Button>
          </Space>
        </template>
      </Table>
    </Card>
    <Modal
      v-model:open="modalOpen"
      :title="editing ? '编辑角色' : '新增角色'"
      @ok="save"
    >
      <Form layout="vertical" :model="form">
        <FormItem label="编码">
          <Input v-model:value="form.code" :disabled="!!editing" />
        </FormItem>
        <FormItem label="名称"><Input v-model:value="form.name" /></FormItem>
        <FormItem label="描述">
          <Input v-model:value="form.description" />
        </FormItem>
        <FormItem label="排序">
          <InputNumber v-model:value="form.sort" class="w-full" />
        </FormItem>
      </Form>
    </Modal>
    <Modal
      v-model:open="menuOpen"
      width="640px"
      title="分配菜单权限"
      @ok="saveMenus"
    >
      <Tree
        v-model:checked-keys="checkedMenuIds"
        checkable
        default-expand-all
        :tree-data="menuTree"
      />
    </Modal>
  </Page>
</template>
