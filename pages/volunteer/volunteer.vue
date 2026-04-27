<template>
  <view class="page">
    <view class="top-card">
      <view>
        <view class="page-title">志愿者响应中心</view>
        <view class="sub-title">附近求助事件 · 实时协同响应</view>
      </view>
      <view
        class="status-badge"
        :class="{
          idle: currentStatus === 'idle',
          sos: currentStatus === 'sos',
          responding: currentStatus === 'responding',
          arrived: currentStatus === 'arrived',
          safe: currentStatus === 'safe'
        }"
      >
        {{ pageStatusText }}
      </view>
    </view>

    <view class="map-card">
      <view class="card-header">
        <text class="card-title">附近求助地图</text>
        <text class="card-tip">红色为求助者，绿色为响应志愿者</text>
      </view>

      <map
        id="volunteerMap"
        class="map"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :scale="17"
        :markers="mapMarkers"
        :circles="mapCircles"
        show-location
      ></map>
    </view>

    <view class="action-card">
      <view class="distance-box">
        <view class="distance-item">
          <text class="distance-label">我的状态</text>
          <text class="distance-value">{{ selfVolunteer.status }}</text>
        </view>

        <view class="distance-item">
          <text class="distance-label">预计到达</text>
          <text class="distance-value">{{ selfEtaText }}</text>
        </view>
      </view>

      <view
        v-if="currentStatus === 'sos' && selfVolunteer.status === '待响应'"
        class="main-btn respond-btn"
        @click="handleRespond"
      >
        立即响应
      </view>

      <view
        v-else-if="currentStatus === 'responding'"
        class="main-btn arrive-btn"
        @click="handleArrive"
      >
        我已到达
      </view>

      <view
        v-else-if="currentStatus === 'arrived'"
        class="main-btn arrived-btn"
      >
        已到达现场
      </view>

      <view
        v-else-if="currentStatus === 'safe'"
        class="main-btn safe-btn"
      >
        已上报安全
      </view>

      <view
        v-else
        class="main-btn safe-btn"
      >
        等待新任务
      </view>
    </view>

    <view class="task-card">
      <view class="card-title">当前救助任务</view>

      <view class="detail-row">
        <text class="detail-label">求助人</text>
        <text class="detail-value">{{ taskInfo.name }}</text>
      </view>

      <view class="detail-row">
        <text class="detail-label">时间</text>
        <text class="detail-value">{{ taskInfo.time }}</text>
      </view>

      <view class="detail-row">
        <text class="detail-label">地点</text>
        <text class="detail-value">{{ taskInfo.location }}</text>
      </view>

      <view class="detail-row">
        <text class="detail-label">联系方式</text>
        <text class="detail-value">{{ taskInfo.phoneMasked }}</text>
      </view>

      <view class="detail-row">
        <text class="detail-label">风险等级</text>
        <text class="detail-value danger-text">{{ taskInfo.risk }}</text>
      </view>

      <view class="detail-row">
        <text class="detail-label">任务状态</text>
        <text class="detail-value success-text">{{ pageStatusText }}</text>
      </view>

      <view class="detail-row align-start">
        <text class="detail-label">事件描述</text>
        <text class="detail-value multiline">{{ taskInfo.desc }}</text>
      </view>

      <view class="task-actions">
        <view class="sub-btn light-btn" @click="handleContact">联系求助者</view>
        <view class="sub-btn phone-btn" @click="handleCall">拨打电话</view>
      </view>

      <view
        v-if="currentStatus === 'arrived'"
        class="sub-btn safe-report-btn"
        @click="handleSafeReport"
      >
        上报已安全
      </view>
    </view>

    <view class="response-card">
      <view class="card-title">当前响应志愿者</view>

      <view
        v-for="item in respondedVolunteers"
        :key="item.id"
        class="volunteer-item"
      >
        <image class="volunteer-avatar" :src="item.avatar" mode="aspectFill"></image>

        <view class="volunteer-main">
          <view class="volunteer-top">
            <text class="volunteer-name">{{ item.name }}</text>
            <text class="volunteer-score">{{ item.stars }}</text>
          </view>

          <view class="volunteer-sub">{{ item.age }}岁 · {{ item.job }}</view>
          <view class="volunteer-sub">
            累计救助 {{ item.count }} 次 · 距离 {{ getVolunteerDistanceText(item) }} · 进度 {{ item.progress }}%
          </view>
        </view>

        <view
          class="volunteer-tag"
          :class="{
            waitingTag: item.status === '待响应',
            movingTag: item.status === '前往中',
            arrivedTag: item.status === '已到达'
          }"
        >
          {{ item.status }}
        </view>
      </view>
    </view>

    <view class="excellent-card">
      <view class="card-title">附近优秀志愿者</view>

      <view
        v-for="item in excellentVolunteers"
        :key="item.id"
        class="volunteer-item"
      >
        <image class="volunteer-avatar" :src="item.avatar" mode="aspectFill"></image>

        <view class="volunteer-main">
          <view class="volunteer-top">
            <text class="volunteer-name">{{ item.name }}</text>
            <text class="volunteer-score">{{ item.stars }}</text>
          </view>

          <view class="volunteer-sub">{{ item.age }}岁 · {{ item.job }}</view>
          <view class="volunteer-sub">累计救助 {{ item.count }} 次</view>
        </view>

        <view class="volunteer-tag excellentTag">{{ item.honor }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow, onHide, onPullDownRefresh } from '@dcloudio/uni-app'

const CENTER = { latitude: 19.99839, longitude: 110.152305 }
const STORAGE_KEY = 'sos_task_state_v3'

const RED_ZONES = [
  { id: 1, latitude: 19.99892, longitude: 110.15288, radius: 26 },
  { id: 2, latitude: 19.99818, longitude: 110.15196, radius: 24 }
]

const GRAY_ZONES = [
  { id: 1, latitude: 19.99862, longitude: 110.15252, radius: 18 },
  { id: 2, latitude: 19.99836, longitude: 110.15216, radius: 16 }
]

const mapCenter = ref({ ...CENTER })
const requesterPosition = ref({ ...CENTER })
const volunteers = ref([])
const currentStatus = ref('idle')
const promptedTaskId = ref('')
const taskInfo = ref({
  name: '李春梅',
  time: '',
  location: '村东侧小路口',
  phone: '13812345678',
  phoneMasked: '138****5678',
  risk: '高风险',
  desc: '当前暂无求助任务。'
})
let syncTimer = null

function defaultVolunteers() {
  return [
    {
      id: 1,
      name: '王秀兰',
      age: 46,
      job: '村医',
      count: 28,
      stars: '★★★★★',
      honor: '优秀志愿者',
      avatar: '/static/avatar-volunteer.png',
      isSelf: true,
      status: '待响应',
      progress: 0,
      etaText: '待响应',
      latitude: 19.99868,
      longitude: 110.15264,
      initLatitude: 19.99868,
      initLongitude: 110.15264,
      autoRespondAt: 0,
      moveStartAt: 0,
      moveDurationSec: 80,
      startLatitude: 19.99868,
      startLongitude: 110.15264
    },
    {
      id: 2,
      name: '李国英',
      age: 52,
      job: '护林员',
      count: 19,
      stars: '★★★★☆',
      honor: '联防先进个人',
      avatar: '/static/avatar-volunteer.png',
      isSelf: false,
      status: '待响应',
      progress: 0,
      etaText: '待响应',
      latitude: 19.99812,
      longitude: 110.15202,
      initLatitude: 19.99812,
      initLongitude: 110.15202,
      autoRespondAt: 0,
      moveStartAt: 0,
      moveDurationSec: 24,
      startLatitude: 19.99812,
      startLongitude: 110.15202
    },
    {
      id: 3,
      name: '张秋霞',
      age: 39,
      job: '妇女主任',
      count: 24,
      stars: '★★★★☆',
      honor: '互助先锋',
      avatar: '/static/avatar-volunteer.png',
      isSelf: false,
      status: '待响应',
      progress: 0,
      etaText: '待响应',
      latitude: 19.99798,
      longitude: 110.15272,
      initLatitude: 19.99798,
      initLongitude: 110.15272,
      autoRespondAt: 0,
      moveStartAt: 0,
      moveDurationSec: 26,
      startLatitude: 19.99798,
      startLongitude: 110.15272
    }
  ]
}

function deepClone(v) {
  return JSON.parse(JSON.stringify(v))
}

function offsetById(id) {
  if (id === 2) return { lat: 0.00003, lng: 0.00002 }
  if (id === 3) return { lat: -0.00003, lng: -0.00002 }
  return { lat: 0, lng: 0 }
}

function normalizeState(raw) {
  const base = defaultVolunteers()
  if (!raw || !Array.isArray(raw.volunteers)) {
    return {
      taskId: '',
      alertState: 'none',
      systemStatus: 'idle',
      requesterPosition: { ...CENTER },
      locationLabel: '村东侧小路口（演示定位）',
      riskValue: 15,
      volunteers: base,
      updatedAt: Date.now()
    }
  }
  const volunteersData = base.map((item) => {
    const found = raw.volunteers.find((v) => v.id === item.id) || {}
    return { ...item, ...found }
  })
  return {
    taskId: raw.taskId || '',
    alertState: raw.alertState || 'none',
    systemStatus: raw.systemStatus || 'idle',
    requesterPosition: raw.requesterPosition || { ...CENTER },
    locationLabel: raw.locationLabel || '村东侧小路口（演示定位）',
    riskValue: typeof raw.riskValue === 'number' ? raw.riskValue : 15,
    volunteers: volunteersData,
    updatedAt: raw.updatedAt || Date.now()
  }
}

function recomputeStatus(state) {
  if (!state.taskId) {
    state.systemStatus = 'idle'
    return
  }
  if (state.alertState === 'safe') {
    state.systemStatus = 'safe'
    return
  }
  const hasMoving = state.volunteers.some((v) => v.status === '前往中')
  const hasArrived = state.volunteers.some((v) => v.status === '已到达')
  if (hasMoving) state.systemStatus = 'responding'
  else if (hasArrived) state.systemStatus = 'arrived'
  else state.systemStatus = 'sos'
}

function updateMovingVolunteer(v, state, now) {
  if (v.status !== '前往中') return false
  const duration = Math.max(8, Number(v.moveDurationSec) || (v.isSelf ? 80 : 24))
  if (!v.moveStartAt) {
    v.moveStartAt = now
    v.startLatitude = v.latitude
    v.startLongitude = v.longitude
  }
  const offset = offsetById(v.id)
  const targetLat = state.requesterPosition.latitude + offset.lat
  const targetLng = state.requesterPosition.longitude + offset.lng
  const progress = Math.min(1, (now - v.moveStartAt) / (duration * 1000))

  v.latitude = Number((v.startLatitude + (targetLat - v.startLatitude) * progress).toFixed(6))
  v.longitude = Number((v.startLongitude + (targetLng - v.startLongitude) * progress).toFixed(6))
  v.progress = Math.min(100, Math.round(progress * 100))

  if (progress >= 1) {
    v.status = '已到达'
    v.progress = 100
    v.etaText = '已到达'
    return true
  }

  const remainSec = Math.max(1, Math.ceil(duration * (1 - progress)))
  v.etaText = `${remainSec}秒`
  return true
}

function applyAutoRules(state, now) {
  let changed = false
  for (const v of state.volunteers) {
    if (v.isSelf) continue
    if (v.status === '待响应' && v.autoRespondAt && now >= v.autoRespondAt) {
      v.status = '前往中'
      v.moveStartAt = now
      v.startLatitude = v.latitude
      v.startLongitude = v.longitude
      v.progress = 1
      v.etaText = `${Math.max(1, Math.ceil(v.moveDurationSec || 24))}秒`
      changed = true
    }
    if (updateMovingVolunteer(v, state, now)) changed = true
  }

  const self = state.volunteers.find((v) => v.isSelf)
  if (self && updateMovingVolunteer(self, state, now)) changed = true

  for (const v of state.volunteers) {
    if (v.status === '已到达') {
      v.progress = 100
      v.etaText = '已到达'
    }
  }

  recomputeStatus(state)
  return changed
}

function saveState(state) {
  state.updatedAt = Date.now()
  uni.setStorageSync(STORAGE_KEY, state)
}

function updateViewByState(state) {
  requesterPosition.value = { ...state.requesterPosition }
  mapCenter.value = { ...state.requesterPosition }
  volunteers.value = deepClone(state.volunteers)
  currentStatus.value = state.systemStatus

  taskInfo.value = {
    name: '李春梅',
    time: new Date(state.updatedAt).toLocaleString(),
    location: state.locationLabel.replace('（演示定位）', ''),
    phone: '13812345678',
    phoneMasked: '138****5678',
    risk: state.riskValue >= 80 ? '高风险' : '中风险',
    desc: !state.taskId ? '当前暂无求助任务。' : '系统检测到风险，已广播附近志愿者。'
  }
}

function maybePromptRespond(state) {
  if (!state.taskId || state.alertState !== 'pending') return
  if (promptedTaskId.value === state.taskId) return
  const self = state.volunteers.find((v) => v.isSelf)
  if (!self || self.status !== '待响应') return

  promptedTaskId.value = state.taskId
  try { uni.vibrateLong() } catch (e) {}

  uni.showModal({
    title: '收到 SOS 求助',
    content: '是否立即响应并前往求助者位置？',
    confirmText: '响应',
    cancelText: '不响应',
    success: (res) => {
      if (res.confirm) {
        handleRespond()
      } else {
        uni.showToast({ title: '已选择不响应', icon: 'none' })
      }
    }
  })
}

function syncStateAndTick() {
  const raw = uni.getStorageSync(STORAGE_KEY)
  const state = normalizeState(raw)
  const changed = applyAutoRules(state, Date.now())
  updateViewByState(state)
  maybePromptRespond(state)
  if (changed) saveState(state)
}

function handleRespond() {
  const raw = uni.getStorageSync(STORAGE_KEY)
  const state = normalizeState(raw)
  if (!state.taskId) return

  const self = state.volunteers.find((v) => v.isSelf)
  if (!self || self.status !== '待响应') return

  const now = Date.now()
  self.status = '前往中'
  self.moveStartAt = now
  self.startLatitude = self.latitude
  self.startLongitude = self.longitude
  self.moveDurationSec = 80
  self.progress = 1
  self.etaText = `${self.moveDurationSec}秒`

  state.alertState = 'accepted'
  recomputeStatus(state)
  saveState(state)
  updateViewByState(state)
  uni.showToast({ title: '响应成功', icon: 'none' })
}

function handleArrive() {
  const raw = uni.getStorageSync(STORAGE_KEY)
  const state = normalizeState(raw)
  if (!state.taskId) return

  const self = state.volunteers.find((v) => v.isSelf)
  if (!self) return

  self.status = '已到达'
  self.latitude = state.requesterPosition.latitude
  self.longitude = state.requesterPosition.longitude
  self.progress = 100
  self.etaText = '已到达'

  recomputeStatus(state)
  saveState(state)
  updateViewByState(state)
  uni.showToast({ title: '到达签到成功', icon: 'none' })
}

function handleSafeReport() {
  const raw = uni.getStorageSync(STORAGE_KEY)
  const state = normalizeState(raw)
  if (!state.taskId) return

  state.alertState = 'safe'
  state.systemStatus = 'safe'
  state.taskId = ''
  state.volunteers = defaultVolunteers()
  saveState(state)
  updateViewByState(state)
  uni.showToast({ title: '已上报安全', icon: 'none' })
}

function handleContact() {
  uni.showToast({ title: '已发起站内联系', icon: 'none' })
}

function handleCall() {
  uni.makePhoneCall({ phoneNumber: taskInfo.value.phone })
}

function startSync() {
  if (syncTimer) clearInterval(syncTimer)
  syncTimer = setInterval(syncStateAndTick, 500)
}

function stopSync() {
  if (syncTimer) clearInterval(syncTimer)
  syncTimer = null
}

const selfVolunteer = computed(() => {
  return volunteers.value.find((v) => v.isSelf) || defaultVolunteers()[0]
})

const respondedVolunteers = computed(() => {
  return volunteers.value.filter((v) => v.status !== '待响应')
})

const excellentVolunteers = computed(() => volunteers.value)

const pageStatusText = computed(() => {
  const map = {
    idle: '待命中',
    sos: '收到 SOS',
    responding: '前往中',
    arrived: '已到达',
    safe: '已上报安全'
  }
  return map[currentStatus.value] || '待命中'
})

const hasActiveTask = computed(() => {
  return currentStatus.value !== 'idle' && currentStatus.value !== 'safe'
})

function getVolunteerDistanceText(item) {
  const latDiff = requesterPosition.value.latitude - item.latitude
  const lngDiff = requesterPosition.value.longitude - item.longitude
  const meter = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000
  if (meter < 1000) return `${Math.round(meter)}米`
  return `${(meter / 1000).toFixed(2)}公里`
}

const selfEtaText = computed(() => {
  if (currentStatus.value === 'idle') return '待命中'
  if (selfVolunteer.value.status === '已到达') return '已到达'
  if (selfVolunteer.value.status === '待响应') return '待响应'
  return selfVolunteer.value.etaText || '计算中'
})

const mapCircles = computed(() => {
  const grayCircles = GRAY_ZONES.map((zone) => ({
    latitude: zone.latitude,
    longitude: zone.longitude,
    radius: zone.radius,
    color: '#8d99ae',
    fillColor: '#8d99ae66',
    strokeWidth: 2
  }))
  const redCircles = RED_ZONES.map((zone) => ({
    latitude: zone.latitude,
    longitude: zone.longitude,
    radius: zone.radius,
    color: '#ff4d4f',
    fillColor: '#ff4d4f77',
    strokeWidth: 2
  }))
  return [...grayCircles, ...redCircles]
})

const mapMarkers = computed(() => {
  const requesterMarker = {
    id: 100,
    latitude: requesterPosition.value.latitude,
    longitude: requesterPosition.value.longitude,
    width: 28,
    height: 34,
    zIndex: 999,
    anchor: { x: 0.5, y: 1 },
    iconPath: hasActiveTask.value ? '/static/user-sos.png' : '/static/user-blue.png',
    callout: {
      content: hasActiveTask.value ? '求助者｜求助中' : '求助者｜已安全',
      color: '#ffffff',
      fontSize: 11,
      borderRadius: 8,
      bgColor: hasActiveTask.value ? '#ff4d4f' : '#4f8cff',
      padding: 6,
      display: 'ALWAYS'
    }
  }

  const volunteerMarkers = volunteers.value.map((item) => {
    const active = item.status !== '待响应'
    return {
      id: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      width: active ? 20 : 18,
      height: active ? 24 : 22,
      zIndex: item.isSelf ? 20 : 10,
      anchor: { x: 0.5, y: 1 },
      iconPath: active ? '/static/volunteer-green.png' : '/static/volunteer-blue.png',
      callout: {
        content: `${item.name}｜${item.status} ${item.progress}%`,
        color: '#ffffff',
        fontSize: 10,
        borderRadius: 8,
        bgColor: active ? '#22b573' : '#2d6cff',
        padding: 6,
        display: item.isSelf ? 'ALWAYS' : 'BYCLICK'
      }
    }
  })

  return [...volunteerMarkers, requesterMarker]
})

onPullDownRefresh(() => {
  syncStateAndTick()
  uni.showToast({ title: '已刷新', icon: 'none' })
  setTimeout(() => uni.stopPullDownRefresh(), 300)
})

onMounted(() => {
  syncStateAndTick()
  startSync()
})

onShow(() => {
  syncStateAndTick()
  startSync()
})

onHide(() => {
  stopSync()
})

onUnmounted(() => {
  stopSync()
})
</script>

<style scoped>
.page {
  height: 100vh;
  min-height: 100vh;
  background: #f4f6fb;
  padding: 24rpx;
  box-sizing: border-box;
  padding-bottom: 60rpx;
}

.top-card,
.map-card,
.action-card,
.task-card,
.response-card,
.excellent-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 22rpx;
  box-shadow: 0 10rpx 24rpx rgba(31, 42, 68, 0.06);
  margin-bottom: 24rpx;
}

.top-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20rpx;
}

.page-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #1f2a44;
}

.sub-title {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7a8599;
}

.status-badge {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #fff;
  font-weight: 700;
  white-space: nowrap;
}

.idle { background: #8d99ae; }
.sos { background: #e85b5b; }
.responding { background: #22b573; }
.arrived { background: #ff9d2e; }
.safe { background: #4f8cff; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
  gap: 12rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2a44;
  margin-bottom: 16rpx;
}

.card-tip {
  font-size: 22rpx;
  color: #6d7890;
}

.map {
  width: 100%;
  height: 430rpx;
  border-radius: 24rpx;
  overflow: hidden;
}

.distance-box {
  display: flex;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.distance-item {
  flex: 1;
  background: #f8faff;
  border-radius: 18rpx;
  padding: 18rpx;
}

.distance-label {
  display: block;
  font-size: 22rpx;
  color: #7a8599;
}

.distance-value {
  display: block;
  margin-top: 10rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2a44;
}

.main-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
}

.respond-btn { background: linear-gradient(135deg, #2ccb7f, #22b573); color: #fff; }
.arrive-btn { background: linear-gradient(135deg, #ff7d7d, #e85b5b); color: #fff; }
.moving-btn { background: #eef6f2; color: #22b573; }
.arrived-btn { background: #fff3e8; color: #ff8a00; }
.safe-btn { background: #eef3ff; color: #4f8cff; }

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #eef1f6;
}

.detail-row:last-child { border-bottom: none; }
.align-start { align-items: flex-start; }

.detail-label {
  width: 140rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  color: #7a8599;
}

.detail-value {
  flex: 1;
  text-align: right;
  font-size: 25rpx;
  color: #1f2a44;
  word-break: break-all;
}

.multiline { line-height: 1.7; }
.danger-text { color: #ff4d4f; font-weight: 700; }
.success-text { color: #22b573; font-weight: 700; }

.task-actions {
  margin-top: 22rpx;
  display: flex;
  gap: 16rpx;
}

.sub-btn {
  flex: 1;
  height: 76rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 700;
}

.light-btn { background: #eef3ff; color: #4f8cff; }
.phone-btn { background: #e9f8ef; color: #22b573; }
.safe-report-btn {
  margin-top: 16rpx;
  width: 100%;
  background: linear-gradient(135deg, #ffb156, #ff8a00);
  color: #fff;
}

.volunteer-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eef1f6;
}

.volunteer-item:last-child { border-bottom: none; }

.volunteer-avatar {
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  background: #eef2f7;
  flex-shrink: 0;
}

.volunteer-main { flex: 1; }
.volunteer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
}

.volunteer-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2a44;
}

.volunteer-score {
  font-size: 22rpx;
  color: #ffb400;
}

.volunteer-sub {
  margin-top: 6rpx;
  font-size: 23rpx;
  color: #7a8599;
}

.volunteer-tag {
  min-width: 120rpx;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: 700;
}

.waitingTag { background: #eef3ff; color: #4f8cff; }
.movingTag { background: #e9f8ef; color: #22b573; }
.arrivedTag { background: #fff3e8; color: #ff8a00; }
.excellentTag { background: #fff1f2; color: #e85b5b; }
</style>
