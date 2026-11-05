<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '提交占座举报或使用问题，并在举报场景选择对应自习室和座位。',
  '按待处理、处理中、已解决和已驳回查看本人反馈。',
  '展示工单类型、资源位置、提交时间和最新处理状态。',
  '在详情中阅读管理员处理结果，同时保留用户已经填写的表单内容。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="学生服务 / 反馈"
    summary="反馈页为学生提供占座举报与问题上报渠道，并让学生能持续了解工单是否被处理以及最终结果。"
    :responsibilities="responsibilities"
    status="反馈页面骨架已建立；提交表单、工单列表和处理结果将在反馈模块中接入。"
  />
</template>
