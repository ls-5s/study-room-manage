<script setup lang="ts">
import FeatureOverview from '../../components/FeatureOverview.vue'

const responsibilities = [
  '使用学号、邮箱或手机号与密码验证学生或管理员身份。',
  '登录成功后按角色进入学生首页或管理员仪表盘。',
  '提交期间禁止重复操作，并清晰展示字段错误或统一登录错误。',
  '为后续会话恢复、密码错误限流和退出登录提供统一入口。',
] as const
</script>

<template>
  <FeatureOverview
    eyebrow="身份认证"
    summary="登录页负责确认访问者身份，并让不同角色进入各自可用的业务入口。账号验证与权限判断最终以服务端结果为准。"
    :responsibilities="responsibilities"
    status="登录页骨架已建立；账号表单、会话恢复和角色跳转将在认证模块中接入。"
  />
</template>
