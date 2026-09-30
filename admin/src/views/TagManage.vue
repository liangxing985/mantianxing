<template>
  <GenericManage
    title="标签管理"
    api-base="/tag"
    :columns="[
      { key: 'name', label: '标签名称' },
      { key: 'category', label: '分类(voice/skill/style)' },
      { key: 'icon', label: '图标URL' },
      { key: 'sortOrder', label: '排序', type: 'number' },
    ]"
  />
</template>
<!--
  标签管理页面：技能/声音标签列表、新增/编辑/删除
-->
<script setup lang="ts">
import GenericManage from '@/components/GenericManage.vue'
</script>
