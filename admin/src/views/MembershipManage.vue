<template>
  <GenericManage
    title="会员等级管理"
    api-base="/membership/levels"
    :columns="[
      { key: 'level', label: '等级', type: 'number' },
      { key: 'name', label: '名称' },
      { key: 'price', label: '月费(星石)', type: 'number' },
      { key: 'benefits', label: '权益描述', type: 'textarea' },
      { key: 'sortOrder', label: '排序', type: 'number' },
    ]"
  />
</template>
<script setup lang="ts">
import GenericManage from '@/components/GenericManage.vue'
</script>
