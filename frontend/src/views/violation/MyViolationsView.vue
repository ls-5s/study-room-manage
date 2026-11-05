<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '展示当前有效违约次数、触发阈值和是否处于预约限制期。',
  '列出每条违约的来源预约、发生时间和当前处理状态。',
  '区分有效与已撤销记录，并展示管理员撤销后的结果。',
  '说明限制截止时间，避免学生只能看到“当前不可预约”的笼统提示。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="学生服务 / 违约"
    summary="我的违约页让学生理解预约限制的原因、影响和恢复时间，并为后续预约约束提供可追踪依据。"
    :responsibilities="responsibilities"
    status="违约查询页骨架已建立；次数摘要、记录列表和限制期限将在违约模块中接入。"
  />
</template>
