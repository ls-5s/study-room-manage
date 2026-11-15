<script setup lang="ts">
import { shallowRef, watch } from 'vue'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  title: string
  message: string
  confirmLabel: string
  busy: boolean
  tone: 'primary' | 'danger'
}>()
const emit = defineEmits<{
  confirm: [result: string]
}>()

const draft = shallowRef('')
const error = shallowRef('')

watch(open, (visible) => {
  if (!visible) return
  draft.value = ''
  error.value = ''
})

function submit() {
  const result = draft.value.trim()
  if (result.length < 2 || result.length > 1000) {
    error.value = '处理结果需为 2-1000 个字符'
    return
  }
  error.value = ''
  emit('confirm', result)
}
</script>

<template>
  <el-dialog
    v-model="open"
    :title="props.title"
    width="min(520px, calc(100vw - 32px))"
    :close-on-click-modal="!props.busy"
    :close-on-press-escape="!props.busy"
    :show-close="!props.busy"
    destroy-on-close
  >
    <p class="dialog-message">{{ props.message }}</p>
    <label class="result-label" for="feedback-result">处理结果</label>
    <el-input
      id="feedback-result"
      v-model="draft"
      type="textarea"
      :rows="5"
      maxlength="1000"
      show-word-limit
      placeholder="说明核实情况和最终处理结果"
      :disabled="props.busy"
      :aria-invalid="Boolean(error)"
    />
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>

    <template #footer>
      <el-button :disabled="props.busy" @click="open = false">取消</el-button>
      <el-button :type="props.tone" :loading="props.busy" :disabled="props.busy" @click="submit">
        {{ props.confirmLabel }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-message {
  margin: 0 0 16px;
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.7;
}

.result-label {
  display: block;
  margin-bottom: 8px;
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 650;
}

.field-error {
  margin: 7px 0 0;
  color: var(--status-bad);
  font-size: 0.76rem;
}
</style>
