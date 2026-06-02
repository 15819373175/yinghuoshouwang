<template>
  <view class="page">
    <view class="card">
      <view class="title">志愿者注册</view>
      <view class="subtitle">完善志愿者资料后，才能进入响应中心</view>

      <picker :range="genderOptions" :value="genderIndex" @change="onGenderChange">
        <view class="input picker-input">{{ form.gender || '请选择性别' }}</view>
      </picker>

      <input class="input" v-model.trim="form.age" type="number" placeholder="请输入年龄" />
      <input class="input" v-model.trim="form.job" placeholder="请输入工作" />
      <input class="input" v-model.trim="form.honor" placeholder="请输入荣誉" />
      <input class="input" v-model.trim="form.serviceHours" type="number" placeholder="请输入志愿时长（小时）" />

      <button class="btn primary" :loading="loading" @click="handleRegister">注册志愿者</button>
    </view>
  </view>
</template>

<script>
const VOLUNTEER_PROFILE_KEY = 'volunteerProfile'

export default {
  data() {
    return {
      loading: false,
      genderOptions: ['男', '女', '其他'],
      genderIndex: 0,
      form: {
        gender: '',
        age: '',
        job: '',
        honor: '',
        serviceHours: ''
      }
    }
  },
  onLoad() {
    const userInfo = uni.getStorageSync('userInfo') || {}
    const saved = uni.getStorageSync(VOLUNTEER_PROFILE_KEY)
    if (saved && saved.userId === userInfo.id) {
      console.log('已读取志愿者注册信息：', saved)
      this.form = {
        gender: saved.gender || '',
        age: String(saved.age || ''),
        job: saved.job || '',
        honor: saved.honor || '',
        serviceHours: String(saved.serviceHours || '')
      }
      const idx = this.genderOptions.indexOf(this.form.gender)
      if (idx >= 0) this.genderIndex = idx
    }
  },
  onBackPress() {
    const saved = uni.getStorageSync(VOLUNTEER_PROFILE_KEY)
    if (!saved || !saved.registered) {
      uni.showToast({ title: '请先完成志愿者注册', icon: 'none' })
      return true
    }
    return false
  },
  methods: {
    onGenderChange(e) {
      this.genderIndex = Number(e.detail.value)
      this.form.gender = this.genderOptions[this.genderIndex]
    },
    handleRegister() {
      const userInfo = uni.getStorageSync('userInfo') || {}
      if (!userInfo.id) {
        return uni.reLaunch({ url: '/pages/login/login' })
      }
      if (!this.form.gender) return uni.showToast({ title: '请选择性别', icon: 'none' })
      if (!this.form.age) return uni.showToast({ title: '请输入年龄', icon: 'none' })
      if (!this.form.job) return uni.showToast({ title: '请输入工作', icon: 'none' })
      if (!this.form.honor) return uni.showToast({ title: '请输入荣誉', icon: 'none' })
      if (!this.form.serviceHours) return uni.showToast({ title: '请输入志愿时长', icon: 'none' })
      if (Number.isNaN(Number(this.form.age))) return uni.showToast({ title: '年龄必须是数字', icon: 'none' })
      if (Number.isNaN(Number(this.form.serviceHours))) return uni.showToast({ title: '志愿时长必须是数字', icon: 'none' })

      const profile = {
        userId: userInfo.id,
        username: userInfo.username,
        nickname: userInfo.nickname,
        phone: userInfo.phone,
        gender: this.form.gender,
        age: Number(this.form.age),
        job: this.form.job,
        honor: this.form.honor,
        serviceHours: Number(this.form.serviceHours),
        registered: true,
        registeredAt: Date.now()
      }

      this.loading = true
      uni.setStorageSync(VOLUNTEER_PROFILE_KEY, profile)
      console.log('志愿者注册信息已保存：', profile)
      this.loading = false
      uni.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/volunteer/volunteer' })
      }, 500)
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f3ef;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  box-sizing: border-box;
}

.card {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 48rpx 36rpx;
  box-shadow: 0 20rpx 60rpx rgba(232, 91, 91, 0.14);
  box-sizing: border-box;
}

.title {
  font-size: 44rpx;
  font-weight: 800;
  color: #b4232a;
}

.subtitle {
  margin-top: 12rpx;
  margin-bottom: 40rpx;
  font-size: 26rpx;
  color: #9a6f6f;
}

.input {
  height: 92rpx;
  line-height: 92rpx;
  background: #fff7f6;
  border-radius: 20rpx;
  padding: 0 28rpx;
  margin-bottom: 24rpx;
  font-size: 28rpx;
  border: 1rpx solid #f7dddd;
  box-sizing: border-box;
}

.picker-input {
  color: #1f2a44;
}

.btn {
  height: 92rpx;
  border-radius: 46rpx;
  font-size: 30rpx;
  margin-top: 20rpx;
}

.primary {
  background: linear-gradient(135deg, #e85b5b, #f08a6b);
  color: #ffffff;
}
</style>
