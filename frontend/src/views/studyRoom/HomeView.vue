<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '以卡片展示开放自习室的名称、位置、状态和静态可用座位数。',
  '支持按名称或位置搜索，并在选择日期和时段后刷新动态余量。',
  '帮助学生在多个自习室之间比较开放情况并进入详情查看座位。',
  '为空结果、查询失败和重新加载提供明确反馈。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="学生服务 / 自习室"
    summary="首页帮助学生快速了解哪些自习室可以预约，并带着明确的日期和时段条件进入座位选择。"
    :responsibilities="responsibilities"
    status="首页骨架已建立；自习室列表、搜索条件和可用座位查询将在自习室模块中接入。"
  />
</template>
