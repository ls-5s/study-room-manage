<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '配置触发预约限制的违约次数阈值和限制天数。',
  '按日期、学生和状态查询有效或已撤销的违约记录。',
  '核对违约来源预约和发生时间，避免误判正常取消。',
  '撤销违约时强制填写原因，并同步更新学生的限制状态。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="管理后台 / 违约"
    summary="违约管理页用于维护公平、可解释的预约限制规则，并处理确实需要人工撤销的记录。"
    :responsibilities="responsibilities"
    status="违约管理骨架已建立；规则配置、记录核验和撤销流程将在违约模块中接入。"
  />
</template>
