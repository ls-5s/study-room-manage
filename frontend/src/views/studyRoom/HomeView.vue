<script setup lang="ts">
import { RefreshRight, Search } from '@element-plus/icons-vue'
import { computed, onBeforeUnmount, onMounted, reactive, shallowRef } from 'vue'
import { getStudyRooms } from '../../api/study-room'
import RoomCard from '../../components/study-room/RoomCard.vue'
import type { StudyRoomListQuery, StudyRoomSummary } from '../../types/study-room'
import { RequestError } from '../../utils/request'
import { addDays, businessToday } from '../../utils/study-room'

const filters = reactive({
  keyword: '',
  date: '',
  startTime: '',
  endTime: '',
  page: 1,
  pageSize: 9,
})
const rooms = shallowRef<StudyRoomSummary[]>([])
const total = shallowRef(0)
const loading = shallowRef(false)
const error = shallowRef('')
const filterError = shallowRef('')
let controller: AbortController | null = null

const today = businessToday()
const lastDate = addDays(today, 6)
const hasTimeFilter = computed(() => Boolean(filters.date || filters.startTime || filters.endTime))

async function loadRooms() {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = ''
  const query: StudyRoomListQuery = { page: filters.page, pageSize: filters.pageSize }
  if (filters.keyword.trim()) query.keyword = filters.keyword.trim()
  if (hasTimeFilter.value) {
    query.date = filters.date
    query.startTime = filters.startTime
    query.endTime = filters.endTime
  }
  try {
    const result = await getStudyRooms(query, controller.signal)
    rooms.value = result.items
    total.value = result.total
  } catch (cause) {
    if (cause instanceof RequestError && cause.kind === 'cancel') return
    rooms.value = []
    total.value = 0
    error.value = cause instanceof RequestError ? cause.message : '自习室加载失败'
  } finally {
    loading.value = false
  }
}

function validateFilters(): boolean {
  filterError.value = ''
  const selected = [filters.date, filters.startTime, filters.endTime].filter(Boolean).length
  if (selected > 0 && selected < 3) {
    filterError.value = '查询时段时，请同时选择日期、开始时间和结束时间。'
    return false
  }
  if (selected === 3 && filters.startTime >= filters.endTime) {
    filterError.value = '结束时间必须晚于开始时间。'
    return false
  }
  if (filters.date && (filters.date < today || filters.date > lastDate)) {
    filterError.value = `日期必须在 ${today} 至 ${lastDate} 之间。`
    return false
  }
  return true
}

function search() {
  if (!validateFilters()) return
  filters.page = 1
  void loadRooms()
}

function reset() {
  filters.keyword = ''
  filters.date = ''
  filters.startTime = ''
  filters.endTime = ''
  filters.page = 1
  filterError.value = ''
  void loadRooms()
}

function changePage(page: number) {
  filters.page = page
  void loadRooms()
}

onMounted(() => {
  void loadRooms()
})

onBeforeUnmount(() => {
  controller?.abort()
})
</script>

<template>
  <section class="home-page" aria-labelledby="home-title">
    <header class="home-hero">
      <div>
        <p class="page-eyebrow">学生服务 / 自习室</p>
        <h1 id="home-title">找到一间适合专注的自习室</h1>
        <p class="hero-summary">
          按名称、位置或时间范围筛选开放空间，再进入座位平面图选择具体座位。
        </p>
      </div>
      <div class="hero-stat">
        <span>当前结果</span>
        <strong>{{ total }}</strong>
        <small>间自习室</small>
      </div>
    </header>

    <el-form class="filter-panel" :model="filters" @submit.prevent="search">
      <el-form-item label="名称或位置">
        <el-input
          v-model="filters.keyword"
          clearable
          placeholder="搜索自习室名称或楼栋"
          :prefix-icon="Search"
        />
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker
          v-model="filters.date"
          type="date"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD"
          placeholder="可选"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="开始时间">
        <el-time-select
          v-model="filters.startTime"
          start="06:00"
          end="22:00"
          step="00:30"
          placeholder="可选"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="结束时间">
        <el-time-select
          v-model="filters.endTime"
          start="06:30"
          end="23:00"
          step="00:30"
          placeholder="可选"
          style="width: 100%"
        />
      </el-form-item>
      <div class="filter-actions">
        <el-button native-type="submit" type="primary" :icon="Search">查询</el-button>
        <el-button :icon="RefreshRight" @click="reset">重置</el-button>
      </div>
    </el-form>
    <el-alert v-if="filterError" type="warning" :title="filterError" :closable="false" show-icon />
    <p v-if="hasTimeFilter" class="filter-note">
      已按指定时段计算动态余量；当前预约模块尚未接入时，动态余量与静态可用座位一致。
    </p>

    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon>
      <template #default>
        <el-button link type="primary" @click="loadRooms">重新加载</el-button>
      </template>
    </el-alert>

    <div v-loading="loading" class="room-results">
      <div v-if="rooms.length" class="room-grid">
        <RoomCard v-for="room in rooms" :key="room.id" :room="room" />
      </div>
      <el-empty
        v-else-if="!loading"
        :description="hasTimeFilter ? '没有符合该时间范围的自习室' : '暂无可预约自习室'"
      >
        <el-button type="primary" plain @click="reset">清除筛选条件</el-button>
      </el-empty>
    </div>

    <div v-if="total > filters.pageSize" class="pagination-row">
      <el-pagination
        :current-page="filters.page"
        :page-size="filters.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="changePage"
      />
    </div>
  </section>
</template>

<style scoped>
.home-page {
  display: grid;
  gap: 22px;
}

.home-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 28px 30px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background:
    radial-gradient(
      circle at 88% 10%,
      color-mix(in srgb, var(--accent) 18%, transparent),
      transparent 30%
    ),
    linear-gradient(135deg, var(--surface), var(--accent-soft));
}

.page-eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.home-hero h1 {
  max-width: 720px;
  margin: 0;
  color: var(--text);
  font-size: clamp(1.8rem, 3vw, 2.7rem);
  letter-spacing: -0.045em;
}

.hero-summary {
  max-width: 680px;
  margin: 12px 0 0;
  color: var(--text-secondary);
  line-height: 1.75;
}

.hero-stat {
  display: grid;
  min-width: 130px;
  padding: 16px 20px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--surface) 82%, transparent);
}

.hero-stat span,
.hero-stat small {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.hero-stat strong {
  margin: 4px 0;
  color: var(--text);
  font-size: 2rem;
  line-height: 1;
}

.filter-panel {
  display: grid;
  grid-template-columns: minmax(180px, 1.5fr) repeat(3, minmax(140px, 1fr)) auto;
  gap: 12px;
  align-items: end;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}

.filter-panel :deep(.el-form-item) {
  margin-bottom: 0;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.filter-note {
  margin: -10px 0 0;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.room-results {
  min-height: 300px;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.pagination-row {
  display: flex;
  justify-content: center;
}

@media (max-width: 1180px) {
  .filter-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-actions {
    grid-column: 1 / -1;
  }

  .room-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .home-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px;
  }

  .hero-stat {
    width: 100%;
  }

  .filter-panel {
    grid-template-columns: 1fr;
  }

  .room-grid {
    grid-template-columns: 1fr;
  }
}
</style>
