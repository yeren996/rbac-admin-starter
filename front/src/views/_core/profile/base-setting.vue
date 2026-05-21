<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { getUserInfoApi, updateProfileApi } from '#/api';

const profileBaseSettingRef = ref();

const formSchema = computed((): VbenFormSchema[] => [
  { component: 'Input', fieldName: 'realName', label: '昵称' },
  {
    component: 'Input',
    componentProps: { disabled: true },
    fieldName: 'username',
    label: '用户名',
  },
]);

onMounted(async () => {
  const data = await getUserInfoApi();
  profileBaseSettingRef.value?.getFormApi().setValues(data);
});

async function handleSubmit(values: Record<string, any>) {
  await updateProfileApi({ nickname: values.realName });
  message.success('个人资料已更新');
}
</script>
<template>
  <ProfileBaseSetting
    ref="profileBaseSettingRef"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
