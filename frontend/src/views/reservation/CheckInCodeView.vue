<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '展示当前自习室短时有效的签到二维码和可见核验码。',
  '在签到码临近过期时自动刷新，并在离开页面后停止刷新。',
  '明确签到码所属自习室和有效时间，避免学生扫错入口。',
  '仅向管理员开放，不展示学生身份或预约明细。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="管理后台 / 预约"
    summary="签到码展示页为学生现场签到提供临时凭据，同时保证凭据只在指定自习室和短时窗口内有效。"
    :responsibilities="responsibilities"
    status="签到码页面骨架已建立；二维码生成、自动刷新和页面生命周期清理将在签到模块中接入。"
  />
</template>
