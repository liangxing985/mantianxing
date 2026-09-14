<template>
  <GenericManage
    title="礼物管理"
    api-base="/gift"
    :columns="[
      { key: 'name', label: '礼物名称' },
      { key: 'icon', label: '图标URL' },
      { key: 'price', label: '价格(星石)', type: 'number' },
      { key: 'category', label: '分类(normal/luxury/special)' },
      { key: 'sortOrder', label: '排序', type: 'number' },
    ]"
  />
</template>
<script setup lang="ts">
import GenericManage from '@/components/GenericManage.vue'
</script>
