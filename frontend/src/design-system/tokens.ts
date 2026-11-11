export type PreviewTheme = 'light' | 'dark'

export interface ColorToken {
  name: string
  value: string
  role: string
}

export interface ColorRamp {
  name: string
  label: string
  description: string
  tokens: readonly ColorToken[]
}

export const primitiveRamps: readonly ColorRamp[] = [
  {
    name: 'neutral',
    label: '雾银中性色',
    description: '背景、表面、文本和边界的骨架。',
    tokens: [
      { name: 'neutral-0', value: '#FCFCFD', role: '高亮表面' },
      { name: 'neutral-50', value: '#F5F6F7', role: '画布' },
      { name: 'neutral-100', value: '#E8EBED', role: '柔和底色' },
      { name: 'neutral-200', value: '#D3D9DD', role: '分隔线' },
      { name: 'neutral-300', value: '#B5BEC5', role: '强边界' },
      { name: 'neutral-400', value: '#8C989F', role: '辅助图标' },
      { name: 'neutral-500', value: '#66737C', role: '次级文本' },
      { name: 'neutral-600', value: '#4C5962', role: '正文辅助' },
      { name: 'neutral-700', value: '#343F47', role: '深色表面' },
      { name: 'neutral-800', value: '#222B31', role: '主操作' },
      { name: 'neutral-900', value: '#141A1F', role: '标题文本' },
      { name: 'neutral-950', value: '#090D10', role: '深色画布' },
    ],
  },
  {
    name: 'accent',
    label: '冰川强调色',
    description: '焦点、链接、选中和数据强调，只承担一种含义。',
    tokens: [
      { name: 'accent-50', value: '#F0F8FB', role: '强调底色' },
      { name: 'accent-100', value: '#DFF0F6', role: '选中浅底' },
      { name: 'accent-200', value: '#C5E3ED', role: '柔和边界' },
      { name: 'accent-300', value: '#9BCEE0', role: '悬停' },
      { name: 'accent-400', value: '#70B4CE', role: '数据强调' },
      { name: 'accent-500', value: '#4F96B3', role: '深色焦点' },
      { name: 'accent-600', value: '#3D788F', role: '浅色焦点' },
      { name: 'accent-700', value: '#326173', role: '链接文字' },
      { name: 'accent-800', value: '#2C4F5D', role: '深色选中' },
      { name: 'accent-900', value: '#28424D', role: '数据背景' },
      { name: 'accent-950', value: '#172D36', role: '深色强调底' },
    ],
  },
  {
    name: 'success',
    label: '成功',
    description: '已解决、已完成和可用状态。',
    tokens: [
      { name: 'success-50', value: '#EEF8F2', role: '状态底色' },
      { name: 'success-100', value: '#DAEFE2', role: '浅色标签' },
      { name: 'success-200', value: '#B9DDCA', role: '柔和边界' },
      { name: 'success-300', value: '#91C9AC', role: '辅助图形' },
      { name: 'success-400', value: '#67AE8B', role: '深色图标' },
      { name: 'success-500', value: '#4A8D6C', role: '深色主色' },
      { name: 'success-600', value: '#3A7358', role: '浅色主色' },
      { name: 'success-700', value: '#315D49', role: '文字' },
      { name: 'success-800', value: '#2B4B3C', role: '深色边界' },
      { name: 'success-900', value: '#263F34', role: '深色底' },
      { name: 'success-950', value: '#14231C', role: '深色画布' },
    ],
  },
  {
    name: 'warning',
    label: '提醒',
    description: '待处理、风险提示和需要注意的状态。',
    tokens: [
      { name: 'warning-50', value: '#FBF7EC', role: '状态底色' },
      { name: 'warning-100', value: '#F5EBD3', role: '浅色标签' },
      { name: 'warning-200', value: '#E9D5A5', role: '柔和边界' },
      { name: 'warning-300', value: '#DAB971', role: '辅助图形' },
      { name: 'warning-400', value: '#C99D48', role: '深色图标' },
      { name: 'warning-500', value: '#AE7E2D', role: '深色主色' },
      { name: 'warning-600', value: '#906523', role: '浅色主色' },
      { name: 'warning-700', value: '#74511F', role: '文字' },
      { name: 'warning-800', value: '#5F431F', role: '深色边界' },
      { name: 'warning-900', value: '#50391D', role: '深色底' },
      { name: 'warning-950', value: '#302111', role: '深色画布' },
    ],
  },
  {
    name: 'danger',
    label: '危险',
    description: '驳回、撤销和不可逆操作。',
    tokens: [
      { name: 'danger-50', value: '#FCF1F0', role: '状态底色' },
      { name: 'danger-100', value: '#F9DFDD', role: '浅色标签' },
      { name: 'danger-200', value: '#F2C2BF', role: '柔和边界' },
      { name: 'danger-300', value: '#E79C98', role: '辅助图形' },
      { name: 'danger-400', value: '#D9756F', role: '深色图标' },
      { name: 'danger-500', value: '#C55751', role: '深色主色' },
      { name: 'danger-600', value: '#A8423D', role: '浅色主色' },
      { name: 'danger-700', value: '#893632', role: '文字' },
      { name: 'danger-800', value: '#712F2C', role: '深色边界' },
      { name: 'danger-900', value: '#5F2B29', role: '深色底' },
      { name: 'danger-950', value: '#361716', role: '深色画布' },
    ],
  },
] as const

export const semanticTokens: Readonly<Record<PreviewTheme, readonly ColorToken[]>> = {
  light: [
    { name: '--preview-bg', value: '#F5F6F7', role: '页面背景' },
    { name: '--preview-surface', value: 'rgba(255, 255, 255, 0.72)', role: '毛玻璃表面' },
    { name: '--preview-surface-solid', value: '#FFFFFF', role: '实色表面' },
    { name: '--preview-text', value: '#141A1F', role: '主要文本' },
    { name: '--preview-text-secondary', value: '#4C5962', role: '正文辅助' },
    { name: '--preview-text-muted', value: '#66737C', role: '说明文本' },
    { name: '--preview-border', value: 'rgba(20, 26, 31, 0.10)', role: '普通边界' },
    { name: '--preview-border-strong', value: 'rgba(20, 26, 31, 0.22)', role: '强边界' },
    { name: '--preview-accent', value: '#3D788F', role: '焦点与链接' },
    { name: '--preview-action', value: '#222B31', role: '主操作背景' },
    { name: '--preview-action-text', value: '#FCFCFD', role: '主操作文字' },
  ],
  dark: [
    { name: '--preview-bg', value: '#090D10', role: '页面背景' },
    { name: '--preview-surface', value: 'rgba(18, 24, 29, 0.68)', role: '毛玻璃表面' },
    { name: '--preview-surface-solid', value: '#141A1F', role: '实色表面' },
    { name: '--preview-text', value: '#F1F4F6', role: '主要文本' },
    { name: '--preview-text-secondary', value: '#BCC5CB', role: '正文辅助' },
    { name: '--preview-text-muted', value: '#8C989F', role: '说明文本' },
    { name: '--preview-border', value: 'rgba(255, 255, 255, 0.10)', role: '普通边界' },
    { name: '--preview-border-strong', value: 'rgba(255, 255, 255, 0.20)', role: '强边界' },
    { name: '--preview-accent', value: '#70B4CE', role: '焦点与链接' },
    { name: '--preview-action', value: '#F1F4F6', role: '主操作背景' },
    { name: '--preview-action-text', value: '#090D10', role: '主操作文字' },
  ],
}

export const typeSpecimens = [
  {
    className: 'type-display',
    label: 'Display',
    spec: '60 / 60 · Semibold',
    sample: '安静，自有秩序。',
  },
  {
    className: 'type-heading-1',
    label: 'Heading 1',
    spec: '48 / 52 · Semibold',
    sample: '让复杂信息清晰可见',
  },
  {
    className: 'type-heading-2',
    label: 'Heading 2',
    spec: '36 / 44 · Semibold',
    sample: '空间与时间的秩序',
  },
  {
    className: 'type-heading-3',
    label: 'Heading 3',
    spec: '30 / 36 · Semibold',
    sample: '每一处细节都有理由',
  },
  {
    className: 'type-heading-4',
    label: 'Heading 4',
    spec: '24 / 32 · Semibold',
    sample: '预约概览',
  },
  {
    className: 'type-title',
    label: 'Title',
    spec: '18 / 28 · Medium',
    sample: '今日学习安排',
  },
  {
    className: 'type-body',
    label: 'Body',
    spec: '16 / 24 · Regular',
    sample: '保持清晰的层级与足够的留白，让每一次操作都自然、安静。',
  },
  {
    className: 'type-caption',
    label: 'Caption',
    spec: '12 / 16 · Regular',
    sample: '最近更新 · 2026.11.11',
  },
] as const
