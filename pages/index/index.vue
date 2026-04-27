<template>
  <scroll-view :class="['page', { emergency: isEmergencyMode }]" scroll-y :show-scrollbar="false">
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title">AI主动式SOS社区救助</view>
        <view class="hero-sub">关爱弱势群体 · 实时位置 · 风险监测 · 一键求助</view>
        <view class="hero-location">
          <text class="loc-dot" />
          {{ locationLabel }}
        </view>
      </view>
      <view class="hero-badge" :class="seekerAlert ? 'alert' : 'calm'">
        {{ seekerAlert ? '注意风险' : '当前安全' }}
      </view>
    </view>

    <view v-if="isEmergencyMode" class="emergency-banner">
      ⚠️ 已进入紧急模式，系统正在自动通知联系人与附近志愿者
    </view>

    <view v-if="isEmergencyMode" class="panel emergency-info-card">
      <view class="panel-title">紧急模式信息</view>
      <view class="row">
        <text class="k">触发方式</text>
        <text class="v">{{ emergencyTriggerType }}</text>
      </view>
      <view class="row">
        <text class="k">系统状态</text>
        <text class="v danger">紧急模式已启动</text>
      </view>
      <view class="row">
        <text class="k">定位状态</text>
        <text class="v">定位已开启</text>
      </view>
      <view class="row">
        <text class="k">记录状态</text>
        <text class="v">正在记录环境信息</text>
      </view>
      <view class="row">
        <text class="k">已持续秒数</text>
        <text class="v danger">{{ emergencySeconds }} 秒</text>
      </view>
      <view class="row">
        <text class="k">联系人通知</text>
        <text class="v">{{ notifiedCount }}/{{ emergencyContacts.length }} 已成功</text>
      </view>

      <view class="emergency-action-row">
        <view
          class="chip"
          :class="currentTaskSource === 'manual' ? 'warn' : 'ghost'"
          @click="handleCancelSOS"
        >
          取消手动SOS
        </view>
        <view class="chip danger" @click="handleEndDemo">结束演示</view>
      </view>
    </view>

    <view v-if="isEmergencyMode" class="panel emergency-contact-card">
      <view class="panel-title">紧急联系人通知</view>
      <view v-for="item in emergencyContacts" :key="item.id" class="contact-row">
        <view class="contact-left">
          <text class="contact-name">{{ item.name }}</text>
          <text class="contact-sub">{{ item.relation }} · {{ item.phone }}</text>
        </view>
        <view class="contact-right">
          <text
            class="contact-status"
            :class="{
              pending: item.status === '待发送',
              sending: item.status === '发送中',
              success: item.status === '发送成功'
            }"
          >
            {{ item.status }}
          </text>
          <text v-if="item.notifyTime" class="contact-time">{{ item.notifyTime }}</text>
        </view>
      </view>

      <view class="sms-preview">
        <view class="sms-title">短信内容预览</view>
        <view class="sms-content">{{ emergencySmsPreview }}</view>
      </view>
    </view>

    <view class="map-shell">
      <view class="map-head">
        <view class="map-head-left">
          <text class="map-title">实时位置地图</text>
          <text class="map-hint">红区：高风险 · 灰区：偏僻监测区</text>
        </view>
        <view class="debug-toggle" @click="toggleDebug">
          <text class="debug-label">调试模式</text>
          <view class="debug-switch" :class="{ on: debugMode }">
            <view class="debug-knob" />
          </view>
        </view>
      </view>

      <map
        class="map"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :scale="17"
        :markers="mapMarkers"
        :circles="mapCircles"
        show-location
      ></map>

      <view v-if="showVolunteerPanel" class="vol-response">
        <view class="vol-response-title">附近志愿者响应</view>
        <view v-for="item in volunteers" :key="item.id" class="vol-card">
          <view class="vol-top">
            <view>
              <view class="vol-name">{{ item.name }}</view>
              <view class="vol-meta">{{ item.age }} 岁 · {{ item.job }}</view>
              <view class="vol-honor">{{ item.honor }}</view>
            </view>
            <view
              class="pill"
              :class="{
                idle: item.status === '待响应',
                coming: item.status === '前往中',
                arrived: item.status === '已到达'
              }"
            >
              {{ item.status }}
            </view>
          </view>
          <view class="eta-row">
            <text class="eta-text">预计到达：{{ item.etaText }}</text>
            <text class="eta-percent">{{ item.progress }}%</text>
          </view>
          <view class="track">
            <view class="fill" :style="{ width: item.progress + '%' }" />
          </view>
        </view>
      </view>
    </view>

    <view class="metrics">
      <view class="metric-card risk">
        <view class="metric-label">当前风险指数</view>
        <view class="metric-value" :class="{ hot: riskValue >= 55 }">{{ riskValue }}</view>
      </view>
      <view class="metric-card listen">
        <view class="metric-label">{{ isListening ? 'AI 语音监听' : '语音监听' }}</view>
        <view class="metric-state">{{ isListening ? '监听中' : '未开启' }}</view>
        <view v-if="isListening" class="wave-row">
          <view
            v-for="(item, index) in waveBars"
            :key="index"
            class="wave-bar"
            :style="{ height: item + 'rpx' }"
          />
        </view>
        <view v-else class="listen-off">当前环境较安全</view>
      </view>
    </view>

    <view class="sos-row">
      <view class="sos-btn" @click="handleManualSOS">SOS</view>
      <view class="help-pill" @click="handleEndDemo">结束演示</view>
    </view>

    <view v-if="debugMode" class="panel debug-panel">
      <view class="panel-title">演示控制台</view>
      <view class="chip-row">
        <view class="chip danger" @click="handleManualSOS">手动 SOS</view>
        <view class="chip primary" @click="handleDangerTimeTest">夜间语音检测</view>
      </view>
      <view class="chip-row">
        <view class="chip warn" @click="handleDangerZoneTest">进入危险区模拟</view>
        <view class="chip ghost" @click="resetAll">重置场景</view>
      </view>
    </view>

    <view class="panel">
      <view class="panel-title">系统状态</view>
      <view class="row">
        <text class="k">运行状态</text>
        <text class="v">{{ systemStatusText }}</text>
      </view>
      <view class="row">
        <text class="k">夜间守护</text>
        <text class="v">{{ protectionMode ? '已开启' : '未开启' }}</text>
      </view>
      <view class="row">
        <text class="k">语音监听</text>
        <text class="v">{{ isListening ? '监听中' : '未监听' }}</text>
      </view>
      <view v-if="countdown > 0" class="row">
        <text class="k">自动求助倒计时</text>
        <text class="v danger">{{ countdown }} 秒</text>
      </view>
    </view>

    <view class="panel voice-plan-panel">
      <view class="panel-title">语音检测与监测时段</view>
      <view class="voice-entry-card">
        <view class="voice-entry-info">
          <view class="voice-entry-title">语音检测页</view>
          <view class="voice-entry-desc">录音并上传识别，用于 SOS 关键词联调测试。</view>
        </view>
        <view class="chip primary voice-entry-btn" @click="goVoiceTest">进入语音检测</view>
      </view>
      <view class="voice-plan-hint">
        自动监测：在下方选择或智能推荐监测时间点，到达对应时段后系统将自动开启语音监测（演示逻辑，每点起 45 分钟内有效）。
      </view>
      <view class="voice-plan-status">{{ voiceScheduleStatusText }}</view>
      <view class="voice-slot-actions">
        <picker mode="time" :value="pickerTime" @change="onVoiceSlotPick">
          <view class="chip ghost">选择时间点</view>
        </picker>
        <view class="chip warn" @click="applySmartVoiceSlots">智能推荐时段</view>
        <view class="chip" @click="clearVoiceSlots">清空</view>
      </view>
      <view v-if="voiceMonitorSlots.length" class="voice-slot-list">
        <view v-for="t in voiceMonitorSlots" :key="t" class="voice-slot-chip" @click="removeVoiceSlot(t)">
          <text>{{ t }}</text>
          <text class="voice-slot-x">×</text>
        </view>
      </view>
      <view v-else class="voice-slot-empty">尚未添加监测时间点，可先点「智能推荐时段」或自行选择。</view>
    </view>

    <view class="panel log-panel">
      <view class="panel-title">运行日志</view>
      <view v-for="(log, index) in logs" :key="index" class="log-line">{{ log }}</view>
    </view>
  </scroll-view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'

const CENTER = { latitude: 19.99839, longitude: 110.152305 }
const STORAGE_KEY = 'sos_task_state_v3'
const VOICE_SLOTS_KEY = 'voice_monitor_time_slots_v1'

const RED_ZONES = [
  { id: 1, latitude: 19.99892, longitude: 110.15288, radius: 26 },
  { id: 2, latitude: 19.99818, longitude: 110.15196, radius: 24 }
]

const GRAY_ZONES = [
  { id: 1, latitude: 19.99862, longitude: 110.15252, radius: 18 },
  { id: 2, latitude: 19.99836, longitude: 110.15216, radius: 16 }
]

const locationLabel = ref('村东侧小路口（演示定位）')
const mapCenter = ref({ ...CENTER })
const myPosition = ref({ ...CENTER })
const riskValue = ref(15)
const isListening = ref(false)
const protectionMode = ref(false)
const countdown = ref(0)
const systemStatus = ref('idle')
const showVolunteerPanel = ref(false)
const debugMode = ref(false)
const waveBars = ref([24, 36, 20, 42, 28, 38, 22, 34, 26, 30])
const logs = ref(['系统已启动，正在同步周边风险状态'])
const volunteers = ref([])
const isEmergencyMode = ref(false)
const emergencyTriggerType = ref('')
const emergencyStartedAt = ref(0)
const emergencySeconds = ref(0)
const currentTaskSource = ref('')
const emergencyContacts = ref([])
const isDangerSimulation = ref(false)
const voiceMonitorSlots = ref([])
const pickerTime = ref('22:00')
const listeningFromSchedule = ref(false)

const emergencySmsPreview =
  '【紧急求助】我可能正处于危险中，当前位置已共享，请尽快联系我或查看定位。'

let syncTimer = null
let waveTimer = null
let emergencyClockTimer = null
let contactNotifyTimers = []
let dangerTimer = null

function defaultEmergencyContacts() {
  return [
    {
      id: 1,
      name: '妈妈',
      relation: '家人',
      phone: '138****1111',
      notified: false,
      notifyTime: '',
      status: '待发送'
    },
    {
      id: 2,
      name: '室友小林',
      relation: '朋友',
      phone: '139****2222',
      notified: false,
      notifyTime: '',
      status: '待发送'
    }
  ]
}

function normalizeEmergencyContacts(incoming = []) {
  const base = defaultEmergencyContacts()
  return base.map((item) => {
    const found = incoming.find((c) => c.id === item.id) || {}
    return {
      ...item,
      ...found,
      notified: !!found.notified,
      notifyTime: found.notifyTime || '',
      status: found.status || '待发送'
    }
  })
}

function defaultVolunteers() {
  return [
    {
      id: 1,
      name: '王秀兰',
      age: 46,
      job: '村医',
      honor: '优秀互助志愿者',
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
      name: '李秋芳',
      age: 52,
      job: '社区互助志愿者',
      honor: '连续三年五星评价',
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
      name: '张玉兰',
      age: 39,
      job: '社区网格员',
      honor: '应急处置标兵',
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

function addLog(text) {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  logs.value.unshift(`[${hh}:${mm}:${ss}] ${text}`)
  if (logs.value.length > 12) logs.value = logs.value.slice(0, 12)
}

function formatNowTime() {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function clearContactNotifyTimers() {
  contactNotifyTimers.forEach((id) => clearTimeout(id))
  contactNotifyTimers = []
}

function clearDangerTimer() {
  if (dangerTimer) {
    clearInterval(dangerTimer)
    dangerTimer = null
  }
}

function startEmergencyClock() {
  if (emergencyClockTimer) clearInterval(emergencyClockTimer)
  emergencyClockTimer = setInterval(() => {
    if (!isEmergencyMode.value || !emergencyStartedAt.value) return
    emergencySeconds.value = Math.max(0, Math.floor((Date.now() - emergencyStartedAt.value) / 1000))
  }, 1000)
}

function stopEmergencyClock() {
  if (emergencyClockTimer) clearInterval(emergencyClockTimer)
  emergencyClockTimer = null
}

function resetEmergencyContacts() {
  emergencyContacts.value = defaultEmergencyContacts()
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
      taskSource: '',
      alertState: 'none',
      systemStatus: 'idle',
      requesterPosition: { ...CENTER },
      locationLabel: '村东侧小路口（演示定位）',
      riskValue: 15,
      emergencyMode: false,
      emergencyStartedAt: 0,
      emergencyTriggerType: '',
      emergencyContacts: defaultEmergencyContacts(),
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
    taskSource: raw.taskSource || '',
    alertState: raw.alertState || 'none',
    systemStatus: raw.systemStatus || 'idle',
    requesterPosition: raw.requesterPosition || { ...CENTER },
    locationLabel: raw.locationLabel || '村东侧小路口（演示定位）',
    riskValue: typeof raw.riskValue === 'number' ? raw.riskValue : 15,
    emergencyMode: !!raw.emergencyMode,
    emergencyStartedAt: raw.emergencyStartedAt || 0,
    emergencyTriggerType: raw.emergencyTriggerType || '',
    emergencyContacts: normalizeEmergencyContacts(raw.emergencyContacts || []),
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

function persistEmergencyPart() {
  const raw = uni.getStorageSync(STORAGE_KEY)
  const state = normalizeState(raw)
  state.emergencyMode = isEmergencyMode.value
  state.emergencyStartedAt = emergencyStartedAt.value
  state.emergencyTriggerType = emergencyTriggerType.value
  state.emergencyContacts = deepClone(emergencyContacts.value)
  state.taskSource = currentTaskSource.value || state.taskSource
  saveState(state)
}

function updateViewByState(state) {
  myPosition.value = { ...state.requesterPosition }
  mapCenter.value = { ...state.requesterPosition }
  locationLabel.value = state.locationLabel
  riskValue.value = state.riskValue
  volunteers.value = deepClone(state.volunteers)
  systemStatus.value = state.systemStatus
  showVolunteerPanel.value = !!state.taskId
  currentTaskSource.value = state.taskSource || ''

  isEmergencyMode.value = !!state.emergencyMode
  emergencyTriggerType.value = state.emergencyTriggerType || ''
  emergencyStartedAt.value = state.emergencyStartedAt || 0
  emergencyContacts.value = normalizeEmergencyContacts(state.emergencyContacts || [])

  if (isEmergencyMode.value && emergencyStartedAt.value) {
    emergencySeconds.value = Math.max(0, Math.floor((Date.now() - emergencyStartedAt.value) / 1000))
    startEmergencyClock()
  } else {
    emergencySeconds.value = 0
    stopEmergencyClock()
  }
}

function syncStateAndTick() {
  const raw = uni.getStorageSync(STORAGE_KEY)
  const state = normalizeState(raw)
  const changed = applyAutoRules(state, Date.now())
  if (isDangerSimulation.value && !state.taskId) return
  updateViewByState(state)
  if (changed) saveState(state)
  applyVoiceScheduleTick()
}

function createSosTask(sourceText, taskSource = 'manual') {
  const now = Date.now()
  const data = {
    taskId: `task_${now}`,
    taskSource,
    alertState: 'pending',
    systemStatus: 'sos',
    requesterPosition: { ...myPosition.value },
    locationLabel: locationLabel.value,
    riskValue: 85,
    emergencyMode: isEmergencyMode.value,
    emergencyStartedAt: emergencyStartedAt.value,
    emergencyTriggerType: emergencyTriggerType.value,
    emergencyContacts: deepClone(emergencyContacts.value),
    volunteers: defaultVolunteers(),
    updatedAt: now
  }

  data.volunteers.forEach((v) => {
    if (v.isSelf) return
    const shouldRespond = Math.random() > 0.2
    if (!shouldRespond) return
    const delaySec = Math.floor(Math.random() * 6) + 2
    const durationSec = Math.floor(Math.random() * 26) + 18
    v.autoRespondAt = now + delaySec * 1000
    v.moveDurationSec = durationSec
  })

  saveState(data)
  updateViewByState(data)
  addLog(sourceText)
  addLog('已向附近志愿者广播求助')
  uni.showToast({ title: 'SOS 已发送', icon: 'none' })
}

function startEmergencyMode(sourceLabel) {
  if (isEmergencyMode.value) return
  isEmergencyMode.value = true
  emergencyTriggerType.value = sourceLabel === 'manual' ? '手动 SOS' : '自动 SOS'
  emergencyStartedAt.value = Date.now()
  emergencySeconds.value = 0
  resetEmergencyContacts()
  startEmergencyClock()
  addLog('已进入紧急模式')
}

function notifyEmergencyContacts() {
  clearContactNotifyTimers()
  emergencyContacts.value = emergencyContacts.value.map((item) => ({
    ...item,
    notified: false,
    notifyTime: '',
    status: '待发送'
  }))
  persistEmergencyPart()

  emergencyContacts.value.forEach((contact, index) => {
    const startTimer = setTimeout(() => {
      emergencyContacts.value = emergencyContacts.value.map((item) =>
        item.id === contact.id ? { ...item, status: '发送中' } : item
      )
      persistEmergencyPart()
    }, index * 1300)

    const successTimer = setTimeout(() => {
      emergencyContacts.value = emergencyContacts.value.map((item) =>
        item.id === contact.id
          ? {
              ...item,
              status: '发送成功',
              notified: true,
              notifyTime: formatNowTime()
            }
          : item
      )
      addLog(`已通知紧急联系人：${contact.name}`)
      persistEmergencyPart()
    }, index * 1300 + 900)

    contactNotifyTimers.push(startTimer, successTimer)
  })
}

function endEmergencyMode() {
  clearContactNotifyTimers()
  stopEmergencyClock()
  isEmergencyMode.value = false
  emergencyTriggerType.value = ''
  emergencyStartedAt.value = 0
  emergencySeconds.value = 0
  resetEmergencyContacts()
  currentTaskSource.value = ''
}

function triggerSOS(source = 'manual') {
  if (showVolunteerPanel.value || isEmergencyMode.value) {
    uni.showToast({ title: '已处于紧急流程中', icon: 'none' })
    return
  }

  const taskSource = source === 'manual' ? 'manual' : 'auto'
  isDangerSimulation.value = false
  clearDangerTimer()
  startEmergencyMode(taskSource)
  createSosTask(source === 'manual' ? '用户手动触发 SOS' : '系统自动触发 SOS', taskSource)
  notifyEmergencyContacts()
}

function resetAll() {
  clearContactNotifyTimers()
  stopEmergencyClock()
  clearDangerTimer()
  isDangerSimulation.value = false
  listeningFromSchedule.value = false
  const idle = normalizeState(null)
  saveState(idle)
  updateViewByState(idle)
  endEmergencyMode()
  riskValue.value = 15
  isListening.value = false
  protectionMode.value = false
  countdown.value = 0
  logs.value = ['场景已重置，可再次开始演示']
}

function handleManualSOS() {
  riskValue.value = 85
  triggerSOS('manual')
}

function handleCancelSOS() {
  const raw = uni.getStorageSync(STORAGE_KEY)
  const state = normalizeState(raw)

  if (!state.taskId) {
    uni.showToast({ title: '当前没有进行中的 SOS', icon: 'none' })
    return
  }

  if (state.taskSource !== 'manual') {
    uni.showToast({ title: '仅可取消手动 SOS', icon: 'none' })
    return
  }

  resetAll()
  addLog('已取消手动 SOS')
  uni.showToast({ title: '已取消手动 SOS', icon: 'none' })
}

function handleEndDemo() {
  resetAll()
  uni.showToast({ title: '已结束演示', icon: 'none' })
}

function parseSlotToMinutes(s) {
  const parts = String(s).split(':')
  const h = Number(parts[0]) || 0
  const m = Number(parts[1]) || 0
  return ((h % 24) * 60 + (m % 60) + 1440) % 1440
}

function isWithinAnyVoiceSlot(slots, now = new Date()) {
  if (!slots || !slots.length) return false
  const cur = now.getHours() * 60 + now.getMinutes()
  for (const s of slots) {
    const start = parseSlotToMinutes(s)
    const end = start + 45
    if (end < 1440) {
      if (cur >= start && cur < end) return true
    } else {
      const wrapEnd = end - 1440
      if (cur >= start || cur < wrapEnd) return true
    }
  }
  return false
}

function loadVoiceSlots() {
  try {
    const raw = uni.getStorageSync(VOICE_SLOTS_KEY)
    if (Array.isArray(raw) && raw.length) {
      voiceMonitorSlots.value = [...raw].sort((a, b) => parseSlotToMinutes(a) - parseSlotToMinutes(b))
    }
  } catch (_) {
    /* ignore */
  }
}

function saveVoiceSlots() {
  try {
    uni.setStorageSync(VOICE_SLOTS_KEY, voiceMonitorSlots.value)
  } catch (_) {
    /* ignore */
  }
}

function onVoiceSlotPick(e) {
  const v = e?.detail?.value
  if (!v) return
  pickerTime.value = v
  if (!voiceMonitorSlots.value.includes(v)) {
    voiceMonitorSlots.value = [...voiceMonitorSlots.value, v].sort(
      (a, b) => parseSlotToMinutes(a) - parseSlotToMinutes(b)
    )
    saveVoiceSlots()
    uni.showToast({ title: `已添加 ${v}`, icon: 'none' })
  } else {
    uni.showToast({ title: '该时间点已存在', icon: 'none' })
  }
}

function removeVoiceSlot(t) {
  voiceMonitorSlots.value = voiceMonitorSlots.value.filter((x) => x !== t)
  saveVoiceSlots()
}

function applySmartVoiceSlots() {
  voiceMonitorSlots.value = ['21:30', '23:00', '01:30', '05:00'].sort(
    (a, b) => parseSlotToMinutes(a) - parseSlotToMinutes(b)
  )
  saveVoiceSlots()
  uni.showToast({ title: '已填入推荐监测时段', icon: 'none' })
  addLog('已智能推荐语音监测时段（可按需增删）')
}

function clearVoiceSlots() {
  voiceMonitorSlots.value = []
  saveVoiceSlots()
  if (listeningFromSchedule.value) {
    isListening.value = false
    protectionMode.value = false
    listeningFromSchedule.value = false
  }
  uni.showToast({ title: '已清空监测时间点', icon: 'none' })
}

function goVoiceTest() {
  uni.navigateTo({
    url: '/pages/voice-test/voice-test',
    fail: () => uni.showToast({ title: '页面打开失败', icon: 'none' })
  })
}

function applyVoiceScheduleTick() {
  if (isEmergencyMode.value || showVolunteerPanel.value || isDangerSimulation.value) return
  if (!voiceMonitorSlots.value.length) {
    if (listeningFromSchedule.value) {
      isListening.value = false
      protectionMode.value = false
      listeningFromSchedule.value = false
    }
    return
  }
  const inWin = isWithinAnyVoiceSlot(voiceMonitorSlots.value)
  if (inWin) {
    if (!listeningFromSchedule.value) {
      isListening.value = true
      protectionMode.value = true
      listeningFromSchedule.value = true
      addLog('监测计划：当前时间在已选时段内，已自动开启语音监测')
    }
  } else if (listeningFromSchedule.value) {
    isListening.value = false
    protectionMode.value = false
    listeningFromSchedule.value = false
    addLog('监测计划：已离开计划时段，已结束自动语音监测')
  }
}

function handleDangerTimeTest() {
  goVoiceTest()
}

function handleDangerZoneTest() {
  clearDangerTimer()
  isDangerSimulation.value = true

  const target = RED_ZONES[Math.floor(Math.random() * RED_ZONES.length)]
  const startAt = Date.now()
  const minWalkSecBeforeSOS = 5
  let enteredRedZone = false
  systemStatus.value = 'danger'
  addLog('求助者开始进入危险区域')
  addLog('系统正在跟踪移动轨迹，进入红圈后将自动处置')

  dangerTimer = setInterval(() => {
    if (riskValue.value < 90) riskValue.value += 4

    myPosition.value = {
      longitude: myPosition.value.longitude + (target.longitude - myPosition.value.longitude) * 0.14,
      latitude: myPosition.value.latitude + (target.latitude - myPosition.value.latitude) * 0.14
    }
    mapCenter.value = { ...myPosition.value }

    if (riskValue.value >= 35 && !protectionMode.value) {
      protectionMode.value = true
      addLog('进入偏僻区域，已开启夜间守护')
    }

    if (riskValue.value >= 55 && !isListening.value) {
      isListening.value = true
      systemStatus.value = 'listening'
      addLog('检测到环境风险，已开启语音监听')
    }

    const lngDiff = target.longitude - myPosition.value.longitude
    const latDiff = target.latitude - myPosition.value.latitude
    const distanceMeter = Math.sqrt(
      Math.pow(lngDiff * 111000, 2) + Math.pow(latDiff * 111000, 2)
    )
    const inRedZone = distanceMeter <= target.radius

    if (inRedZone && !enteredRedZone) {
      enteredRedZone = true
      addLog('已进入高风险红圈，系统准备自动求助')
    }

    const walkSec = Math.floor((Date.now() - startAt) / 1000)
    if (inRedZone && walkSec >= minWalkSecBeforeSOS) {
      clearDangerTimer()
      addLog('检测到极端风险：尾随 / 拉扯')
      addLog('系统自动触发 SOS')
      triggerSOS('auto')
    }
  }, 1000)
}

function toggleDebug() {
  debugMode.value = !debugMode.value
}

function startWaveAnimation() {
  if (waveTimer) clearInterval(waveTimer)
  waveTimer = setInterval(() => {
    if (!isListening.value) return
    waveBars.value = waveBars.value.map(() => Math.floor(Math.random() * 34) + 18)
  }, 220)
}

function startSync() {
  if (syncTimer) clearInterval(syncTimer)
  syncTimer = setInterval(syncStateAndTick, 500)
}

function stopSync() {
  if (syncTimer) clearInterval(syncTimer)
  syncTimer = null
}

const seekerAlert = computed(() => {
  return (
    riskValue.value >= 35 ||
    isListening.value ||
    ['listening', 'danger', 'sos', 'responding', 'arrived'].includes(systemStatus.value)
  )
})

const voiceScheduleStatusText = computed(() => {
  if (!voiceMonitorSlots.value.length) return '当前未配置监测时间点，添加后将在此显示状态与列表。'
  const joined = voiceMonitorSlots.value.join('、')
  const inWin = isWithinAnyVoiceSlot(voiceMonitorSlots.value)
  if (inWin) return `当前处于监测时段内 · 计划包含：${joined}`
  return `当前不在监测时段内 · 已选时间点：${joined}`
})

const isSOS = computed(() => {
  return showVolunteerPanel.value
})

const notifiedCount = computed(() => {
  return emergencyContacts.value.filter((item) => item.notified).length
})

const systemStatusText = computed(() => {
  if (isEmergencyMode.value) return '紧急模式已启动'
  if (listeningFromSchedule.value && isListening.value) return '按计划语音监测中'
  const map = {
    idle: '待机中',
    listening: '监听中',
    danger: '风险检测中',
    sos: '已发起 SOS，等待响应',
    responding: '志愿者前往中',
    arrived: '志愿者已到达',
    safe: '事件已安全处理'
  }
  return map[systemStatus.value] || '未知状态'
})

const mapMarkers = computed(() => {
  const seekerMarker = {
    id: 100,
    latitude: myPosition.value.latitude,
    longitude: myPosition.value.longitude,
    width: 36,
    height: 45,
    zIndex: 999,
    anchor: { x: 0.5, y: 1 },
    iconPath: isSOS.value ? '/static/user-sos.png' : '/static/user-blue.png',
    callout: {
      content: isSOS.value ? '求助者｜求助中' : '求助者',
      color: '#ffffff',
      fontSize: 11,
      borderRadius: 8,
      bgColor: isSOS.value ? '#ff4d4f' : '#2d6cff',
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

  return [...volunteerMarkers, seekerMarker]
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

onMounted(() => {
  loadVoiceSlots()
  resetEmergencyContacts()
  startWaveAnimation()
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
  clearContactNotifyTimers()
  clearDangerTimer()
  stopEmergencyClock()
  if (waveTimer) clearInterval(waveTimer)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4ff 0%, #f6f7fb 32%, #f6f7fb 100%);
  padding: 24rpx;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.page.emergency {
  background: linear-gradient(180deg, #fff2f2 0%, #fff7f7 36%, #fef6f6 100%);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 28rpx 26rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f3f6ff 100%);
  box-shadow: 0 16rpx 40rpx rgba(31, 42, 68, 0.08);
  border: 1rpx solid rgba(45, 108, 255, 0.08);
  margin-bottom: 22rpx;
}

.page.emergency .hero {
  background: linear-gradient(135deg, #fff6f6 0%, #ffe8ea 100%);
  border: 1rpx solid rgba(239, 68, 68, 0.2);
  box-shadow: 0 14rpx 34rpx rgba(239, 68, 68, 0.16);
}

.hero-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #1f2a44;
}

.hero-sub {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #6d7890;
}

.hero-location {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 24rpx;
  color: #4a5d7a;
}

.loc-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #2d6cff;
  box-shadow: 0 0 0 6rpx rgba(45, 108, 255, 0.15);
}

.hero-badge {
  padding: 14rpx 22rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.hero-badge.calm {
  background: #e9f8ef;
  color: #16a34a;
}

.hero-badge.alert {
  background: #fff1f1;
  color: #e11d48;
}

.voice-plan-panel {
  margin-bottom: 22rpx;
}

.voice-entry-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #f7f9ff 0%, #eef3ff 100%);
  border: 1rpx solid rgba(45, 108, 255, 0.12);
  margin-bottom: 18rpx;
}

.voice-entry-info {
  flex: 1;
  min-width: 0;
}

.voice-entry-title {
  font-size: 28rpx;
  font-weight: 800;
  color: #1f2a44;
}

.voice-entry-desc {
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.55;
  color: #6d7890;
}

.voice-entry-btn {
  flex-shrink: 0;
}

.voice-plan-hint {
  font-size: 22rpx;
  line-height: 1.65;
  color: #6d7890;
  margin-bottom: 14rpx;
}

.voice-plan-status {
  font-size: 24rpx;
  font-weight: 700;
  color: #2d6cff;
  margin-bottom: 16rpx;
  line-height: 1.55;
}

.voice-slot-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.voice-slot-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.voice-slot-chip {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: #eef3ff;
  color: #1f3a8a;
  font-size: 24rpx;
  font-weight: 700;
}

.voice-slot-x {
  font-size: 28rpx;
  font-weight: 700;
  color: #657086;
  line-height: 1;
}

.voice-slot-empty {
  font-size: 22rpx;
  color: #8b95a7;
  line-height: 1.6;
}

.emergency-banner {
  margin-bottom: 18rpx;
  border-radius: 18rpx;
  padding: 18rpx 20rpx;
  font-size: 25rpx;
  font-weight: 700;
  color: #7f1d1d;
  background: linear-gradient(90deg, #ffe4e6 0%, #ffd6d9 100%);
  border: 1rpx solid rgba(239, 68, 68, 0.35);
  box-shadow: 0 10rpx 24rpx rgba(239, 68, 68, 0.14);
}

.map-shell,
.metric-card,
.panel {
  background: #ffffff;
  border-radius: 28rpx;
  box-shadow: 0 16rpx 36rpx rgba(31, 42, 68, 0.07);
  border: 1rpx solid #eef1f6;
}

.page.emergency .map-shell,
.page.emergency .metric-card,
.page.emergency .panel {
  border-color: rgba(239, 68, 68, 0.18);
  box-shadow: 0 12rpx 28rpx rgba(239, 68, 68, 0.1);
}

.map-shell {
  padding: 22rpx;
  margin-bottom: 22rpx;
}

.map-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.map-head-left {
  flex: 1;
}

.map-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #1f2a44;
}

.map-hint {
  font-size: 22rpx;
  color: #8b96a9;
}

.debug-toggle {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.debug-label {
  font-size: 22rpx;
  color: #657086;
  font-weight: 700;
}

.debug-switch {
  width: 72rpx;
  height: 40rpx;
  border-radius: 999rpx;
  background: #dfe3ea;
  position: relative;
}

.debug-switch.on {
  background: #2d6cff;
}

.debug-knob {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s ease;
}

.debug-switch.on .debug-knob {
  transform: translateX(32rpx);
}

.map {
  width: 100%;
  height: 430rpx;
  border-radius: 22rpx;
  overflow: hidden;
}

.vol-response {
  margin-top: 12rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #eef1f6;
}

.vol-response-title,
.panel-title {
  font-size: 28rpx;
  font-weight: 800;
  color: #1f2a44;
  margin-bottom: 14rpx;
}

.emergency-info-card {
  margin-bottom: 22rpx;
  background: linear-gradient(160deg, #fff8f8 0%, #ffecec 100%);
}

.emergency-contact-card {
  margin-bottom: 22rpx;
  background: linear-gradient(160deg, #fffafb 0%, #fff1f2 100%);
}

.contact-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(239, 68, 68, 0.12);
}

.contact-row:last-child {
  border-bottom: none;
}

.contact-left {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.contact-name {
  font-size: 27rpx;
  font-weight: 700;
  color: #1f2a44;
}

.contact-sub {
  font-size: 22rpx;
  color: #6d7890;
}

.contact-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
}

.contact-status {
  font-size: 23rpx;
  font-weight: 700;
}

.contact-status.pending { color: #64748b; }
.contact-status.sending { color: #f59e0b; }
.contact-status.success { color: #16a34a; }

.contact-time {
  font-size: 20rpx;
  color: #64748b;
}

.sms-preview {
  margin-top: 16rpx;
  border-radius: 16rpx;
  padding: 16rpx;
  background: #ffffff;
  border: 1rpx dashed rgba(239, 68, 68, 0.35);
}

.sms-title {
  font-size: 23rpx;
  color: #7f1d1d;
  font-weight: 700;
  margin-bottom: 10rpx;
}

.sms-content {
  font-size: 23rpx;
  color: #4b5563;
  line-height: 1.65;
}

.emergency-action-row {
  margin-top: 16rpx;
  display: flex;
  gap: 14rpx;
}

.vol-card {
  padding: 18rpx;
  border-radius: 20rpx;
  background: #f8faff;
  margin-bottom: 12rpx;
}

.vol-top,
.row,
.eta-row,
.sos-row,
.chip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
}

.vol-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2a44;
}

.vol-meta,
.vol-honor,
.eta-text,
.eta-percent,
.k,
.metric-label,
.metric-state,
.listen-off,
.log-line {
  font-size: 22rpx;
  color: #6d7890;
}

.pill {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.pill.idle { background: #edf3ff; color: #2d6cff; }
.pill.accepted { background: #fff4e5; color: #f59e0b; }
.pill.coming { background: #e9fbf4; color: #10b981; }
.pill.arrived { background: #ffecec; color: #ef4444; }

.track {
  height: 12rpx;
  border-radius: 999rpx;
  background: #edf1f7;
  overflow: hidden;
  margin-top: 10rpx;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, #2d6cff 0%, #22b573 100%);
  border-radius: 999rpx;
}

.metrics {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.metric-card {
  flex: 1;
  padding: 20rpx 18rpx;
}

.metric-value {
  margin-top: 10rpx;
  font-size: 46rpx;
  font-weight: 800;
  color: #2d6cff;
}

.metric-value.hot {
  color: #ef4444;
}

.wave-row {
  margin-top: 14rpx;
  height: 48rpx;
  display: flex;
  align-items: flex-end;
  gap: 8rpx;
}

.wave-bar {
  width: 10rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, #2d6cff 0%, #22b573 100%);
}

.sos-row {
  margin-bottom: 20rpx;
}

.sos-btn {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ff5a5f 0%, #e63b47 100%);
  color: #ffffff;
  font-size: 40rpx;
  font-weight: 800;
  box-shadow: 0 18rpx 30rpx rgba(230, 59, 71, 0.22);
}

.help-pill {
  padding: 0 30rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 999rpx;
  background: #ffffff;
  border: 2rpx solid #ffd4d8;
  color: #e63b47;
  font-size: 28rpx;
  font-weight: 700;
}

.panel {
  padding: 22rpx;
  margin-bottom: 20rpx;
}

.row {
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f1f4f8;
}

.row:last-child {
  border-bottom: none;
}

.v {
  font-size: 24rpx;
  color: #1f2a44;
  font-weight: 700;
}

.v.danger {
  color: #ef4444;
}

.debug-panel .chip-row + .chip-row {
  margin-top: 12rpx;
}

.chip {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  border-radius: 18rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.chip.primary { background: #edf3ff; color: #2d6cff; }
.chip.warn { background: #fff4e5; color: #f59e0b; }
.chip.danger { background: #ffecec; color: #ef4444; }
.chip.ghost { background: #f4f6f9; color: #667085; }
</style>
