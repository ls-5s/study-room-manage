import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

/** Reactive wall clock for time windows; refresh immediately after tab suspension. */
export function useNow() {
  const now = shallowRef(new Date())
  let timer: ReturnType<typeof setInterval> | undefined
  const refresh = () => { now.value = new Date() }
  onMounted(() => {
    refresh()
    timer = setInterval(refresh, 1_000)
    document.addEventListener('visibilitychange', refresh)
  })
  onBeforeUnmount(() => {
    if (timer !== undefined) clearInterval(timer)
    document.removeEventListener('visibilitychange', refresh)
  })
  return now
}
