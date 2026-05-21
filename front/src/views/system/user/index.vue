<script setup lang="ts">
import type { RoleRow, UserRow } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import {
  assignUserRolesApi,
  createUserApi,
  deleteUserApi,
  getRolesApi,
  getUsersApi,
  resetUserPasswordApi,
  updateUserApi,
  updateUserStatusApi,
} from '#/api';
import { hasPermission } from '#/utils/permission';

const loading = ref(false);
const rows = ref<UserRow[]>([]);
const total = ref(0);
const roles = ref<RoleRow[]>([]);
const query = reactive({
  page: 1,
  pageSize: 20,
  username: '',
  nickname: '',
  status: undefined as string | undefined,
});
const modalOpen = ref(false);
const editing = ref<null | UserRow>(null);
const form = reactive<Record<string, any>>({
  username: '',
  password: '',
  nickname: '',
  phone: '',
  email: '',
  roleIds: [],
});

const roleOptions = computed(() =>
  roles.value.map((role) => ({
    label: `${role.name}（${role.code}）`,
    value: role.id,
  })),
);
const canAssignRole = computed(() => hasPermission('system:user:assign-role'));
const canListRoles = computed(() => hasPermission('system:role:list'));

async function load() {
  loading.value = true;
  try {
    const data = await getUsersApi(query);
    rows.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}
async function loadMeta() {
  if (canListRoles.value) {
    const roleData = await getRolesApi({ pageSize: 100 });
    roles.value = roleData.items;
  }
}
function openCreate() {
  editing.value = null;
  Object.assign(form, {
    username: '',
    password: '',
    nickname: '',
    phone: '',
    email: '',
    roleIds: [],
  });
  modalOpen.value = true;
}
function openEdit(row: UserRow) {
  editing.value = row;
  Object.assign(form, {
    ...row,
    password: '',
    roleIds: row.userRoles?.map((item) => item.role.id) ?? [],
  });
  modalOpen.value = true;
}
async function save() {
  if (editing.value) {
    await updateUserApi(editing.value.id, form);
    if (canAssignRole.value) {
      await assignUserRolesApi(editing.value.id, form.roleIds ?? []);
    }
  } else {
    await createUserApi(form);
  }
  message.success('保存成功');
  modalOpen.value = false;
  await load();
}
async function remove(row: UserRow) {
  Modal.confirm({
    content: `确认删除用户 ${row.username}？`,
    onOk: async () => {
      await deleteUserApi(row.id);
      message.success('删除成功');
      await load();
    },
    title: '删除确认',
  });
}
async function toggleStatus(row: UserRow) {
  await updateUserStatusApi(
    row.id,
    row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED',
  );
  message.success('状态已更新');
  await load();
}
async function resetPassword(row: UserRow) {
  await resetUserPasswordApi(row.id, 'Change@123456');
  message.success('密码已重置为 Change@123456');
}

onMounted(async () => {
  await Promise.all([loadMeta(), load()]);
});
</script>

<template>
  <Page content-class="rbac-page-content" title="用户管理">
    <Card class="rbac-table-card">
      <Form
        class="rbac-section-toolbar rbac-responsive-form"
        layout="inline"
        :model="query"
      >
        <FormItem label="用户名">
          <Input v-model:value="query.username" allow-clear />
        </FormItem>
        <FormItem label="昵称">
          <Input v-model:value="query.nickname" allow-clear />
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
          <Button type="primary" @click="load">查询</Button>
          <Button
            v-if="hasPermission('system:user:create')"
            type="primary"
            @click="openCreate"
          >
            新增用户
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
          { title: '用户名', dataIndex: 'username' },
          { title: '昵称', dataIndex: 'nickname' },
          { title: '手机', dataIndex: 'phone' },
          { title: '状态', dataIndex: 'status' },
          { title: '操作', key: 'action' },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <Space v-if="column.key === 'action'">
            <Button
              v-if="hasPermission('system:user:update')"
              size="small"
              @click="openEdit(record as UserRow)"
            >
              编辑
            </Button>
            <Button
              v-if="hasPermission('system:user:update')"
              size="small"
              @click="toggleStatus(record as UserRow)"
            >
              {{ (record as UserRow).status === 'ENABLED' ? '禁用' : '启用' }}
            </Button>
            <Button
              v-if="hasPermission('system:user:reset-password')"
              size="small"
              @click="resetPassword(record as UserRow)"
            >
              重置密码
            </Button>
            <Button
              v-if="hasPermission('system:user:delete')"
              danger
              size="small"
              @click="remove(record as UserRow)"
            >
              删除
            </Button>
          </Space>
        </template>
      </Table>
    </Card>
    <Modal
      v-model:open="modalOpen"
      :title="editing ? '编辑用户' : '新增用户'"
      @ok="save"
    >
      <Form layout="vertical" :model="form">
        <FormItem label="用户名">
          <Input v-model:value="form.username" :disabled="!!editing" />
        </FormItem>
        <FormItem v-if="!editing" label="密码">
          <Input v-model:value="form.password" />
        </FormItem>
        <FormItem label="昵称">
          <Input v-model:value="form.nickname" />
        </FormItem>
        <FormItem label="手机"><Input v-model:value="form.phone" /></FormItem>
        <FormItem label="邮箱"><Input v-model:value="form.email" /></FormItem>
        <FormItem v-if="canAssignRole && canListRoles" label="角色">
          <Select
            v-model:value="form.roleIds"
            mode="multiple"
            :options="roleOptions"
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
