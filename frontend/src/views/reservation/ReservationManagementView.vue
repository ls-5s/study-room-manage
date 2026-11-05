<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '按学生学号、自习室、日期和预约状态查询预约记录。',
  '查看单条预约及状态日志，识别异常取消、失约和签到情况。',
  '在人工取消前要求填写原因并进行二次确认。',
  '从预约管理进入管理员签到码展示页面。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="管理后台 / 预约"
    summary="预约管理页帮助管理员定位异常预约并进行受控干预，不用于替代学生本人的正常预约流程。"
    :responsibilities="responsibilities"
    status="预约管理骨架已建立；多条件筛选、状态日志和人工取消将在预约模块中接入。"
  />
</template>
