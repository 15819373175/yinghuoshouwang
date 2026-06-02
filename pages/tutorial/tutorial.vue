<template>
  <scroll-view class="page" scroll-y :show-scrollbar="false">
    <view class="hero">
      <view class="hero-title">使用教程</view>
      <view class="hero-sub">用 5 个步骤了解安全守护、SOS 求助和志愿者响应。</view>
      <view v-if="playingTitle" class="playing-tip">正在播放：{{ playingTitle }}</view>
    </view>

    <view v-for="item in tutorials" :key="item.id" class="tutorial-card">
      <view class="card-head">
        <view class="emoji">{{ item.icon }}</view>
        <view class="card-text">
          <view class="card-title">{{ item.title }}</view>
          <view class="card-desc">{{ item.desc }}</view>
        </view>
      </view>

      <view class="play-btn" @click="playAndOpen(item)">
        播放讲解并查看
      </view>
    </view>

    <view class="home-btn" @click="goHome">返回首页</view>
  </scroll-view>
</template>

<script setup>
import { ref } from 'vue'
import { onUnload } from '@dcloudio/uni-app'

const playingTitle = ref('')
let audio = null
let jumpTimer = null

const tutorials = [
  {
    id: 'home',
    icon: '🏠',
    title: '首页守护',
    audio: '/static/audio/tutorial-home.mp3',
    target: '/pages/index/index',
    desc: '首页用于查看当前安全状态、地图位置和附近志愿者信息。正常状态下显示安全状态，触发 SOS 后进入紧急求助状态。'
  },
  {
    id: 'sos',
    icon: '🆘',
    title: '智能 SOS',
    audio: '/static/audio/tutorial-sos.mp3',
    target: '/pages/index/index',
    desc: '遇到危险时，点击 SOS 按钮即可发起求助。系统会自动获取当前位置，并向附近志愿者发送求助提醒。'
  },
  {
    id: 'voice',
    icon: '🎙️',
    title: '语音守护',
    audio: '/static/audio/tutorial-voice.mp3',
    target: '/pages/index/index',
    desc: '当用户无法手动操作手机时，可以通过“救命”等关键词触发系统识别。识别到风险语音后，系统自动进入 SOS 流程。'
  },
  {
    id: 'volunteer',
    icon: '🤝',
    title: '志愿者响应',
    audio: '/static/audio/tutorial-volunteer.mp3',
    target: '/pages/volunteer/volunteer',
    fallback: '/pages/index/index',
    desc: '求助发出后，附近志愿者会收到提醒。系统会优先展示距离较近、状态可用的志愿者，并显示响应进度。'
  },
  {
    id: 'map',
    icon: '🗺️',
    title: '风险地图',
    audio: '/static/audio/tutorial-map.mp3',
    target: '/pages/index/index',
    desc: '地图中会显示风险区域和偏僻区域。红色区域代表风险较高，灰色区域代表相对偏僻，进入相关区域时系统会进行提醒。'
  }
]

function clearJumpTimer() {
  if (jumpTimer) clearTimeout(jumpTimer)
  jumpTimer = null
}

function stopAudio() {
  if (!audio) return
  try {
    audio.stop()
    audio.destroy()
  } catch (_) {
    /* ignore */
  }
  audio = null
}

function cleanup() {
  clearJumpTimer()
  stopAudio()
  playingTitle.value = ''
}

function openTarget(item) {
  const url = item.target
  uni.switchTab({
    url,
    fail: () => {
      uni.switchTab({
        url: item.fallback || '/pages/index/index',
        fail: () => uni.showToast({ title: '页面打开失败', icon: 'none' })
      })
    }
  })
}

function playAndOpen(item) {
  cleanup()
  playingTitle.value = item.title
  uni.showToast({ title: '正在播放讲解', icon: 'none' })

  audio = uni.createInnerAudioContext()
  audio.src = item.audio
  audio.onError(() => {
    uni.showToast({ title: '音频播放失败，请检查文件路径', icon: 'none' })
  })

  try {
    audio.play()
  } catch (_) {
    uni.showToast({ title: '音频播放失败，请检查文件路径', icon: 'none' })
  }

  jumpTimer = setTimeout(() => {
    openTarget(item)
  }, 2500)
}

function goHome() {
  cleanup()
  uni.switchTab({ url: '/pages/index/index' })
}

onUnload(() => {
  cleanup()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff1f2 0%, #fff7f7 42%, #f8fafc 100%);
  padding: 28rpx 24rpx calc(48rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.hero {
  padding: 34rpx 28rpx;
  border-radius: 30rpx;
  background: linear-gradient(135deg, #e85b5b 0%, #f08a6b 100%);
  color: #ffffff;
  box-shadow: 0 16rpx 36rpx rgba(232, 91, 91, 0.2);
  margin-bottom: 24rpx;
}

.hero-title {
  font-size: 44rpx;
  font-weight: 800;
}

.hero-sub {
  margin-top: 12rpx;
  font-size: 26rpx;
  line-height: 1.6;
  opacity: 0.94;
}

.playing-tip {
  margin-top: 18rpx;
  display: inline-flex;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.22);
  font-size: 24rpx;
  font-weight: 700;
}

.tutorial-card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 26rpx;
  margin-bottom: 22rpx;
  box-shadow: 0 12rpx 30rpx rgba(148, 64, 64, 0.08);
  border: 1rpx solid rgba(232, 91, 91, 0.1);
}

.card-head {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
}

.emoji {
  width: 76rpx;
  height: 76rpx;
  border-radius: 24rpx;
  background: #fff1f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38rpx;
  flex-shrink: 0;
}

.card-text {
  flex: 1;
}

.card-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #1f2a44;
}

.card-desc {
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #65505a;
  line-height: 1.7;
}

.play-btn,
.home-btn {
  height: 82rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 800;
}

.play-btn {
  margin-top: 24rpx;
  background: linear-gradient(135deg, #f08a6b 0%, #e85b5b 100%);
  color: #ffffff;
}

.home-btn {
  margin: 28rpx 0 12rpx;
  background: #ffffff;
  color: #e85b5b;
  border: 2rpx solid #ffd4d8;
  box-shadow: 0 10rpx 24rpx rgba(148, 64, 64, 0.06);
}
</style>
