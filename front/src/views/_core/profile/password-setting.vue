<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { changePasswordApi } from '#/api';

const formSchema = computed((): VbenFormSchema[] => [
  {
    component: 'VbenInputPassword',
    componentProps: { placeholder: '请输入旧密码' },
    fieldName: 'oldPassword',
    label: '旧密码',
  },
  {
    component: 'VbenInputPassword',
    componentProps: { passwordStrength: true, placeholder: '请输入新密码' },
    fieldName: 'newPassword',
    label: '新密码',
  },
  {
    component: 'VbenInputPassword',
    componentProps: { passwordStrength: true, placeholder: '请再次输入新密码' },
    dependencies: {
      rules(values) {
        return z
          .string({ required_error: '请再次输入新密码' })
          .min(1, { message: '请再次输入新密码' })
          .refine((value) => value === values.newPassword, {
            message: '两次输入的密码不一致',
          });
      },
      triggerFields: ['newPassword'],
    },
    fieldName: 'confirmPassword',
    label: '确认密码',
  },
]);

async function handleSubmit(values: Record<string, any>) {
  await changePasswordApi({
    newPassword: values.newPassword,
    oldPassword: values.oldPassword,
  });
  message.success('密码修改成功');
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-1/3"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
