<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '按选定日期汇总今日预约量、签到率、失约率和座位利用率。',
  '展示预约趋势、签到与失约比例以及自习室利用排行。',
  '为每项指标补充口径说明和最近更新时间。',
  '无数据时明确显示空状态，不绘制具有误导性的 0 值趋势。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="管理后台 / 统计"
    summary="管理仪表盘把当天运行情况压缩成可比较的指标，帮助管理员发现空置、失约或资源紧张等趋势。"
    :responsibilities="responsibilities"
    status="仪表盘骨架已建立；指标卡片、统计图表和日期筛选将在统计模块中接入。"
  />
</template>
