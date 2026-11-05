<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '重新展示已选择的自习室、日期、开放时段和具体座位。',
  '提示预约规则、签到窗口与取消限制，让用户在提交前确认影响。',
  '提交期间禁用重复操作，并在冲突时提示座位可能已被他人预约。',
  '创建成功后展示预约编号、签到时间和预约详情入口。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="学生服务 / 预约"
    summary="预约确认页负责把已选资源转换为一次正式预约申请，并让用户在提交前理解时间与取消规则。"
    :responsibilities="responsibilities"
    status="确认页骨架已建立；选择摘要、提交动作和冲突反馈将在预约与签到模块中接入。"
  />
</template>
