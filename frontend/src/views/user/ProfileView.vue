<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '展示学号、账号、角色、昵称、联系方式和账号状态。',
  '提供个人资料编辑入口，并区分可修改字段与只读身份字段。',
  '提供修改密码流程，要求验证当前密码并处理会话失效。',
  '汇总当前违约次数和预约限制期限，并给出可追踪的查看入口。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="账号与资料"
    summary="个人中心是学生管理账号信息和了解自身预约状态的集中入口，不承担自习室或预约业务的管理职责。"
    :responsibilities="responsibilities"
    status="个人中心骨架已建立；资料读取、编辑表单和密码修改将在认证与用户模块中接入。"
  />
</template>
