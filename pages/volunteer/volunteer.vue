<template>
  <view v-if="isVolunteerRegistered" class="page">
    <view class="top-card">
      <view>
        <view class="page-title">志愿者</view>
        <view class="sub-title">接收求助任务 · 响应任务 · 查看前往状态</view>
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

    <view v-if="!hasActiveTask" class="task-card">
      <view class="card-title">暂无待响应求助</view>
      <view class="volunteer-sub">请等待附近用户发起 SOS</view>
    </view>

    <view v-if="hasActiveTask && hasResponded" class="action-card">
      <view class="card-title">我的响应状态</view>
      <view class="distance-box">
        <view class="distance-item">
          <text class="distance-label">状态</text>
          <text class="distance-value">{{ selfVolunteer.status }}</text>
        </view>

        <view class="distance-item">
          <text class="distance-label">ETA</text>
          <text class="distance-value">{{ selfEtaText }}</text>
        </view>
      </view>
      <view class="eta-row">
        <text class="eta-text">进度：{{ selfVolunteer.progress || 0 }}%</text>
        <text class="eta-percent">{{ selfVolunteer.etaText || '计算中' }}</text>
      </view>
      <view class="track">
        <view class="fill" :style="{ width: `${selfVolunteer.progress || 0}%` }" />
      </view>
      <view class="volunteer-sub">请尽快前往求助位置，并注意自身安全</view>
      <view v-if="selfVolunteer.progress >= 100" class="main-btn arrived-btn">
        已到达现场
      </view>
      <view v-else class="main-btn moving-btn">
        前往中
      </view>
    </view>

    <view v-if="hasActiveTask" class="task-card">
      <view class="card-title">当前待响应求助</view>

      <view class="detail-row">
        <text class="detail-label">求助位置</text>
        <text class="detail-value">{{ taskInfo.locationLabel || taskInfo.location }}</text>
      </view>

      <view class="detail-row">
        <text class="detail-label">风险指数</text>
        <text class="detail-value danger-text">{{ taskInfo.riskValue || '--' }}</text>
      </view>

      <view class="detail-row">
        <text class="detail-label">系统状态</text>
        <text class="detail-value success-text">{{ taskInfo.systemStatus || pageStatusText }}</text>
      </view>

      <view class="detail-row">
        <text class="detail-label">任务编号</text>
        <text class="detail-value">{{ taskId }}</text>
      </view>

      <view class="detail-row align-start">
        <text class="detail-label">事件描述</text>
        <text class="detail-value multiline">附近用户发起 SOS，请根据地图位置尽快响应。</text>
      </view>

      <view
        v-if="!hasResponded"
        class="main-btn respond-btn register-entry-btn"
        @click="handleRespond"
      >
        立即响应
      </view>
      <view v-else-if="selfVolunteer.progress >= 100" class="main-btn arrived-btn register-entry-btn">
        已到达
      </view>
      <view v-else class="main-btn moving-btn register-entry-btn">
        前往中
      </view>
    </view>

    <view v-if="hasActiveTask" class="response-card">
      <view class="card-title">附近响应力量</view>

      <view
        v-for="item in volunteers"
        :key="item.id"
        class="volunteer-item"
      >
        <image class="volunteer-avatar" :src="item.avatar" mode="aspectFill"></image>

        <view class="volunteer-main">
          <view class="volunteer-top">
            <text class="volunteer-name">{{ item.name }}</text>
            <text class="volunteer-score">{{ item.stars }}</text>
          </view>

          <view class="volunteer-sub">{{ getVolunteerRole(item) }}</view>
          <view class="volunteer-sub">
            ETA {{ item.etaText || '待响应' }} · 距离 {{ getVolunteerDistanceText(item) }} · 进度 {{ item.progress || 0 }}%
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

    <view v-show="isVolunteerRegistered" class="volunteer-profile-card">
      <view class="card-title">我的志愿者信息</view>
      <view class="detail-row">
        <text class="detail-label">性别</text>
        <text class="detail-value">{{ volunteerProfile.gender }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">工作</text>
        <text class="detail-value">{{ volunteerProfile.job }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">荣誉</text>
        <text class="detail-value">{{ volunteerProfile.honor }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">志愿时长</text>
        <text class="detail-value">{{ volunteerProfile.serviceHours }} 小时</text>
      </view>
    </view>
  </view>

  <view v-else class="page">
    <view class="task-card volunteer-register-card">
      <view class="card-title">志愿者注册</view>
      <view class="volunteer-sub">请先完成志愿者资料登记，登记后才能进入响应中心。</view>

      <view class="detail-row">
        <text class="detail-label">性别</text>
        <input class="register-input" v-model="registerForm.gender" placeholder="请输入性别" />
      </view>
      <view class="detail-row">
        <text class="detail-label">年龄</text>
        <input class="register-input" v-model="registerForm.age" type="number" placeholder="请输入年龄" />
      </view>
      <view class="detail-row">
        <text class="detail-label">工作</text>
        <input class="register-input" v-model="registerForm.job" placeholder="如：退役老兵 / 村医 / 保安" />
      </view>
      <view class="detail-row">
        <text class="detail-label">荣誉</text>
        <input class="register-input" v-model="registerForm.honor" placeholder="如：五星志愿者" />
      </view>
      <view class="detail-row">
        <text class="detail-label">志愿时长</text>
        <input class="register-input" v-model="registerForm.serviceHours" type="number" placeholder="请输入小时数" />
      </view>

      <view class="main-btn respond-btn register-entry-btn" @click="handleVolunteerRegister">完成注册</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow, onHide, onPullDownRefresh, onBackPress } from '@dcloudio/uni-app'

const CENTER = { latitude: 19.99839, longitude: 110.152305 }
const VOLUNTEER_PROFILE_KEY = 'volunteerProfile'

// ✅ 后端地址：把 192.168.xx.xx 改成你电脑的 IPv4 地址，端口按 server.js 是 5000
const BASE_URL =  'http://192.168.43.66:5000'

function request(url, method = 'GET', data = {}, token = '') {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      },
      success: (res) => resolve(res.data),
      fail: reject
    })
  })
}

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
const taskId = ref(null)
const hasActiveTask = ref(false)
const userInfo = ref({})
const volunteerProfile = ref({})
const isVolunteerRegistered = ref(false)
const registerForm = ref({
  gender: '',
  age: '',
  job: '',
  honor: '',
  serviceHours: ''
})
const taskInfo = ref({
  name: '李春梅',
  time: '',
  location: '村东侧小路口',
  phone: '13812345678',
  phoneMasked: '138****5678',
  risk: '高风险',
  desc: '当前暂无求助任务。'
})
let backendPollTimer = null
let activePollTimer = null
let profileSyncTimer = null
let profileSnapshot = ''
let promptedTaskId = ''

function normalizeBackendVolunteer(v = {}, fallback = {}) {
  const rawId = v.id ?? fallback.id ?? 0
  const numericId = Number(rawId)
  const id = Number.isNaN(numericId) ? rawId : numericId
  const status = v.status || fallback.status || '待响应'
  const progress = Number(v.progress ?? fallback.progress ?? 0)
  const isReal = Boolean(v.isReal ?? v.is_real ?? fallback.isReal)
  const role = getVolunteerRole({
    ...fallback,
    ...v,
    isReal,
    role: v.role || fallback.role || fallback.job
  })
  return {
    ...fallback,
    ...v,
    id,
    name: v.name || fallback.name || `志愿者${id}`,
    username: v.username || fallback.username || v.name || fallback.name || `志愿者${id}`,
    phone: v.phone || fallback.phone || '',
    role,
    age: v.age || fallback.age || 45,
    job: isReal ? (volunteerProfile.value.job || role) : (v.job || v.occupation || fallback.job || role),
    count: v.count || fallback.count || 0,
    stars: v.stars || fallback.stars || '★★★★★',
    honor: v.honor || fallback.honor || '社区互助成员',
    avatar: v.avatar || fallback.avatar || '/static/avatar-volunteer.png',
    isSelf: Boolean(v.isSelf ?? fallback.isSelf),
    status,
    progress,
    etaText: v.etaText || v.eta_text || fallback.etaText || '待响应',
    latitude: Number(v.latitude ?? fallback.latitude ?? CENTER.latitude),
    longitude: Number(v.longitude ?? fallback.longitude ?? CENTER.longitude),
    initLatitude: Number(v.initLatitude ?? fallback.initLatitude ?? v.latitude ?? fallback.latitude ?? CENTER.latitude),
    initLongitude: Number(v.initLongitude ?? fallback.initLongitude ?? v.longitude ?? fallback.longitude ?? CENTER.longitude),
    startLatitude: Number(v.startLatitude ?? fallback.startLatitude ?? v.latitude ?? fallback.latitude ?? CENTER.latitude),
    startLongitude: Number(v.startLongitude ?? fallback.startLongitude ?? v.longitude ?? fallback.longitude ?? CENTER.longitude),
    moveStartAt: Number(v.moveStartAt ?? v.move_start_at ?? fallback.moveStartAt ?? 0),
    moveDurationSec: Number(v.moveDurationSec ?? v.move_duration_sec ?? fallback.moveDurationSec ?? 30),
    autoRespondAt: Number(v.autoRespondAt ?? fallback.autoRespondAt ?? 0),
    userId: v.userId || v.user_id || fallback.userId,
    isReal
  }
}

function getVolunteerRole(item = {}) {
  if (item.isReal) {
    return volunteerProfile.value.job ? `流动志愿者 · ${volunteerProfile.value.job}` : '流动志愿者'
  }
  if (item.name === '王秀兰') return '地区常驻志愿者 · 网格员'
  if (item.name === '李秋芳') return '地区常驻志愿者 · 保安'
  if (item.role === ['真', '实', '志', '愿', '者'].join('')) return '流动志愿者'
  return item.role || item.job || item.honor || '流动志愿者'
}

function mergeBackendStatusToLocal(data) {
  const backendVolunteers = Array.isArray(data.volunteers) ? data.volunteers : []
  taskId.value = data.taskId || taskId.value
  hasActiveTask.value = Boolean(taskId.value)
  requesterPosition.value = data.requesterPosition || requesterPosition.value
  mapCenter.value = data.requesterPosition || mapCenter.value
  currentStatus.value = data.systemStatus || currentStatus.value || 'sos'
  volunteers.value = backendVolunteers.map((backendFound, index) => {
    const fallback = { id: backendFound.id || index + 1 }
    return normalizeBackendVolunteer(backendFound, fallback)
  })
  taskInfo.value = {
    ...(taskInfo.value || {}),
    ...data,
    location: data.locationLabel || (taskInfo.value || {}).location,
    risk: Number(data.riskValue || 0) >= 80 ? '高风险' : '中风险',
    desc: data.desc || (taskInfo.value || {}).desc
  }
  maybePromptNewTask(data.taskId)
}

async function fetchBackendStatus(taskId) {
  if (!taskId) return
  try {
    const res = await request(`/api/sos/status/${taskId}`)
    console.log('SOS状态轮询：', res)
    if (res && res.success && res.data) {
      mergeBackendStatusToLocal(res.data)
    } else {
      hasActiveTask.value = false
      taskId.value = null
      volunteers.value = []
      currentStatus.value = 'idle'
      stopPolling()
      startActiveDiscovery()
    }
  } catch (e) {
    console.log('志愿者端后端状态同步失败：', e)
    hasActiveTask.value = false
    taskId.value = null
    volunteers.value = []
    currentStatus.value = 'idle'
    stopPolling()
    startActiveDiscovery()
  }
}

function startBackendPolling(taskId) {
  stopBackendPolling()
  if (!taskId) return
  fetchBackendStatus(taskId)
  backendPollTimer = setInterval(() => fetchBackendStatus(taskId), 1000)
}

function startPolling() {
  stopBackendPolling()
  if (!taskId.value) return
  startBackendPolling(taskId.value)
}

function stopPolling() {
  stopBackendPolling()
}

function stopBackendPolling() {
  if (backendPollTimer) clearInterval(backendPollTimer)
  backendPollTimer = null
}

function startActiveDiscovery() {
  stopActiveDiscovery()
  if (!isVolunteerRegistered.value) return
  activePollTimer = setInterval(() => {
    if (!taskId.value) loadActiveTask()
  }, 3000)
}

function stopActiveDiscovery() {
  if (activePollTimer) clearInterval(activePollTimer)
  activePollTimer = null
}

function maybePromptNewTask(id) {
  if (!id || promptedTaskId === id || hasResponded.value) return
  promptedTaskId = id
  uni.showModal({
    title: '收到新的 SOS 求助',
    content: '附近有用户发起 SOS，请查看任务并及时响应。',
    confirmText: '立即响应',
    cancelText: '稍后查看',
    success: (res) => {
      if (res.confirm) handleRespond()
    }
  })
}

async function handleRespond() {
  if (!isVolunteerRegistered.value) {
    uni.showToast({ title: '请先完成志愿者注册', icon: 'none' })
    return
  }
  const user = userInfo.value || uni.getStorageSync('userInfo') || {}
  const profile = uni.getStorageSync(VOLUNTEER_PROFILE_KEY) || {}
  const currentTaskId = taskId.value
  if (!currentTaskId) {
    uni.showToast({ title: '暂无任务', icon: 'none' })
    return
  }
  if (!user.id) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  if (user.role !== 'volunteer') {
    uni.showToast({ title: '当前账号未标记为志愿者，演示模式允许响应', icon: 'none' })
  }

  try {
    const res = await request('/api/sos/volunteer/respond-real', 'POST', {
      taskId: currentTaskId,
      userId: user.id,
      username: user.nickname || user.username || '流动志愿者',
      phone: user.phone || '',
      openid: uni.getStorageSync('openid') || `user_${user.id || Date.now()}`,
      volunteerRole: profile.job ? `流动志愿者 · ${profile.job}` : '流动志愿者',
      volunteerProfile: profile
    })
    console.log('真实志愿者响应结果：', res)
    uni.showToast({ title: '响应成功', icon: 'success' })
    await loadTaskStatus()
    startPolling()
  } catch (e) {
    console.log('流动志愿者响应失败：', e)
    uni.showToast({ title: '响应失败', icon: 'none' })
  }
}

function startSync() {
  startProfileSync()
}

function stopSync() {
  stopProfileSync()
  stopBackendPolling()
  stopActiveDiscovery()
}

async function loadActiveTask() {
  userInfo.value = uni.getStorageSync('userInfo') || {}
  loadVolunteerProfile()
  if (!isVolunteerRegistered.value) {
    hasActiveTask.value = false
    taskId.value = null
    taskInfo.value = null
    volunteers.value = []
    currentStatus.value = 'idle'
    promptedTaskId = ''
    stopPolling()
    stopActiveDiscovery()
    return
  }
  try {
    const res = await request('/api/sos/active', 'GET')
    console.log('当前活跃SOS任务：', res)

    if (res.success && res.data && res.data.taskId) {
      taskId.value = res.data.taskId
      hasActiveTask.value = true
      currentStatus.value = res.data.systemStatus || 'sos'
      taskInfo.value = {
        ...(taskInfo.value || {}),
        ...res.data,
        location: res.data.locationLabel || (taskInfo.value || {}).location,
        risk: Number(res.data.riskValue || 0) >= 80 ? '高风险' : '中风险'
      }
      requesterPosition.value = res.data.requesterPosition || { ...CENTER }
      mapCenter.value = res.data.requesterPosition || { ...CENTER }
      stopActiveDiscovery()
      startPolling()
    } else {
      hasActiveTask.value = false
      taskId.value = null
      taskInfo.value = null
      volunteers.value = []
      currentStatus.value = 'idle'
      promptedTaskId = ''
      stopPolling()
      startActiveDiscovery()
    }
  } catch (e) {
    console.log('获取活跃SOS任务失败：', e)
    taskId.value = null
    hasActiveTask.value = false
    taskInfo.value = null
    volunteers.value = []
    currentStatus.value = 'idle'
    promptedTaskId = ''
    stopPolling()
    startActiveDiscovery()
  }
}

function loadVolunteerProfile() {
  refreshVolunteerProfile(true)
}

function goVolunteerRegister() {
  uni.showToast({ title: '请先完成志愿者注册', icon: 'none' })
}

async function handleVolunteerRegister() {
  const form = registerForm.value
  const required = ['gender', 'age', 'job', 'honor', 'serviceHours']
  const missing = required.some((key) => !String(form[key] || '').trim())
  if (missing) {
    uni.showToast({ title: '请完整填写志愿者信息', icon: 'none' })
    return
  }
  if (Number.isNaN(Number(form.age))) {
    uni.showToast({ title: '年龄必须是数字', icon: 'none' })
    return
  }
  if (Number.isNaN(Number(form.serviceHours))) {
    uni.showToast({ title: '志愿时长必须是数字', icon: 'none' })
    return
  }

  const user = uni.getStorageSync('userInfo') || {}
  const profile = {
    gender: String(form.gender).trim(),
    age: Number(form.age),
    job: String(form.job).trim(),
    honor: String(form.honor).trim(),
    serviceHours: Number(form.serviceHours),
    registered: true,
    registeredAt: Date.now(),
    userId: user.id
  }
  uni.setStorageSync(VOLUNTEER_PROFILE_KEY, profile)
  refreshVolunteerProfile(true)
  console.log('志愿者注册信息：', profile)
  uni.showToast({ title: '注册成功', icon: 'success' })
  await loadActiveTask()
}

function refreshVolunteerProfile(forceLog = false) {
  const profile = uni.getStorageSync(VOLUNTEER_PROFILE_KEY)
  const matched = profile && profile.registered === true
  const nextProfile = matched ? { ...profile } : {}
  const nextSnapshot = JSON.stringify(nextProfile)

  if (forceLog || nextSnapshot !== profileSnapshot) {
    volunteerProfile.value = nextProfile
    isVolunteerRegistered.value = Boolean(matched)
    profileSnapshot = nextSnapshot
    console.log('志愿者资料：', volunteerProfile.value)
  }
}

function startProfileSync() {
  stopProfileSync()
  refreshVolunteerProfile()
  profileSyncTimer = setInterval(() => refreshVolunteerProfile(), 1000)
}

function stopProfileSync() {
  if (profileSyncTimer) clearInterval(profileSyncTimer)
  profileSyncTimer = null
}

async function loadTaskStatus() {
  if (!taskId.value) return
  await fetchBackendStatus(taskId.value)
}

const selfVolunteer = computed(() => {
  const user = userInfo.value || {}
  return volunteers.value.find((v) => v.isReal && Number(v.userId) === Number(user.id)) || {
    id: `real_${user.id || 'current'}`,
    name: user.nickname || user.username || '当前志愿者',
    phone: user.phone || '',
    role: volunteerProfile.value.job ? `流动志愿者 · ${volunteerProfile.value.job}` : '流动志愿者',
    status: '待响应',
    etaText: '待响应',
    progress: 0,
    isReal: true,
    userId: user.id
  }
})

const hasResponded = computed(() => {
  return selfVolunteer.value.status !== '待响应'
})

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
  if (!hasActiveTask.value) return []

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

  const volunteerMarkers = volunteers.value.map((item, index) => {
    const active = item.status === '前往中'
    const arrived = item.status === '已到达'
    return {
      id: index + 1,
      latitude: item.latitude,
      longitude: item.longitude,
      width: active || arrived ? 22 : 18,
      height: active || arrived ? 26 : 22,
      zIndex: item.isReal ? 30 : 10,
      anchor: { x: 0.5, y: 1 },
      iconPath: active || arrived ? '/static/volunteer-green.png' : '/static/volunteer-blue.png',
      callout: {
        content: `${item.name}｜${item.status} ${item.progress}%`,
        color: '#ffffff',
        fontSize: 10,
        borderRadius: 8,
        bgColor: arrived ? '#ff8a00' : active ? '#22b573' : '#2d6cff',
        padding: 6,
        display: item.isReal ? 'ALWAYS' : 'BYCLICK'
      }
    }
  })

  return [requesterMarker, ...volunteerMarkers]
})

onPullDownRefresh(() => {
  if (!isVolunteerRegistered.value) {
    uni.showToast({ title: '请先完成志愿者注册', icon: 'none' })
    uni.stopPullDownRefresh()
    return
  }
  if (taskId.value) loadTaskStatus()
  else loadActiveTask()
  uni.showToast({ title: '已刷新', icon: 'none' })
  setTimeout(() => uni.stopPullDownRefresh(), 300)
})

onBackPress(() => {
  if (!isVolunteerRegistered.value) {
    uni.showToast({ title: '请先完成志愿者注册', icon: 'none' })
    return true
  }
  return false
})

onMounted(() => {
  const token = uni.getStorageSync('token')
  if (!token) return
  loadActiveTask()
  startSync()
})

onShow(() => {
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  loadActiveTask()
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
  min-height: 100vh;
  background: #f4f6fb;
  padding: 24rpx;
  box-sizing: border-box;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.top-card,
.map-card,
.action-card,
.task-card,
.response-card,
.excellent-card,
.volunteer-profile-card {
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

.eta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.eta-text,
.eta-percent {
  font-size: 24rpx;
  color: #6d7890;
}

.track {
  height: 12rpx;
  border-radius: 999rpx;
  background: #edf1f7;
  overflow: hidden;
  margin-bottom: 14rpx;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, #2d6cff 0%, #22b573 100%);
  border-radius: 999rpx;
}

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

.register-input {
  flex: 1;
  text-align: right;
  font-size: 25rpx;
  color: #1f2a44;
  min-height: 56rpx;
}

.volunteer-register-card {
  margin-top: 160rpx;
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

.volunteer-profile-card {
  border: 2rpx solid rgba(232, 91, 91, 0.12);
}

.register-entry-btn {
  margin-top: 24rpx;
}
</style>
