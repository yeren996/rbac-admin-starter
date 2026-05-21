<script lang="ts" setup>
import { useTemplateRef } from 'vue';

import { Settings } from '@vben/icons';

import { VbenIconButton } from '@vben-core/shadcn-ui';

import Preferences from './preferences.vue';

const emit = defineEmits<{ clearPreferencesAndLogout: [] }>();

const refPreferences =
  useTemplateRef<InstanceType<typeof Preferences>>('refPreferences');

function clearPreferencesAndLogout() {
  emit('clearPreferencesAndLogout');
}

function handleOpenSettings() {
  refPreferences.value?.open();
}
</script>
<template>
  <Preferences
    ref="refPreferences"
    @clear-preferences-and-logout="clearPreferencesAndLogout"
  >
    <VbenIconButton
      class="hover:animate-[shrink_0.3s_ease-in-out]"
      @click="handleOpenSettings"
    >
      <Settings class="size-4 text-foreground" />
    </VbenIconButton>
  </Preferences>
</template>
