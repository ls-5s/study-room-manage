<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '按状态、类型、自习室、日期和关键词筛选反馈工单。',
  '查看来源、原始描述和状态变化时间线，不修改学生原始内容。',
  '按当前状态执行开始处理、标记解决或驳回操作。',
  '解决或驳回时强制填写处理结果，并防止重复提交。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="管理后台 / 反馈"
    summary="反馈处理页帮助管理员核实学生举报与问题并留下可追踪的处理结果，不承担即时聊天职责。"
    :responsibilities="responsibilities"
    status="反馈处理骨架已建立；工单筛选、详情抽屉和状态操作将在反馈模块中接入。"
  />
</template>
