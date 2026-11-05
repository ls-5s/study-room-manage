<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '展示预约编号、自习室、座位、日期、时段和当前状态。',
  '按时间顺序呈现创建、签到、取消、失约或完成事件。',
  '在有效签到窗口内提供二维码扫描或核验码签到入口。',
  '针对无效、过期或自习室不匹配的签到结果提供明确说明。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="学生服务 / 预约"
    summary="预约详情页解释单笔预约为什么处于当前状态，并承载受时间窗口约束的签到动作。"
    :responsibilities="responsibilities"
    status="详情页骨架已建立；状态时间线、签到窗口和核验流程将在预约与签到模块中接入。"
  />
</template>
