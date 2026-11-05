<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '收集学号、用户名、显示名称、邮箱和密码等学生账号资料。',
  '在提交前检查密码长度、确认密码一致性和必填字段。',
  '说明账号用途、隐私边界和用户协议，避免默认替用户做出授权选择。',
  '注册成功后进入登录流程，不在资料尚未验证时直接建立会话。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="身份认证"
    summary="注册页用于创建校内学生账号，是进入自习室预约、签到和反馈服务的起点。管理员账号不由公开注册页创建。"
    :responsibilities="responsibilities"
    status="注册页骨架已建立；资料表单、校验规则和账号创建接口将在认证模块中接入。"
  />
</template>
