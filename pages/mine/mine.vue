<template>
  <view class="page">
    <view class="user-card">
      <image class="avatar" src="/static/avatar-user.png" mode="aspectFill"></image>
      <view class="user-name">{{ profile.username }}</view>
      <view class="user-phone">{{ maskedPhone }}</view>
      <view class="user-desc">{{ profile.role === 'volunteer' ? '社区互助志愿者' : '乡村互助守护用户' }}</view>
    </view>

    <view class="menu-card">
      <view class="menu-item clickable" @click="goEmergencyContact">
        <text class="menu-label">紧急联系人</text>
        <view class="menu-right">
          <text class="menu-value">{{ emergencyContactText }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
      <view class="menu-item">
        <text class="menu-label">默认地址</text>
        <text class="menu-value">{{ profile.village }}</text>
      </view>
      <view class="menu-item">
        <text class="menu-label">夜间守护模式</text>
        <view class="setting-control">
          <text class="menu-value" :class="{ active: profile.nightGuardEnabled }">
            {{ settingText(profile.nightGuardEnabled) }}
          </text>
          <switch
            color="#E85B5B"
            :checked="profile.nightGuardEnabled"
            @change="onSecurityChange('nightGuardEnabled', $event)"
          />
        </view>
      </view>
      <view class="menu-item">
        <text class="menu-label">语音风险检测</text>
        <view class="setting-control">
          <text class="menu-value" :class="{ active: profile.voiceDetectEnabled }">
            {{ settingText(profile.voiceDetectEnabled) }}
          </text>
          <switch
            color="#E85B5B"
            :checked="profile.voiceDetectEnabled"
            @change="onSecurityChange('voiceDetectEnabled', $event)"
          />
        </view>
      </view>
      <view class="menu-item">
        <text class="menu-label">高风险区域提醒</text>
        <view class="setting-control">
          <text class="menu-value" :class="{ active: profile.riskAreaAlertEnabled }">
            {{ settingText(profile.riskAreaAlertEnabled) }}
          </text>
          <switch
            color="#E85B5B"
            :checked="profile.riskAreaAlertEnabled"
            @change="onSecurityChange('riskAreaAlertEnabled', $event)"
          />
        </view>
      </view>
    </view>

    <view class="record-card">
      <view class="card-title">我的求助记录</view>

      <view class="record-item" v-for="(item, index) in myRecords" :key="index">
        <view class="record-top">
          <text class="record-time">{{ item.time }}</text>
          <text class="record-status" :class="item.statusClass">{{ item.status }}</text>
        </view>
        <view class="record-location">{{ item.location }}</view>
        <view class="record-desc">{{ item.desc }}</view>
      </view>
    </view>

    <view class="about-card">
      <view class="card-title">关于平台</view>
      <view class="about-text">
        本平台聚焦乡村及周边弱势群体安全互助场景，支持 SOS 紧急求助、附近志愿者响应、风险区域预警与夜间守护等功能。
      </view>
    </view>

    <button class="logout-btn" @click="handleLogout">退出登录</button>
  </view>
</template>

<script>
import { getUserProfile, updateSecuritySettings } from '@/api/user.js'

function maskPhone(phone) {
  if (!phone) return '未绑定'
  return String(phone).replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

function normalizeProfile(data = {}) {
  return {
    id: data.id || '',
    username: data.username || data.name || '用户',
    phone: data.phone || data.mobile || '',
    village: data.village || data.address || '未设置',
    role: data.role || 'user',
    emergencyContactName: data.emergencyContactName || data.contactName || '',
    emergencyContactRelation: data.emergencyContactRelation || data.contactRelation || '',
    emergencyContactPhone: data.emergencyContactPhone || data.contactPhone || '',
    nightGuardEnabled: Boolean(data.nightGuardEnabled),
    voiceDetectEnabled: Boolean(data.voiceDetectEnabled),
    riskAreaAlertEnabled: Boolean(data.riskAreaAlertEnabled)
  }
}

export default {
  data() {
    return {
      loading: false,
      profile: normalizeProfile(uni.getStorageSync('userInfo') || {}),
      myRecords: [
        {
          time: '2026-04-19 21:43',
          status: '已处理',
          statusClass: 'done',
          location: '村东侧小路口',
          desc: '已通知 3 名附近志愿者，首位志愿者 2 分钟内到达。'
        },
        {
          time: '2026-04-16 22:08',
          status: '已处理',
          statusClass: 'done',
          location: '村西侧偏僻路段',
          desc: '系统检测到风险环境，已自动提示开启防护模式。'
        },
        {
          time: '2026-04-12 19:20',
          status: '已关闭',
          statusClass: 'closed',
          location: '镇口公交站',
          desc: '用户手动取消求助，系统已记录本次异常。'
        }
      ]
    }
  },
  computed: {
    maskedPhone() {
      return maskPhone(this.profile.phone)
    },
    emergencyContactText() {
      if (this.profile.emergencyContactName && this.profile.emergencyContactPhone) {
        return `${this.profile.emergencyContactName} / ${maskPhone(this.profile.emergencyContactPhone)}`
      }
      return '未设置'
    }
  },
  onShow() {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.loadProfile()
  },
  methods: {
    maskPhone,

    settingText(value) {
      return value ? '已开启' : '已关闭'
    },

    async loadProfile() {
      this.loading = true
      try {
        const res = await getUserProfile()
        if (res.code === 200) {
          const nextProfile = normalizeProfile(res.data || {})
          this.profile = nextProfile
          uni.setStorageSync('userInfo', nextProfile)
          if (nextProfile.id) uni.setStorageSync('openid', `user_${nextProfile.id}`)
        } else {
          uni.showToast({ title: res.message || '用户信息加载失败', icon: 'none' })
        }
      } catch (_) {
        /* token 失效由 request 统一处理 */
      } finally {
        this.loading = false
      }
    },

    goEmergencyContact() {
      uni.navigateTo({ url: '/pages/emergency-contact/emergency-contact' })
    },

    async onSecurityChange(key, e) {
      const oldValue = this.profile[key]
      const nextProfile = {
        ...this.profile,
        [key]: e.detail.value
      }
      this.profile = nextProfile
      uni.setStorageSync('userInfo', nextProfile)

      try {
        const res = await updateSecuritySettings({
          nightGuardEnabled: nextProfile.nightGuardEnabled,
          voiceDetectEnabled: nextProfile.voiceDetectEnabled,
          riskAreaAlertEnabled: nextProfile.riskAreaAlertEnabled
        })
        if (res.code !== 200) {
          throw new Error(res.message || '保存失败')
        }
        uni.showToast({ title: '设置已保存', icon: 'success' })
      } catch (err) {
        this.profile = {
          ...this.profile,
          [key]: oldValue
        }
        uni.setStorageSync('userInfo', this.profile)
        uni.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
      }
    },

    handleLogout() {
      uni.showModal({
        title: '确认退出',
        content: '退出后需要重新登录',
        confirmColor: '#E85B5B',
        success: (res) => {
          if (!res.confirm) return
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.removeStorageSync('openid')
          uni.removeStorageSync('volunteerProfile')
          uni.reLaunch({ url: '/pages/login/login' })
        }
      })
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f6f7fb;
  padding: 24rpx;
  padding-bottom: 56rpx;
  box-sizing: border-box;
}

.user-card,
.menu-card,
.record-card,
.about-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 10rpx 24rpx rgba(31, 42, 68, 0.06);
}

.user-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: linear-gradient(180deg, #ffffff 0%, #fff7f7 100%);
}

.avatar {
  width: 130rpx;
  height: 130rpx;
  border-radius: 50%;
  background: #eef3ff;
}

.user-name {
  margin-top: 18rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2a44;
}

.user-phone {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #6d7890;
}

.user-desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #8b95a7;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20rpx;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #eef1f6;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-label {
  font-size: 26rpx;
  color: #1f2a44;
  flex-shrink: 0;
}

.menu-right,
.setting-control {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  min-width: 0;
}

.menu-value {
  font-size: 24rpx;
  color: #6d7890;
  text-align: right;
}

.arrow {
  color: #b8c0cc;
  font-size: 40rpx;
  line-height: 1;
}

.active {
  color: #22b573;
  font-weight: 700;
}

.card-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2a44;
  margin-bottom: 10rpx;
}

.record-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eef1f6;
}

.record-item:last-child {
  border-bottom: none;
}

.record-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-time {
  font-size: 24rpx;
  color: #6d7890;
}

.record-status {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.done {
  background: #e9f8ef;
  color: #22b573;
}

.closed {
  background: #f1f3f7;
  color: #7f8898;
}

.record-location {
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #1f2a44;
  font-weight: 600;
}

.record-desc,
.about-text {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6d7890;
}

.logout-btn {
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 46rpx;
  background: #ffffff;
  color: #e85b5b;
  border: 2rpx solid #ffd0d0;
  font-size: 30rpx;
  font-weight: 700;
}
</style>
