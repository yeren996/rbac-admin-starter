<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import { reactive } from 'vue';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputPassword,
  TypographyText,
} from 'ant-design-vue';

import { useAuthStore } from '#/store';

const authStore = useAuthStore();

const form = reactive({
  password: 'Admin@123456',
  username: 'admin',
});

function submit() {
  return authStore.authLogin(form as Recordable<any>);
}
</script>

<template>
  <div class="flex min-h-full items-center justify-center p-6">
    <Card class="w-[420px] shadow-lg" title="RBAC Admin Starter">
      <Form layout="vertical" :model="form" @finish="submit">
        <FormItem
          label="用户名"
          name="username"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <Input
            v-model:value="form.username"
            autocomplete="username"
            placeholder="admin"
          />
        </FormItem>
        <FormItem
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <InputPassword
            v-model:value="form.password"
            autocomplete="current-password"
            placeholder="Admin@123456"
          />
        </FormItem>
        <Button
          block
          html-type="submit"
          :loading="authStore.loginLoading"
          type="primary"
        >
          登录
        </Button>
      </Form>
      <div
        class="mt-5 space-y-1 rounded bg-gray-50 p-3 text-sm leading-6 text-gray-600"
      >
        <TypographyText strong>默认账号</TypographyText>
        <div>管理员：admin / Admin@123456</div>
        <div>演示用户：demo / Demo@123456</div>
      </div>
    </Card>
  </div>
</template>
