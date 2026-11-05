<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '查询和维护自习室名称、位置、容量、说明与开放状态。',
  '配置自习室的每日开放时段，并区分启用、停用和已关闭状态。',
  '在停用或关闭前提示对已有预约和未来可用性的影响。',
  '进入指定自习室的座位管理页面，继续维护具体座位。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="管理后台 / 自习室"
    summary="自习室管理页供管理员维护可预约空间及其开放时段，是座位和预约数据成立的前置资源。"
    :responsibilities="responsibilities"
    status="管理页骨架已建立；资源列表、编辑表单和状态切换将在自习室模块中接入。"
  />
</template>
