<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '展示自习室基础信息、位置、开放状态和开放时段。',
  '按日期和时段展示座位平面图，并标记空闲、已预约、维修和停用。',
  '提供座位图例与选中座位摘要，避免只靠颜色传达状态。',
  '将有效选择带入预约确认流程，最终可用性以服务端创建结果为准。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="学生服务 / 自习室"
    summary="详情页把抽象余量转换成可视化座位图，让学生确认具体座位位置后发起预约。"
    :responsibilities="responsibilities"
    status="详情页骨架已建立；开放时段、座位图和预约入口将在自习室与预约模块中接入。"
  />
</template>
