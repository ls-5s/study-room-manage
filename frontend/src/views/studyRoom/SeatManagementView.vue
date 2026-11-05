<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '以网格形式展示指定自习室的座位布局与过道位置。',
  '批量生成座位并预览编号、数量和行列范围。',
  '修改座位编号、行列坐标、使用状态和维修说明。',
  '阻止重复编号或越界坐标，并保留有历史预约的座位记录。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="管理后台 / 自习室"
    summary="座位管理页用于建立可预约的物理资源结构，并维护维修或停用状态，不直接创建学生预约。"
    :responsibilities="responsibilities"
    status="座位管理骨架已建立；布局编辑、批量新增和状态维护将在自习室模块中接入。"
  />
</template>
