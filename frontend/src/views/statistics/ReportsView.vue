<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '按日期范围、自习室和分组维度生成统计数据。',
  '以表格和图表解释预订、签到、失约和利用率趋势。',
  '确保图表、表格与导出文件使用同一组筛选条件和指标口径。',
  '导出当前结果时显示加载状态，并正确处理下载失败。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="管理后台 / 统计"
    summary="统计报表页用于较长时间范围的数据分析与文件导出，重点保证筛选条件、页面数值和导出内容一致。"
    :responsibilities="responsibilities"
    status="报表页面骨架已建立；趋势图、明细表和 CSV 导出将在统计模块中接入。"
  />
</template>
