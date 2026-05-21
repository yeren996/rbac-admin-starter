<script setup lang="ts">
import type { MenuRow } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Checkbox,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  TreeSelect,
} from 'ant-design-vue';

import {
  createMenuApi,
  deleteMenuApi,
  getMenusApi,
  updateMenuApi,
  updateMenuStatusApi,
} from '#/api';
import { hasPermission } from '#/utils/permission';

const rows = ref<MenuRow[]>([]);
const modalOpen = ref(false);
const editing = ref<MenuRow | null>(null);
const form = reactive<Record<string, any>>({
  component: '',
  hidden: false,
  icon: '',
  keepAlive: false,
  name: '',
  parentId: undefined,
  path: '',
  permission: '',
  redirect: '',
  sort: 0,
  title: '',
  type: 'MENU',
});
function toOptions(items: MenuRow[]): any[] {
  return items.map((item) => ({
    children: item.children ? toOptions(item.children) : undefined,
    title: item.title,
    value: item.id,
  }));
}
const treeOptions = computed(() => toOptions(rows.value));
async function load() {
  rows.value = await getMenusApi();
}
function openCreate(type = 'MENU', parentId?: string) {
  editing.value = null;
  Object.assign(form, {
    component: '',
    hidden: false,
    icon: '',
    keepAlive: false,
    name: '',
    parentId,
    path: '',
    permission: '',
    redirect: '',
    sort: 0,
    title: '',
    type,
  });
  modalOpen.value = true;
}
function openEdit(row: MenuRow) {
  editing.value = row;
  Object.assign(form, row);
  modalOpen.value = true;
}
async function save() {
  await (editing.value
    ? updateMenuApi(editing.value.id, form)
    : createMenuApi(form));
  message.success('保存成功');
  modalOpen.value = false;
  await load();
}
function remove(row: MenuRow) {
  Modal.confirm({
    content: `确认删除菜单 ${row.title}？`,
    onOk: async () => {
      await deleteMenuApi(row.id);
      message.success('删除成功');
      await load();
    },
    title: '删除确认',
  });
}
async function toggleStatus(row: MenuRow) {
  await updateMenuStatusApi(
    row.id,
    row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED',
  );
  message.success('状态已更新');
  await load();
}
onMounted(load);
</script>

<template>
  <Page content-class="rbac-page-content" title="菜单管理">
    <Card class="rbac-table-card">
      <div class="rbac-section-toolbar">
        <Button
          v-if="hasPermission('system:menu:create')"
          type="primary"
          @click="openCreate('DIRECTORY')"
        >
          新增目录
        </Button>
      </div>
      <Table
        row-key="id"
        :data-source="rows"
        :pagination="false"
        :scroll="{ x: 'max-content' }"
        :columns="[
          { title: '标题', dataIndex: 'title' },
          { title: '类型', dataIndex: 'type' },
          { title: '路由名', dataIndex: 'name' },
          { title: '路径', dataIndex: 'path' },
          { title: '组件', dataIndex: 'component' },
          { title: '权限码', dataIndex: 'permission' },
          { title: '状态', dataIndex: 'status' },
          { title: '排序', dataIndex: 'sort' },
          { title: '操作', key: 'action' },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <Space v-if="column.key === 'action'">
            <Button
              v-if="hasPermission('system:menu:create')"
              size="small"
              @click="openCreate('MENU', (record as MenuRow).id)"
            >
              加菜单
            </Button>
            <Button
              v-if="hasPermission('system:menu:create')"
              size="small"
              @click="openCreate('BUTTON', (record as MenuRow).id)"
            >
              加按钮
            </Button>
            <Button
              v-if="hasPermission('system:menu:update')"
              size="small"
              @click="openEdit(record as MenuRow)"
            >
              编辑
            </Button>
            <Button
              v-if="hasPermission('system:menu:update')"
              size="small"
              @click="toggleStatus(record as MenuRow)"
            >
              {{ (record as MenuRow).status === 'ENABLED' ? '禁用' : '启用' }}
            </Button>
            <Button
              v-if="hasPermission('system:menu:delete')"
              danger
              size="small"
              @click="remove(record as MenuRow)"
            >
              删除
            </Button>
          </Space>
        </template>
      </Table>
    </Card>
    <Modal
      v-model:open="modalOpen"
      width="720px"
      :title="editing ? '编辑菜单' : '新增菜单'"
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
        <FormItem label="类型">
          <Select
            v-model:value="form.type"
            :options="[
              { label: '目录', value: 'DIRECTORY' },
              { label: '菜单', value: 'MENU' },
              { label: '按钮', value: 'BUTTON' },
            ]"
          />
        </FormItem>
        <FormItem label="标题"><Input v-model:value="form.title" /></FormItem>
        <FormItem label="路由 name">
          <Input v-model:value="form.name" />
        </FormItem>
        <FormItem label="path"><Input v-model:value="form.path" /></FormItem>
        <FormItem label="component">
          <Input
            v-model:value="form.component"
            placeholder="/system/user/index"
          />
        </FormItem>
        <FormItem label="redirect">
          <Input v-model:value="form.redirect" />
        </FormItem>
        <FormItem label="icon"><Input v-model:value="form.icon" /></FormItem>
        <FormItem label="permission">
          <Input
            v-model:value="form.permission"
            placeholder="system:user:create"
          />
        </FormItem>
        <FormItem label="sort">
          <InputNumber v-model:value="form.sort" class="w-full" />
        </FormItem>
        <Space>
          <Checkbox v-model:checked="form.hidden">隐藏</Checkbox
          ><Checkbox v-model:checked="form.keepAlive">缓存</Checkbox>
        </Space>
      </Form>
    </Modal>
  </Page>
</template>
