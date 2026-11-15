<script setup lang="ts">
import {
  ArrowRight,
  Calendar,
  Check,
  CircleCheck,
  Clock,
  CopyDocument,
  InfoFilled,
  Location,
  Moon,
  RefreshRight,
  Search,
  Sunny,
  User,
  Warning,
} from '@element-plus/icons-vue'
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import {
  primitiveRamps,
  semanticTokens,
  typeSpecimens,
  type ColorToken,
  type PreviewTheme,
} from '../../design-system/tokens'

const previewTheme = shallowRef<PreviewTheme>('dark')
const activeSection = shallowRef('principles')
const copiedToken = shallowRef('')
const copyMessage = shallowRef('')
const semantic = computed(() => semanticTokens[previewTheme.value])

let sectionElements: HTMLElement[] = []
let scrollFrame: number | null = null
let copyResetTimer: ReturnType<typeof setTimeout> | null = null

const navItems = [
  { id: 'principles', label: '原则', index: '01' },
  { id: 'palette', label: '色彩', index: '02' },
  { id: 'typography', label: '字体', index: '03' },
  { id: 'components', label: '组件', index: '04' },
  { id: 'glass', label: '材质', index: '05' },
] as const

const statusSamples = [
  { label: '已解决', icon: CircleCheck, tone: 'success' },
  { label: '待处理', icon: InfoFilled, tone: 'warning' },
  { label: '已驳回', icon: Warning, tone: 'danger' },
] as const

const tableRows = [
  {
    room: '图书馆三层',
    seat: 'A 017',
    time: '08:00 至 10:00',
    status: '使用中',
  },
  {
    room: '教学楼 A203',
    seat: 'B 006',
    time: '14:00 至 16:00',
    status: '已预约',
  },
  {
    room: '东区研讨空间',
    seat: 'C 003',
    time: '19:00 至 21:00',
    status: '可预约',
  },
] as const

const seatStates = [
  'available',
  'available',
  'occupied',
  'available',
  'selected',
  'available',
  'occupied',
  'available',
  'available',
  'occupied',
  'available',
  'available',
  'unavailable',
  'available',
  'available',
  'occupied',
  'available',
  'selected',
  'available',
  'available',
] as const

function scheduleCopyReset() {
  if (copyResetTimer) clearTimeout(copyResetTimer)
  copyResetTimer = setTimeout(() => {
    copiedToken.value = ''
  }, 1800)
}

function updateActiveSection() {
  let current = sectionElements[0]?.id ?? 'principles'

  for (const section of sectionElements) {
    if (section.getBoundingClientRect().top <= 248) {
      current = section.id
    } else {
      break
    }
  }

  activeSection.value = current
}

function handleSectionScroll() {
  if (scrollFrame !== null) return
  scrollFrame = requestAnimationFrame(() => {
    updateActiveSection()
    scrollFrame = null
  })
}

async function copyColor(token: ColorToken) {
  try {
    await navigator.clipboard.writeText(token.value)
    copiedToken.value = token.name
    copyMessage.value = `已复制 ${token.name}`
    scheduleCopyReset()
  } catch {
    copiedToken.value = ''
    copyMessage.value = `复制失败，${token.name} 的值为 ${token.value}`
  }
}

onMounted(() => {
  sectionElements = Array.from(document.querySelectorAll<HTMLElement>('.showroom-section'))
  updateActiveSection()
  window.addEventListener('scroll', handleSectionScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleSectionScroll)
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
  if (copyResetTimer) clearTimeout(copyResetTimer)
})
</script>

<template>
  <section class="design-system-page" aria-labelledby="design-system-title">
    <div class="showroom" :data-preview-theme="previewTheme">
      <div class="showroom-grid" aria-hidden="true" />
      <div class="ambient-light ambient-light-primary" aria-hidden="true" />
      <div class="ambient-light ambient-light-cobalt" aria-hidden="true" />
      <div class="ambient-light ambient-light-silver" aria-hidden="true" />

      <header class="showroom-hero">
        <div class="hero-copy-column">
          <div class="hero-utility">
            <span class="status-mark">
              <span class="status-mark-dot" aria-hidden="true" />
              DESIGN SYSTEM 02
            </span>
            <div class="theme-switch" role="group" aria-label="预览主题">
              <button
                type="button"
                :aria-pressed="previewTheme === 'dark'"
                :class="{ active: previewTheme === 'dark' }"
                @click="previewTheme = 'dark'"
              >
                <el-icon aria-hidden="true"><Moon /></el-icon>
                深色
              </button>
              <button
                type="button"
                :aria-pressed="previewTheme === 'light'"
                :class="{ active: previewTheme === 'light' }"
                @click="previewTheme = 'light'"
              >
                <el-icon aria-hidden="true"><Sunny /></el-icon>
                浅色
              </button>
            </div>
          </div>

          <div class="hero-heading">
            <p class="hero-kicker">FOG SILVER / GRAPHITE / QUIET GLASS</p>
            <h1 id="design-system-title">
              安静不是空白，
              <span>是恰好的秩序。</span>
            </h1>
            <p class="hero-description">
              为一间自习室建立清晰、克制而经得起长时间使用的界面语言。让空间信息自然浮现，让每一次操作都有明确的落点。
            </p>
          </div>

          <div class="hero-facts">
            <div class="hero-fact">
              <span class="hero-fact-label">TYPEFACE</span>
              <strong>Noto Sans SC</strong>
              <small>中文优先的可变字体</small>
            </div>
            <div class="hero-fact">
              <span class="hero-fact-label">COLOR</span>
              <strong>Graphite 950</strong>
              <small>低饱和冰蓝作为唯一强调</small>
            </div>
            <div class="hero-fact">
              <span class="hero-fact-label">MATERIAL</span>
              <strong>Quiet glass</strong>
              <small>只出现在悬浮层级</small>
            </div>
          </div>
        </div>

        <div class="hero-product" aria-label="自习室预约界面预览">
          <div class="product-stage-meta">
            <span>LIVE PRODUCT CANVAS</span>
            <span>08:42</span>
          </div>

          <div class="product-window">
            <header class="product-window-bar">
              <div class="mini-brand">
                <span class="mini-brand-mark" aria-hidden="true">阅</span>
                <span>校园自习室</span>
              </div>
              <nav class="mini-navigation" aria-label="产品预览导航">
                <span class="active">空间</span>
                <span>预约</span>
                <span>记录</span>
              </nav>
              <span class="mini-avatar" aria-hidden="true">林</span>
            </header>

            <div class="product-window-body">
              <aside class="availability-card">
                <p class="availability-date">今日 · 11 月 11 日</p>
                <div class="availability-number">
                  <strong>06</strong>
                  <span>个座位可预约</span>
                </div>
                <div class="availability-meter" aria-label="今日座位余量 68%">
                  <span />
                </div>
                <dl class="availability-list">
                  <div>
                    <dt>当前时段</dt>
                    <dd>08:00 至 10:00</dd>
                  </div>
                  <div>
                    <dt>楼层</dt>
                    <dd>图书馆 3F</dd>
                  </div>
                </dl>
              </aside>

              <div class="seat-preview">
                <div class="seat-preview-heading">
                  <div>
                    <p>SEAT MAP / 03F</p>
                    <h2>选择一张安静桌面</h2>
                  </div>
                  <span class="seat-preview-count">20 座</span>
                </div>
                <div class="seat-grid" aria-label="座位状态示意图">
                  <span
                    v-for="(state, index) in seatStates"
                    :key="`${state}-${index}`"
                    class="seat-dot"
                    :class="`seat-${state}`"
                    :title="`座位 ${String(index + 1).padStart(2, '0')}：${state}`"
                  >
                    {{ String(index + 1).padStart(2, '0') }}
                  </span>
                </div>
                <div class="seat-legend">
                  <span><i class="legend-dot legend-available" />可预约</span>
                  <span><i class="legend-dot legend-selected" />已选择</span>
                  <span><i class="legend-dot legend-occupied" />使用中</span>
                </div>
              </div>
            </div>

            <footer class="product-window-footer">
              <div>
                <span class="selection-label">已选择</span>
                <strong>A 017</strong>
              </div>
              <button type="button" class="preview-button primary">
                继续预约
                <el-icon aria-hidden="true"><ArrowRight /></el-icon>
              </button>
            </footer>
          </div>

          <div class="product-floating-note">
            <el-icon aria-hidden="true"><Check /></el-icon>
            <span>座位状态已更新</span>
          </div>

          <p class="product-caption">真实产品语境中的间距、层级与操作反馈</p>
        </div>
      </header>

      <nav class="section-rail" aria-label="设计系统章节">
        <a
          v-for="item in navItems"
          :key="item.id"
          :href="`#${item.id}`"
          :class="{ active: activeSection === item.id }"
          :aria-current="activeSection === item.id ? 'location' : undefined"
        >
          <span>{{ item.index }}</span>
          {{ item.label }}
        </a>
        <span class="section-rail-rule" aria-hidden="true" />
        <span class="section-rail-caption">GRAPHITE / FROST</span>
      </nav>

      <div class="showroom-content">
        <section id="principles" class="showroom-section principle-section">
          <div class="section-index" aria-hidden="true">01</div>
          <div class="section-heading principle-heading">
            <p class="section-kicker">DESIGN PRINCIPLES</p>
            <h2>把复杂留给系统，<br />把安静还给使用者。</h2>
            <p class="section-intro">
              界面不依靠装饰制造高级感。统一的比例、足够的留白与清晰的边界，才是长时间使用时最可靠的质感。
            </p>
          </div>

          <div class="principle-list">
            <article class="principle-item">
              <span class="principle-number">01</span>
              <div>
                <h3>少色，才有重点</h3>
                <p>石墨灰承担结构，雾白承担阅读，冰蓝只说明焦点与状态。</p>
              </div>
              <span class="principle-token">RESTRAINT</span>
            </article>
            <article class="principle-item">
              <span class="principle-number">02</span>
              <div>
                <h3>用空间组织信息</h3>
                <p>减少重复边框，让间距、对齐与字重形成更自然的阅读节奏。</p>
              </div>
              <span class="principle-token">SPACE</span>
            </article>
            <article class="principle-item">
              <span class="principle-number">03</span>
              <div>
                <h3>通透但不透明</h3>
                <p>毛玻璃只服务浮层与摘要，正文始终拥有稳定的对比度。</p>
              </div>
              <span class="principle-token">DEPTH</span>
            </article>
          </div>
        </section>

        <section id="palette" class="showroom-section palette-section">
          <div class="section-index" aria-hidden="true">02</div>
          <div class="section-heading">
            <p class="section-kicker">COLOR SYSTEM</p>
            <h2>雾银，不是灰色。</h2>
            <p class="section-intro">
              在冷灰中保留极轻的蓝调。所有状态色都降低饱和度，并始终配合文字与形状表达。
            </p>
          </div>

          <div class="token-explorer">
            <aside class="token-context">
              <span class="context-label">{{
                previewTheme === 'dark' ? 'DARK MODE' : 'LIGHT MODE'
              }}</span>
              <strong>{{ previewTheme === 'dark' ? '夜间阅读' : '日间阅读' }}</strong>
              <p>
                {{
                  previewTheme === 'dark'
                    ? '石墨背景降低整体亮度，雾白正文保持稳定对比。'
                    : '雾银画布减少眩光，深石墨正文承担主要阅读层级。'
                }}
              </p>
              <span class="token-count">{{ semantic.length }} SEMANTIC TOKENS</span>
            </aside>

            <div class="semantic-token-list">
              <header class="token-list-heading">
                <span>语义变量</span>
                <small>点击任意色值即可复制</small>
              </header>
              <div class="semantic-token-grid">
                <button
                  v-for="token in semantic"
                  :key="token.name"
                  type="button"
                  class="semantic-token"
                  :aria-label="`复制 ${token.name}，${token.value}`"
                  @click="copyColor(token)"
                >
                  <span class="semantic-swatch" :style="{ backgroundColor: token.value }" />
                  <span class="semantic-copy">
                    <strong>{{ token.name }}</strong>
                    <small>{{ token.value }}</small>
                    <em>{{ token.role }}</em>
                  </span>
                  <span class="copy-indicator" :class="{ copied: copiedToken === token.name }">
                    <el-icon aria-hidden="true">
                      <CircleCheck v-if="copiedToken === token.name" />
                      <CopyDocument v-else />
                    </el-icon>
                    <span>{{ copiedToken === token.name ? '已复制' : '复制' }}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div class="ramp-gallery">
            <article v-for="ramp in primitiveRamps" :key="ramp.name" class="color-ramp">
              <header class="ramp-heading">
                <div>
                  <h3>{{ ramp.label }}</h3>
                  <p>{{ ramp.description }}</p>
                </div>
                <code>{{ ramp.name }}</code>
              </header>
              <div class="ramp-track">
                <button
                  v-for="token in ramp.tokens"
                  :key="token.name"
                  type="button"
                  class="ramp-token"
                  :aria-label="`复制 ${token.name}，${token.value}`"
                  @click="copyColor(token)"
                >
                  <span class="ramp-swatch" :style="{ backgroundColor: token.value }">
                    <el-icon v-if="copiedToken === token.name" aria-hidden="true">
                      <Check />
                    </el-icon>
                  </span>
                  <span class="ramp-token-meta">
                    <strong>{{ token.name.replace(`${ramp.name}-`, '') }}</strong>
                    <small>{{ token.value }}</small>
                  </span>
                </button>
              </div>
            </article>
          </div>

          <p class="sr-only" aria-live="polite">{{ copyMessage }}</p>
        </section>

        <section id="typography" class="showroom-section typography-section">
          <div class="section-index" aria-hidden="true">03</div>
          <div class="section-heading">
            <p class="section-kicker">TYPOGRAPHY</p>
            <h2>一种字体，<br />建立全部层级。</h2>
            <p class="section-intro">
              思源黑体覆盖中文、拉丁与数字。用 12 至 60 像素的稳定比例，替代零散的视觉修辞。
            </p>
          </div>

          <div class="type-system">
            <aside class="type-context">
              <span class="context-label">VARIABLE TYPEFACE</span>
              <strong class="type-glyph">Aa 起</strong>
              <dl class="type-details">
                <div>
                  <dt>中文名称</dt>
                  <dd>思源黑体</dd>
                </div>
                <div>
                  <dt>字重范围</dt>
                  <dd>100 至 900</dd>
                </div>
                <div>
                  <dt>数字样式</dt>
                  <dd>Tabular nums</dd>
                </div>
              </dl>
            </aside>

            <div class="type-scale">
              <article v-for="item in typeSpecimens" :key="item.label" class="type-specimen">
                <div class="type-metadata">
                  <strong>{{ item.label }}</strong>
                  <span>{{ item.spec }}</span>
                </div>
                <p :class="item.className">{{ item.sample }}</p>
              </article>
              <article class="type-specimen">
                <div class="type-metadata">
                  <strong>Numbers</strong>
                  <span>14 / 20 · Tabular nums</span>
                </div>
                <p class="type-numbers">
                  <span>08:00</span>
                  <span>12:30</span>
                  <span>2026.11.11</span>
                  <span>A 017</span>
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="components" class="showroom-section components-section">
          <div class="section-index" aria-hidden="true">04</div>
          <div class="section-heading">
            <p class="section-kicker">PRODUCT COMPONENTS</p>
            <h2>组件不是零件，<br />是一段完整操作。</h2>
            <p class="section-intro">
              按钮、筛选、表格和反馈放回真实预约任务中，才可以判断它们是否真正清楚、稳定。
            </p>
          </div>

          <div class="component-canvas">
            <header class="canvas-topbar">
              <div class="canvas-brand">
                <span class="canvas-brand-mark" aria-hidden="true">阅</span>
                <span>
                  <strong>预约控制台</strong>
                  <small>图书馆三层</small>
                </span>
              </div>
              <div class="canvas-tabs" role="tablist" aria-label="预约控制台预览标签">
                <button type="button" role="tab" aria-selected="true">空间</button>
                <button type="button" role="tab" aria-selected="false">预约</button>
                <button type="button" role="tab" aria-selected="false">记录</button>
              </div>
              <button type="button" class="canvas-avatar" aria-label="当前管理员">林</button>
            </header>

            <div class="component-toolbar">
              <div class="toolbar-title">
                <span class="context-label">OCCUPANCY</span>
                <strong>今日使用情况</strong>
              </div>
              <div class="button-cluster" aria-label="按钮层级示例">
                <button type="button" class="preview-button primary">
                  新建预约
                  <el-icon aria-hidden="true"><ArrowRight /></el-icon>
                </button>
                <button type="button" class="preview-button secondary">导出记录</button>
                <button type="button" class="preview-button ghost">刷新</button>
                <button type="button" class="preview-button primary" disabled>已结束</button>
              </div>
            </div>

            <div class="filter-strip">
              <label class="preview-field search-field">
                <span>自习室</span>
                <span class="field-control">
                  <el-icon aria-hidden="true"><Search /></el-icon>
                  <input value="图书馆三层" readonly />
                </span>
              </label>
              <label class="preview-field">
                <span>日期</span>
                <span class="field-control">
                  <el-icon aria-hidden="true"><Calendar /></el-icon>
                  <input value="2026.11.11" readonly />
                </span>
              </label>
              <label class="preview-field">
                <span>时段</span>
                <span class="field-control">
                  <el-icon aria-hidden="true"><Clock /></el-icon>
                  <select aria-label="选择预览时段">
                    <option>08:00 至 10:00</option>
                    <option>14:00 至 16:00</option>
                  </select>
                </span>
              </label>
              <button type="button" class="filter-action">
                <el-icon aria-hidden="true"><RefreshRight /></el-icon>
                重置条件
              </button>
            </div>

            <div class="data-workspace">
              <aside class="status-summary">
                <header>
                  <span class="context-label">LIVE STATUS</span>
                  <strong>座位状态</strong>
                </header>
                <div class="status-summary-number">
                  <strong>69</strong>
                  <span>/ 72</span>
                </div>
                <p>当前可预约座位</p>
                <div class="utilization-bar" aria-label="座位可用率 96%">
                  <span />
                </div>
                <div class="status-sample-list" aria-label="状态标签示例">
                  <span
                    v-for="status in statusSamples"
                    :key="status.label"
                    class="status-chip"
                    :class="`status-${status.tone}`"
                  >
                    <el-icon aria-hidden="true"><component :is="status.icon" /></el-icon>
                    {{ status.label }}
                  </span>
                </div>
              </aside>

              <div class="table-workspace">
                <div class="table-heading">
                  <div>
                    <span class="context-label">ACTIVE BOOKINGS</span>
                    <strong>预约明细</strong>
                  </div>
                  <span class="table-meta">按提交时间排序</span>
                </div>
                <div class="table-scroll">
                  <table class="preview-table">
                    <thead>
                      <tr>
                        <th>自习室</th>
                        <th>座位</th>
                        <th>时段</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in tableRows" :key="row.seat">
                        <td>{{ row.room }}</td>
                        <td class="numeric-cell">{{ row.seat }}</td>
                        <td class="numeric-cell">{{ row.time }}</td>
                        <td>
                          <span class="table-status">
                            <span class="table-status-dot" aria-hidden="true" />
                            {{ row.status }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="table-footer">
                  <span>显示 1 至 3 条，共 18 条</span>
                  <div class="pagination-demo" aria-label="分页示例">
                    <button type="button" aria-label="上一页">←</button>
                    <button type="button" class="active" aria-current="page">1</button>
                    <button type="button">2</button>
                    <button type="button">3</button>
                    <button type="button" aria-label="下一页">→</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="component-states">
              <article class="state-example">
                <span class="state-label">LOADING</span>
                <div class="state-content state-loading"><span /><span /><span /></div>
              </article>
              <article class="state-example">
                <span class="state-label">EMPTY</span>
                <div class="state-content state-empty">
                  <el-icon aria-hidden="true"><Calendar /></el-icon>
                  <strong>当天没有预约</strong>
                  <p>换一个日期，或查看其他自习室。</p>
                </div>
              </article>
              <article class="state-example">
                <span class="state-label">ERROR</span>
                <div class="state-content state-error" role="alert">
                  <el-icon aria-hidden="true"><Warning /></el-icon>
                  <p>数据加载失败，请稍后重试。</p>
                  <button type="button">重新加载</button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="glass" class="showroom-section material-section">
          <div class="section-index" aria-hidden="true">05</div>
          <div class="section-heading">
            <p class="section-kicker">MATERIAL SYSTEM</p>
            <h2>光影出现，<br />但不抢走内容。</h2>
            <p class="section-intro">
              一层轻微模糊、一道细腻高光和足够安静的阴影，就足以说明浮层与页面之间的距离。
            </p>
          </div>

          <div class="material-scene">
            <div class="material-grid" aria-hidden="true" />
            <div class="material-glow material-glow-cyan" aria-hidden="true" />
            <div class="material-glow material-glow-silver" aria-hidden="true" />

            <nav class="glass-navigation" aria-label="毛玻璃导航示例">
              <div class="glass-brand">
                <span class="glass-brand-mark" aria-hidden="true">
                  <el-icon><Location /></el-icon>
                </span>
                <span>
                  <strong>图书馆三层</strong>
                  <small>安静自习区</small>
                </span>
              </div>
              <div class="glass-links">
                <span class="active">空间概览</span>
                <span>座位分布</span>
                <span>开放时间</span>
              </div>
              <button type="button" class="glass-profile" aria-label="个人中心">
                <User />
              </button>
            </nav>

            <div class="scene-floorplan">
              <div class="floorplan-header">
                <span class="context-label">FLOOR PLAN</span>
                <strong>三层 · 东区</strong>
              </div>
              <div class="floorplan-rows" aria-hidden="true">
                <span v-for="index in 28" :key="index" :class="{ occupied: index % 5 === 0 }" />
              </div>
              <div class="floorplan-legend">
                <span><i class="legend-dot legend-available" />可预约</span>
                <span><i class="legend-dot legend-occupied" />使用中</span>
              </div>
            </div>

            <article class="glass-booking-card">
              <div class="glass-card-heading">
                <div>
                  <span class="context-label">SELECTED SEAT</span>
                  <h3>A 017</h3>
                </div>
                <span class="glass-seat-state">
                  <Check aria-hidden="true" />
                  可预约
                </span>
              </div>
              <dl class="glass-booking-details">
                <div>
                  <dt>日期</dt>
                  <dd>11 月 11 日</dd>
                </div>
                <div>
                  <dt>时段</dt>
                  <dd>08:00 至 10:00</dd>
                </div>
                <div>
                  <dt>位置</dt>
                  <dd>靠窗 · 东区</dd>
                </div>
              </dl>
              <div class="glass-card-footer">
                <span>
                  <small>安静指数</small>
                  <strong>96 / 100</strong>
                </span>
                <button type="button" class="preview-button primary">
                  预约这个座位
                  <el-icon aria-hidden="true"><ArrowRight /></el-icon>
                </button>
              </div>
            </article>

            <div class="glass-notice">
              <span class="glass-notice-icon" aria-hidden="true">
                <InfoFilled />
              </span>
              <span>
                <strong>签到提醒</strong>
                <small>预约后请在开始 15 分钟内签到</small>
              </span>
            </div>
          </div>
        </section>
      </div>

      <footer class="showroom-footer">
        <span>DESIGN SYSTEM PREVIEW · 2026</span>
        <span>雾银石墨 / 克制动效 / 内容优先</span>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.design-system-page {
  --font-preview: 'Noto Sans SC Variable', 'Noto Sans SC', sans-serif;
  min-width: 0;
  font-family: var(--font-preview);
}

.showroom {
  --bg: #080c0f;
  --bg-soft: #0c1115;
  --surface: #11171b;
  --surface-raised: #151c21;
  --surface-glass: rgb(18 25 30 / 68%);
  --text: #f2f5f6;
  --text-secondary: #b8c1c6;
  --text-muted: #849198;
  --border: rgb(255 255 255 / 8%);
  --border-strong: rgb(255 255 255 / 16%);
  --control-border: #5b666c;
  --accent: #7db9cd;
  --accent-soft: rgb(125 185 205 / 12%);
  --accent-line: rgb(125 185 205 / 32%);
  --action: #eef2f3;
  --action-text: #080c0f;
  --success: #67ad88;
  --success-soft: rgb(103 173 136 / 12%);
  --warning: #c9a158;
  --warning-soft: rgb(201 161 88 / 12%);
  --danger: #d57b76;
  --danger-soft: rgb(213 123 118 / 12%);
  --focus-ring: #9bd6e8;
  --shadow-soft: 0 24px 80px rgb(0 0 0 / 24%);
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  overflow: clip;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 24px;
  color: var(--text);
  background: var(--bg);
  box-shadow: var(--shadow-soft);
  isolation: isolate;
}

.showroom[data-preview-theme='light'] {
  --bg: #f1f3f4;
  --bg-soft: #e9edef;
  --surface: #fbfcfc;
  --surface-raised: #fff;
  --surface-glass: rgb(255 255 255 / 72%);
  --text: #11181c;
  --text-secondary: #46555c;
  --text-muted: #5f6d74;
  --border: rgb(17 24 28 / 10%);
  --border-strong: rgb(17 24 28 / 20%);
  --control-border: #6e797f;
  --accent: #2f6b7e;
  --accent-soft: rgb(47 107 126 / 9%);
  --accent-line: rgb(47 107 126 / 28%);
  --action: #172126;
  --action-text: #f7f9fa;
  --success: #356d52;
  --success-soft: rgb(53 109 82 / 9%);
  --warning: #84601f;
  --warning-soft: rgb(132 96 31 / 9%);
  --danger: #9f433f;
  --danger-soft: rgb(159 67 63 / 9%);
  --focus-ring: #24657a;
  --shadow-soft: 0 24px 64px rgb(25 35 41 / 10%);
}

.showroom-grid {
  position: absolute;
  z-index: -2;
  inset: 0;
  background-image:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 64px 64px;
  opacity: 0.26;
  mask-image: linear-gradient(to bottom, #000 0%, transparent 48%);
  pointer-events: none;
}

.ambient-light {
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  filter: blur(96px);
  opacity: 0.72;
  pointer-events: none;
}

.ambient-light-primary {
  top: -180px;
  left: 22%;
  width: 680px;
  height: 540px;
  background: radial-gradient(circle, rgb(57 127 151 / 28%), transparent 68%);
}

.ambient-light-cobalt {
  top: 180px;
  right: -260px;
  width: 620px;
  height: 620px;
  background: radial-gradient(circle, rgb(72 91 128 / 18%), transparent 69%);
}

.ambient-light-silver {
  top: 820px;
  left: -260px;
  width: 560px;
  height: 560px;
  background: radial-gradient(circle, rgb(183 196 204 / 10%), transparent 70%);
}

.showroom[data-preview-theme='light'] .ambient-light {
  opacity: 0.48;
}

.showroom[data-preview-theme='light'] .ambient-light-primary {
  background: radial-gradient(circle, rgb(91 157 180 / 22%), transparent 70%);
}

.showroom[data-preview-theme='light'] .ambient-light-cobalt {
  background: radial-gradient(circle, rgb(119 134 162 / 13%), transparent 70%);
}

.showroom-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(380px, 0.98fr);
  gap: 64px;
  min-height: 760px;
  align-items: center;
  padding: 64px;
  border-bottom: 1px solid var(--border);
}

.hero-copy-column {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  align-self: stretch;
  padding: 8px 0;
}

.hero-utility,
.product-stage-meta,
.token-list-heading,
.ramp-heading,
.canvas-topbar,
.component-toolbar,
.table-heading,
.table-footer,
.glass-card-footer,
.showroom-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.status-mark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  line-height: 16px;
}

.status-mark-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.theme-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--control-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface) 58%, transparent);
}

.theme-switch button {
  display: inline-flex;
  min-width: 78px;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 4px 12px;
  border: 0;
  border-radius: 8px;
  color: var(--text-muted);
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  transition:
    color 300ms var(--ease-out),
    background-color 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}

.theme-switch button:hover {
  color: var(--text);
}

.theme-switch button:active {
  transform: scale(0.98);
}

.theme-switch button.active {
  color: var(--action-text);
  background: var(--action);
}

.hero-heading {
  max-width: 680px;
  margin: 96px 0 80px;
}

.hero-kicker,
.section-kicker,
.context-label,
.state-label {
  margin: 0;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  line-height: 16px;
}

.hero-heading h1 {
  max-width: 680px;
  margin: 24px 0 0;
  color: var(--text);
  font-size: 60px;
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: 1;
  text-wrap: balance;
}

.hero-heading h1 span {
  display: block;
  margin-top: 8px;
  color: var(--text-secondary);
}

.hero-description {
  max-width: 600px;
  margin: 32px 0 0;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.8;
  text-wrap: pretty;
}

.hero-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.hero-fact {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.hero-fact-label {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  line-height: 16px;
}

.hero-fact strong {
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.hero-fact small {
  overflow: hidden;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-product {
  position: relative;
  width: min(100%, 610px);
  justify-self: end;
}

.product-stage-meta {
  margin-bottom: 12px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  line-height: 16px;
}

.product-window {
  overflow: hidden;
  border: 1px solid var(--control-border);
  border-radius: 24px;
  background: var(--surface-glass);
  box-shadow:
    0 40px 100px rgb(0 0 0 / 34%),
    inset 0 1px rgb(255 255 255 / 8%);
  backdrop-filter: blur(28px) saturate(118%);
}

.showroom[data-preview-theme='light'] .product-window {
  box-shadow:
    0 40px 100px rgb(25 36 43 / 14%),
    inset 0 1px rgb(255 255 255 / 80%);
}

.product-window-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 32px;
  gap: 16px;
  align-items: center;
  min-height: 64px;
  padding: 0 16px 0 24px;
  border-bottom: 1px solid var(--border);
}

.mini-brand,
.canvas-brand,
.glass-brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.mini-brand {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.mini-brand-mark,
.canvas-brand-mark {
  display: grid;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  color: var(--accent);
  background: var(--accent-soft);
  font-size: 12px;
  font-weight: 600;
}

.mini-navigation {
  display: flex;
  align-items: center;
  gap: 24px;
  color: var(--text-muted);
  font-size: 12px;
}

.mini-navigation span.active {
  color: var(--text);
}

.mini-avatar,
.canvas-avatar {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--surface-raised) 72%, transparent);
  font-size: 12px;
}

.product-window-body {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
}

.availability-card,
.seat-preview {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 16px;
}

.availability-card {
  padding: 16px;
  background: color-mix(in srgb, var(--surface) 54%, transparent);
}

.availability-date,
.availability-list dt,
.availability-list dd,
.seat-preview-heading p,
.seat-preview-count,
.selection-label {
  margin: 0;
}

.availability-date {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 16px;
}

.availability-number {
  display: grid;
  gap: 4px;
  margin-top: 24px;
}

.availability-number strong {
  color: var(--text);
  font-size: 48px;
  font-weight: 500;
  letter-spacing: -0.05em;
  line-height: 1;
}

.availability-number span {
  color: var(--text-secondary);
  font-size: 12px;
}

.availability-meter {
  height: 3px;
  margin-top: 20px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--border);
}

.availability-meter span {
  display: block;
  width: 68%;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
}

.availability-list {
  display: grid;
  gap: 12px;
  margin: 24px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.availability-list div {
  display: grid;
  gap: 2px;
}

.availability-list dt {
  color: var(--text-muted);
  font-size: 12px;
}

.availability-list dd {
  color: var(--text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.seat-preview {
  padding: 16px;
  background: color-mix(in srgb, var(--surface-raised) 60%, transparent);
}

.seat-preview-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.seat-preview-heading p {
  color: var(--accent);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.seat-preview-heading h2 {
  margin: 8px 0 0;
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}

.seat-preview-count {
  flex-shrink: 0;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 10px;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 20px;
}

.seat-dot {
  display: grid;
  min-width: 0;
  aspect-ratio: 1.55;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--surface) 52%, transparent);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.seat-selected {
  border-color: var(--accent-line);
  color: var(--accent);
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent-line);
}

.seat-occupied {
  opacity: 0.48;
}

.seat-unavailable {
  border-style: dashed;
  opacity: 0.34;
}

.seat-legend,
.floorplan-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  color: var(--text-muted);
  font-size: 10px;
}

.seat-legend span,
.floorplan-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.legend-available {
  border: 1px solid var(--accent-line);
  background: var(--accent-soft);
}

.legend-selected {
  background: var(--accent);
}

.legend-occupied {
  background: var(--text-muted);
  opacity: 0.42;
}

.product-window-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 72px;
  padding: 12px 16px 12px 24px;
  border-top: 1px solid var(--border);
}

.product-window-footer > div {
  display: grid;
  gap: 2px;
}

.selection-label {
  color: var(--text-muted);
  font-size: 12px;
}

.product-window-footer strong {
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.preview-button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  cursor: pointer;
  transition:
    color 300ms var(--ease-out),
    background-color 300ms var(--ease-out),
    border-color 300ms var(--ease-out),
    opacity 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}

.preview-button:hover:enabled {
  transform: translateY(-1px);
}

.preview-button:active:enabled {
  transform: scale(0.98);
}

.preview-button.primary {
  color: var(--action-text);
  background: var(--action);
}

.preview-button.secondary {
  border-color: var(--control-border);
  color: var(--text);
  background: var(--surface-raised);
}

.preview-button.ghost {
  color: var(--text-secondary);
  background: transparent;
}

.preview-button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.product-floating-note {
  width: max-content;
  margin: 12px 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  color: var(--text-secondary);
  background: var(--surface-glass);
  box-shadow: 0 18px 48px rgb(0 0 0 / 24%);
  backdrop-filter: blur(20px) saturate(120%);
  font-size: 12px;
}

.product-floating-note .el-icon {
  color: var(--success);
}

.product-caption {
  margin: 16px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 16px;
  text-align: right;
}

.section-rail {
  position: sticky;
  z-index: 8;
  top: 64px;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 12px 64px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-glass);
  backdrop-filter: blur(24px) saturate(120%);
}

.section-rail a {
  display: inline-flex;
  min-height: 36px;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-decoration: none;
  transition:
    color 300ms var(--ease-out),
    border-color 300ms var(--ease-out),
    background-color 300ms var(--ease-out);
}

.section-rail a span {
  color: var(--accent);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.section-rail a:hover {
  color: var(--text);
}

.section-rail a.active {
  border-color: var(--border);
  color: var(--text);
  background: color-mix(in srgb, var(--surface-raised) 78%, transparent);
}

.section-rail-rule {
  height: 1px;
  min-width: 24px;
  flex: 1;
  background: var(--border);
}

.section-rail-caption {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

.showroom-content {
  padding: 0 64px;
}

.showroom-section {
  position: relative;
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  column-gap: 48px;
  padding: 128px 0;
  border-bottom: 1px solid var(--border);
  scroll-margin-top: 128px;
}

.section-index {
  padding-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
}

.section-heading {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(240px, 0.72fr);
  gap: 24px 64px;
  align-items: end;
  max-width: 1000px;
}

.section-heading h2 {
  grid-column: 1;
  margin: 0;
  color: var(--text);
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.2;
  text-wrap: balance;
}

.section-intro {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: end;
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.8;
  text-wrap: pretty;
}

.principle-heading h2 {
  font-size: 48px;
  line-height: 1.08;
}

.principle-list {
  grid-column: 2;
  margin-top: 80px;
  border-top: 1px solid var(--border);
}

.principle-item {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 32px;
  align-items: start;
  padding: 32px 0;
  border-bottom: 1px solid var(--border);
}

.principle-number {
  color: var(--accent);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.principle-item h3 {
  margin: 0;
  color: var(--text);
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
}

.principle-item p {
  max-width: 560px;
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.principle-token {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.token-explorer {
  grid-column: 2;
  display: grid;
  grid-template-columns: 216px minmax(0, 1fr);
  gap: 32px;
  margin-top: 64px;
  padding: 32px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: color-mix(in srgb, var(--surface) 54%, transparent);
}

.token-context,
.type-context {
  min-width: 0;
}

.token-context {
  display: flex;
  flex-direction: column;
  padding-right: 24px;
  border-right: 1px solid var(--border);
}

.token-context strong {
  margin-top: 12px;
  color: var(--text);
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
}

.token-context p {
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.token-count {
  margin-top: auto;
  padding-top: 48px;
  color: var(--text-muted);
  font-size: 10px;
  letter-spacing: 0.1em;
}

.token-list-heading {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.token-list-heading > span {
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
}

.token-list-heading small {
  color: var(--text-muted);
  font-size: 12px;
}

.semantic-token-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
}

.semantic-token {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 72px;
  padding: 12px 0;
  border: 0;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    color 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}

.semantic-token:hover {
  transform: translateX(2px);
}

.semantic-swatch {
  width: 36px;
  height: 44px;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
}

.semantic-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.semantic-copy strong,
.semantic-copy small,
.semantic-copy em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.semantic-copy strong {
  font-size: 12px;
  font-weight: 500;
}

.semantic-copy small {
  color: var(--text-secondary);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.semantic-copy em {
  color: var(--text-muted);
  font-size: 10px;
  font-style: normal;
}

.copy-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 10px;
  transition: opacity 300ms var(--ease-out);
}

.copy-indicator span {
  display: none;
}

.copy-indicator.copied {
  color: var(--success);
}

.copy-indicator.copied span {
  display: inline;
}

.ramp-gallery {
  grid-column: 2;
  display: grid;
  gap: 40px;
  margin-top: 64px;
}

.color-ramp {
  min-width: 0;
}

.ramp-heading {
  align-items: flex-end;
  padding-bottom: 12px;
}

.ramp-heading h3 {
  margin: 0;
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}

.ramp-heading p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 16px;
}

.ramp-heading code {
  color: var(--text-muted);
  font-family: inherit;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.ramp-track {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 4px;
}

.ramp-token {
  min-width: 0;
  padding: 0;
  border: 0;
  color: var(--text-muted);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.ramp-swatch {
  display: grid;
  width: 100%;
  height: 64px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--action-text);
  transition:
    border-color 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}

.ramp-token:hover .ramp-swatch {
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

.ramp-token-meta {
  display: grid;
  gap: 2px;
  padding-top: 8px;
}

.ramp-token-meta strong,
.ramp-token-meta small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ramp-token-meta strong {
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 500;
}

.ramp-token-meta small {
  color: var(--text-muted);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
}

.type-system {
  grid-column: 2;
  display: grid;
  grid-template-columns: 216px minmax(0, 1fr);
  gap: 48px;
  margin-top: 64px;
  padding-top: 32px;
  border-top: 1px solid var(--border);
}

.type-context {
  position: sticky;
  top: 136px;
  align-self: start;
}

.type-glyph {
  display: block;
  margin-top: 24px;
  color: var(--text);
  font-size: 48px;
  font-weight: 500;
  letter-spacing: -0.05em;
  line-height: 1;
}

.type-details {
  display: grid;
  gap: 16px;
  margin: 48px 0 0;
}

.type-details div {
  display: grid;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.type-details dt {
  color: var(--text-muted);
  font-size: 10px;
  letter-spacing: 0.06em;
}

.type-details dd {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.type-scale {
  min-width: 0;
  border-top: 1px solid var(--border);
}

.type-specimen {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 32px;
  align-items: baseline;
  padding: 24px 0;
  border-bottom: 1px solid var(--border);
}

.type-metadata {
  display: grid;
  gap: 4px;
}

.type-metadata strong {
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.type-metadata span {
  color: var(--text-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  line-height: 16px;
}

.type-specimen p {
  min-width: 0;
  margin: 0;
  color: var(--text);
}

.type-display {
  font-size: 60px;
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: 1;
}

.type-heading-1 {
  font-size: 48px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.08;
}

.type-heading-2 {
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.type-heading-3 {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.type-heading-4 {
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
}

.type-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 28px;
}

.type-body {
  max-width: 680px;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.8;
}

.type-caption {
  color: var(--text-muted) !important;
  font-size: 12px;
  line-height: 16px;
}

.type-numbers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 32px;
  overflow-wrap: anywhere;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  line-height: 20px;
}

.component-canvas {
  grid-column: 2;
  overflow: hidden;
  margin-top: 64px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: color-mix(in srgb, var(--surface) 72%, transparent);
  box-shadow: inset 0 1px rgb(255 255 255 / 4%);
}

.canvas-topbar {
  min-height: 64px;
  padding: 0 24px;
  border-bottom: 1px solid var(--border);
}

.canvas-brand-mark {
  width: 36px;
  height: 36px;
}

.canvas-brand > span:last-child,
.glass-brand > span:last-child {
  display: grid;
  gap: 2px;
}

.canvas-brand strong,
.glass-brand strong {
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.canvas-brand small,
.glass-brand small {
  color: var(--text-muted);
  font-size: 10px;
  line-height: 16px;
}

.canvas-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.canvas-tabs button {
  min-height: 28px;
  padding: 4px 12px;
  border: 0;
  border-radius: 6px;
  color: var(--text-muted);
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition:
    color 300ms var(--ease-out),
    background-color 300ms var(--ease-out);
}

.canvas-tabs button[aria-selected='true'] {
  color: var(--text);
  background: var(--surface-raised);
}

.canvas-avatar {
  padding: 0;
  cursor: pointer;
}

.component-toolbar {
  padding: 24px;
}

.toolbar-title {
  display: grid;
  gap: 4px;
}

.toolbar-title strong,
.table-heading strong,
.status-summary header strong {
  color: var(--text);
  font-size: 18px;
  font-weight: 500;
  line-height: 28px;
}

.button-cluster {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.filter-strip {
  display: grid;
  grid-template-columns:
    minmax(170px, 1.2fr) minmax(130px, 0.8fr) minmax(160px, 0.9fr)
    112px;
  gap: 12px;
  align-items: end;
  margin: 0 24px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface-raised) 54%, transparent);
}

.preview-field {
  display: grid;
  min-width: 0;
  gap: 8px;
  color: var(--text-muted);
  font-size: 10px;
}

.field-control {
  display: flex;
  height: 40px;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--control-border);
  border-radius: 8px;
  color: var(--text-muted);
  background: var(--surface);
}

.field-control input,
.field-control select {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: var(--text-secondary);
  background: transparent;
  font-family: inherit;
  font-size: 12px;
}

.filter-action {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border: 0;
  color: var(--text-muted);
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.data-workspace {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 16px;
  margin: 16px 24px 0;
}

.status-summary,
.table-workspace {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface-raised) 46%, transparent);
}

.status-summary {
  padding: 20px;
}

.status-summary header {
  display: grid;
  gap: 4px;
}

.status-summary-number {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 32px;
}

.status-summary-number strong {
  color: var(--text);
  font-size: 48px;
  font-weight: 500;
  letter-spacing: -0.05em;
  line-height: 1;
}

.status-summary-number span {
  color: var(--text-muted);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.status-summary > p {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.utilization-bar {
  height: 3px;
  margin-top: 24px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--border);
}

.utilization-bar span {
  display: block;
  width: 96%;
  height: 100%;
  background: var(--accent);
}

.status-sample-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 24px;
}

.status-chip {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 500;
}

.status-success {
  color: var(--success);
  background: var(--success-soft);
}

.status-warning {
  color: var(--warning);
  background: var(--warning-soft);
}

.status-danger {
  color: var(--danger);
  background: var(--danger-soft);
}

.table-workspace {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.table-heading {
  min-height: 72px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
}

.table-heading > div {
  display: grid;
  gap: 4px;
}

.table-meta {
  color: var(--text-muted);
  font-size: 10px;
}

.table-scroll {
  overflow-x: auto;
  overscroll-behavior: contain;
}

.preview-table {
  width: 100%;
  min-width: 580px;
  border-collapse: collapse;
  color: var(--text-secondary);
  font-size: 12px;
}

.preview-table th,
.preview-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.preview-table th {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.06em;
}

.preview-table td:first-child {
  color: var(--text);
}

.numeric-cell {
  font-variant-numeric: tabular-nums;
}

.table-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.table-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent);
}

.table-footer {
  min-height: 64px;
  margin-top: auto;
  padding: 12px 20px;
  color: var(--text-muted);
  font-size: 10px;
}

.pagination-demo {
  display: flex;
  gap: 4px;
}

.pagination-demo button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid var(--control-border);
  border-radius: 8px;
  color: var(--text-muted);
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition:
    color 300ms var(--ease-out),
    background-color 300ms var(--ease-out),
    transform 300ms var(--ease-out);
}

.pagination-demo button:hover {
  color: var(--text);
}

.pagination-demo button:active {
  transform: scale(0.96);
}

.pagination-demo button.active {
  border-color: var(--action);
  color: var(--action-text);
  background: var(--action);
}

.component-states {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 16px 24px 24px;
}

.state-example {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
}

.state-content {
  min-height: 140px;
  margin-top: 12px;
}

.state-loading {
  display: grid;
  align-content: center;
  gap: 12px;
}

.state-loading span {
  height: 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-muted) 15%, transparent);
}

.state-loading span:nth-child(1) {
  width: 56%;
}

.state-loading span:nth-child(2) {
  width: 92%;
}

.state-loading span:nth-child(3) {
  width: 72%;
}

.state-empty {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  text-align: center;
}

.state-empty .el-icon {
  color: var(--text-muted);
  font-size: 24px;
}

.state-empty strong {
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
}

.state-empty p,
.state-error p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.state-error {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 8px;
  color: var(--danger);
}

.state-error button {
  padding: 0;
  border: 0;
  color: var(--text);
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.material-section {
  padding-bottom: 128px;
}

.material-scene {
  position: relative;
  grid-column: 2;
  min-height: 600px;
  overflow: hidden;
  margin-top: 64px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: color-mix(in srgb, var(--bg-soft) 88%, var(--surface));
  isolation: isolate;
}

.material-grid {
  position: absolute;
  z-index: -2;
  inset: 0;
  background-image:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 48px 48px;
  opacity: 0.42;
  mask-image: linear-gradient(135deg, #000, transparent 74%);
}

.material-glow {
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  filter: blur(72px);
}

.material-glow-cyan {
  top: -120px;
  left: 10%;
  width: 480px;
  height: 400px;
  background: rgb(48 130 155 / 24%);
}

.material-glow-silver {
  right: -100px;
  bottom: -180px;
  width: 540px;
  height: 540px;
  background: rgb(179 191 199 / 12%);
}

.glass-navigation,
.glass-booking-card,
.glass-notice {
  border: 1px solid var(--border-strong);
  background: var(--surface-glass);
  box-shadow:
    0 32px 90px rgb(0 0 0 / 22%),
    inset 0 1px rgb(255 255 255 / 8%);
  backdrop-filter: blur(28px) saturate(122%);
}

.showroom[data-preview-theme='light'] .glass-navigation,
.showroom[data-preview-theme='light'] .glass-booking-card,
.showroom[data-preview-theme='light'] .glass-notice {
  box-shadow:
    0 32px 90px rgb(25 35 41 / 12%),
    inset 0 1px rgb(255 255 255 / 85%);
}

.glass-navigation {
  position: absolute;
  top: 32px;
  left: 50%;
  display: flex;
  width: min(660px, calc(100% - 64px));
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 12px 16px;
  border-radius: 16px;
  transform: translateX(-50%);
}

.glass-brand-mark {
  display: grid;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  place-items: center;
  border: 1px solid var(--accent-line);
  border-radius: 8px;
  color: var(--accent);
  background: var(--accent-soft);
}

.glass-links {
  display: flex;
  align-items: center;
  gap: 24px;
  color: var(--text-muted);
  font-size: 12px;
}

.glass-links span.active {
  color: var(--text);
}

.glass-profile {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--control-border);
  border-radius: 50%;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
}

.glass-profile svg {
  width: 16px;
  height: 16px;
}

.scene-floorplan {
  position: absolute;
  top: 144px;
  left: 48px;
  width: min(430px, calc(100% - 96px));
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface) 32%, transparent);
}

.floorplan-header {
  display: grid;
  gap: 4px;
}

.floorplan-header strong {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.floorplan-rows {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  margin-top: 24px;
}

.floorplan-rows span {
  aspect-ratio: 1.2;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface-raised) 44%, transparent);
}

.floorplan-rows span.occupied {
  border-color: var(--border);
  background: color-mix(in srgb, var(--text-muted) 18%, transparent);
}

.glass-booking-card {
  position: absolute;
  top: 152px;
  right: 48px;
  width: min(360px, calc(100% - 96px));
  padding: 24px;
  border-radius: 24px;
}

.glass-card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.glass-card-heading h3 {
  margin: 8px 0 0;
  color: var(--text);
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 36px;
}

.glass-seat-state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--accent-line);
  border-radius: 999px;
  color: var(--accent);
  background: var(--accent-soft);
  font-size: 10px;
}

.glass-seat-state svg {
  width: 12px;
  height: 12px;
}

.glass-booking-details {
  display: grid;
  gap: 16px;
  margin: 20px 0 0;
}

.glass-booking-details div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.glass-booking-details dt {
  color: var(--text-muted);
  font-size: 12px;
}

.glass-booking-details dd {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.glass-card-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.glass-card-footer > span {
  display: grid;
  gap: 2px;
}

.glass-card-footer small {
  color: var(--text-muted);
  font-size: 10px;
}

.glass-card-footer strong {
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.glass-notice {
  position: absolute;
  bottom: 40px;
  left: 48px;
  display: flex;
  width: min(390px, calc(100% - 96px));
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
}

.glass-notice-icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 8px;
  color: var(--accent);
  background: var(--accent-soft);
}

.glass-notice-icon svg {
  width: 16px;
  height: 16px;
}

.glass-notice > span:last-child {
  display: grid;
  gap: 2px;
}

.glass-notice strong {
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
}

.glass-notice small {
  color: var(--text-muted);
  font-size: 10px;
  line-height: 16px;
}

.showroom-footer {
  padding: 24px 64px;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

@supports not (backdrop-filter: blur(1px)) {
  .product-window,
  .section-rail,
  .glass-navigation,
  .glass-booking-card,
  .glass-notice {
    background: var(--surface-raised);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .product-window,
  .section-rail,
  .glass-navigation,
  .glass-booking-card,
  .glass-notice {
    background: var(--surface-raised);
    backdrop-filter: none;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .showroom-section {
    animation: section-enter 720ms var(--ease-out) both;
    animation-timeline: view();
    animation-range: entry 8% cover 26%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .showroom-section {
    animation: none;
  }

  .theme-switch button,
  .preview-button,
  .semantic-token,
  .ramp-swatch,
  .pagination-demo button {
    transition-duration: 1ms;
  }

  .preview-button:hover:enabled,
  .preview-button:active:enabled,
  .semantic-token:hover,
  .ramp-token:hover .ramp-swatch {
    transform: none;
  }
}

@keyframes section-enter {
  from {
    opacity: 0;
    transform: translateY(32px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1180px) {
  .showroom-hero {
    gap: 40px;
    padding: 48px 40px;
  }

  .hero-heading {
    margin: 80px 0 64px;
  }

  .hero-heading h1 {
    font-size: 48px;
  }

  .hero-facts {
    gap: 16px;
  }

  .section-rail,
  .showroom-footer {
    padding-inline: 40px;
  }

  .showroom-content {
    padding-inline: 40px;
  }

  .showroom-section {
    grid-template-columns: 72px minmax(0, 1fr);
    column-gap: 24px;
  }

  .token-explorer,
  .type-system {
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 32px;
  }

  .filter-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-action {
    justify-self: start;
  }

  .data-workspace {
    grid-template-columns: 1fr;
  }

  .status-summary {
    display: grid;
    grid-template-columns: minmax(120px, 0.8fr) 120px minmax(180px, 1fr);
    gap: 16px;
    align-items: center;
  }

  .status-summary-number,
  .status-summary > p,
  .utilization-bar {
    margin-top: 0;
  }

  .status-summary .utilization-bar {
    grid-column: 3;
  }

  .status-sample-list {
    grid-column: 3;
    margin-top: 0;
  }

  .scene-floorplan {
    left: 32px;
    width: 380px;
  }

  .glass-booking-card {
    right: 32px;
  }

  .glass-notice {
    left: 32px;
  }
}

@media (max-width: 980px) {
  .showroom-hero {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .hero-copy-column {
    min-height: 560px;
  }

  .hero-product {
    width: 100%;
    max-width: 680px;
    justify-self: start;
  }

  .section-heading {
    grid-template-columns: 1fr;
  }

  .section-intro {
    grid-column: 1;
    grid-row: auto;
    max-width: 620px;
  }

  .principle-heading h2 {
    font-size: 36px;
  }

  .token-explorer,
  .type-system {
    grid-template-columns: 1fr;
  }

  .token-context {
    padding: 0 0 24px;
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .token-count {
    padding-top: 24px;
  }

  .type-context {
    position: static;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 24px;
    align-items: end;
  }

  .type-glyph {
    grid-row: 1 / span 2;
    margin: 0;
  }

  .type-details {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 0;
  }

  .component-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .button-cluster {
    justify-content: flex-start;
  }

  .component-states {
    grid-template-columns: 1fr 1fr;
  }

  .component-states .state-example:last-child {
    grid-column: 1 / -1;
  }

  .scene-floorplan {
    top: 128px;
    left: 24px;
    width: calc(100% - 48px);
  }

  .glass-booking-card {
    top: 304px;
    right: 24px;
    width: min(420px, calc(100% - 48px));
  }

  .glass-notice {
    bottom: 24px;
    left: 24px;
    width: min(380px, calc(100% - 48px));
  }
}

@media (max-width: 720px) {
  .showroom {
    border-radius: 16px;
  }

  .showroom-grid {
    background-size: 48px 48px;
  }

  .showroom-hero {
    gap: 32px;
    padding: 32px 24px 40px;
  }

  .hero-utility {
    align-items: flex-start;
    flex-direction: column;
  }

  .theme-switch {
    width: 100%;
  }

  .theme-switch button {
    min-height: 40px;
  }

  .hero-copy-column {
    min-height: 520px;
  }

  .hero-heading {
    margin: 64px 0 48px;
  }

  .hero-heading h1 {
    font-size: 36px;
    line-height: 1.08;
  }

  .hero-description {
    margin-top: 24px;
    font-size: 14px;
    line-height: 1.8;
  }

  .hero-facts {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .hero-fact {
    grid-template-columns: 88px minmax(0, 1fr);
    align-items: baseline;
  }

  .hero-fact small {
    grid-column: 2;
  }

  .product-window-bar {
    grid-template-columns: minmax(0, 1fr) 32px;
    padding-inline: 16px;
  }

  .mini-navigation {
    display: none;
  }

  .product-window-body {
    grid-template-columns: 1fr;
  }

  .availability-card {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: start;
  }

  .availability-number {
    margin-top: 0;
    text-align: right;
  }

  .availability-meter,
  .availability-list {
    grid-column: 1 / -1;
  }

  .availability-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .seat-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .product-caption {
    text-align: left;
  }

  .section-rail {
    position: relative;
    top: auto;
    overflow-x: auto;
    padding: 12px 24px;
    overscroll-behavior: contain;
  }

  .section-rail-rule,
  .section-rail-caption {
    display: none;
  }

  .showroom-section {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 80px 0;
    scroll-margin-top: 24px;
  }

  .section-index {
    padding-top: 0;
  }

  .showroom-content {
    padding-inline: 24px;
  }

  .section-heading {
    gap: 16px;
  }

  .section-heading h2,
  .principle-heading h2 {
    font-size: 30px;
    line-height: 1.25;
  }

  .section-intro {
    font-size: 14px;
    line-height: 1.8;
  }

  .principle-list,
  .token-explorer,
  .ramp-gallery,
  .type-system,
  .component-canvas,
  .material-scene {
    grid-column: 1;
  }

  .principle-list {
    margin-top: 40px;
  }

  .principle-item {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 16px;
    padding: 24px 0;
  }

  .principle-token {
    grid-column: 2;
    justify-self: start;
  }

  .principle-item h3 {
    font-size: 20px;
    line-height: 28px;
  }

  .token-explorer {
    margin-top: 40px;
    padding: 24px 16px;
  }

  .semantic-token-grid {
    grid-template-columns: 1fr;
  }

  .semantic-token {
    min-height: 64px;
  }

  .copy-indicator span {
    display: none !important;
  }

  .ramp-gallery {
    gap: 32px;
    margin-top: 40px;
  }

  .ramp-track {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px 4px;
  }

  .ramp-swatch {
    height: 56px;
  }

  .type-system {
    gap: 32px;
    margin-top: 40px;
  }

  .type-context {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .type-glyph {
    grid-row: auto;
    margin-top: 8px;
    font-size: 48px;
  }

  .type-details {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .type-specimen {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 20px 0;
  }

  .type-display {
    font-size: 48px;
  }

  .type-heading-1 {
    font-size: 36px;
  }

  .type-heading-2 {
    font-size: 30px;
  }

  .type-heading-3 {
    font-size: 24px;
  }

  .type-numbers {
    font-size: 12px;
  }

  .component-canvas {
    margin-top: 40px;
  }

  .canvas-topbar {
    padding-inline: 16px;
  }

  .canvas-tabs {
    display: none;
  }

  .canvas-topbar {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .component-toolbar {
    padding: 20px 16px;
  }

  .button-cluster {
    width: 100%;
  }

  .button-cluster .preview-button {
    flex: 1 1 calc(50% - 8px);
  }

  .filter-strip {
    grid-template-columns: 1fr;
    margin-inline: 16px;
  }

  .data-workspace {
    margin-inline: 16px;
  }

  .status-summary {
    display: block;
  }

  .status-summary-number,
  .status-summary > p,
  .status-summary .utilization-bar,
  .status-sample-list {
    margin-top: 16px;
  }

  .table-heading,
  .table-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .component-states {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .component-states .state-example:last-child {
    grid-column: auto;
  }

  .material-section {
    padding-bottom: 80px;
  }

  .material-scene {
    min-height: 720px;
    margin-top: 40px;
  }

  .glass-navigation {
    top: 16px;
    width: calc(100% - 32px);
    gap: 12px;
    padding: 12px;
  }

  .glass-links {
    display: none;
  }

  .glass-navigation .glass-profile {
    margin-left: auto;
  }

  .scene-floorplan {
    top: 104px;
    left: 16px;
    width: calc(100% - 32px);
    padding: 16px;
  }

  .floorplan-rows {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    margin-top: 16px;
  }

  .glass-booking-card {
    top: 304px;
    right: 16px;
    width: calc(100% - 32px);
    padding: 20px;
  }

  .glass-booking-details {
    gap: 12px;
  }

  .glass-card-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .glass-card-footer .preview-button {
    width: 100%;
  }

  .glass-notice {
    bottom: 16px;
    left: 16px;
    width: calc(100% - 32px);
  }

  .showroom-footer {
    align-items: flex-start;
    flex-direction: column;
    padding: 24px;
  }
}

.type-specimen:first-child {
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (max-width: 390px) {
  .showroom-hero,
  .showroom-content {
    padding-inline: 16px;
  }

  .section-rail {
    padding-inline: 16px;
  }

  .hero-heading h1 {
    font-size: 30px;
  }

  .product-floating-note {
    display: none;
  }

  .product-window-body {
    padding: 12px;
  }

  .seat-grid {
    gap: 6px;
  }

  .principle-item {
    grid-template-columns: 32px minmax(0, 1fr);
  }

  .token-explorer {
    padding-inline: 12px;
  }

  .ramp-track {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .button-cluster .preview-button {
    flex-basis: 100%;
  }

  .material-scene {
    min-height: 760px;
  }

  .glass-booking-card {
    top: 294px;
  }

  .glass-card-footer {
    margin-top: 16px;
    padding-top: 16px;
  }
}
</style>
