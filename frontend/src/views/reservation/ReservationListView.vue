<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '按待签到、已签到、已完成、已取消和已失约筛选本人预约。',
  '展示预约时间、自习室、座位号和当前状态。',
  '为待签到预约提供签到窗口说明和有效操作入口。',
  '保留分页与筛选条件，并根据状态限制取消或签到操作。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="学生服务 / 预约"
    summary="我的预约页帮助学生持续追踪每一笔预约从创建到签到、完成或取消的当前状态。"
    :responsibilities="responsibilities"
    status="预约列表骨架已建立；状态筛选、分页和操作按钮将在预约与签到模块中接入。"
  />
</template>
