<template>
  <view class="page">
    <view class="card">
      <view class="title">设置紧急联系人</view>
      <view class="subtitle">紧急求助时将优先通知该联系人</view>

      <view class="field">
        <text class="label">联系人姓名</text>
        <input class="input" v-model.trim="form.emergencyContactName" placeholder="例如：妈妈" />
      </view>

      <view class="field">
        <text class="label">与本人关系</text>
        <input class="input" v-model.trim="form.emergencyContactRelation" placeholder="例如：母女" />
      </view>

      <view class="field">
        <text class="label">联系人电话</text>
        <input
          class="input"
          v-model.trim="form.emergencyContactPhone"
          type="number"
          maxlength="11"
          placeholder="请输入 11 位手机号"
        />
      </view>

      <button class="save-btn" :loading="loading" @click="handleSave">保存</button>
    </view>
  </view>
</template>

<script>
import { getUserProfile, updateEmergencyContact } from '@/api/user.js'

function normalizeContact(data = {}) {
  return {
    emergencyContactName: data.emergencyContactName || data.contactName || '',
    emergencyContactRelation: data.emergencyContactRelation || data.contactRelation || '',
    emergencyContactPhone: data.emergencyContactPhone || data.contactPhone || ''
  }
}

export default {
  data() {
    return {
      loading: false,
      form: normalizeContact(uni.getStorageSync('userInfo') || {})
    }
  },
  onLoad() {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.loadContact()
  },
  methods: {
    async loadContact() {
      try {
        const res = await getUserProfile()
        if (res.code === 200) {
          this.form = normalizeContact(res.data || {})
        }
      } catch (_) {
        /* token 失效由 request 统一处理 */
      }
    },

    async handleSave() {
      if (!this.form.emergencyContactName) {
        return uni.showToast({ title: '联系人姓名不能为空', icon: 'none' })
      }
      if (!this.form.emergencyContactPhone) {
        return uni.showToast({ title: '联系人电话不能为空', icon: 'none' })
      }
      if (!/^1\d{10}$/.test(this.form.emergencyContactPhone)) {
        return uni.showToast({ title: '请输入正确手机号', icon: 'none' })
      }

      this.loading = true
      try {
        const res = await updateEmergencyContact(this.form)
        if (res.code === 200) {
          const oldUser = uni.getStorageSync('userInfo') || {}
          uni.setStorageSync('userInfo', {
            ...oldUser,
            ...this.form
          })
          uni.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 600)
        } else {
          uni.showToast({ title: res.message || '保存失败', icon: 'none' })
        }
      } catch (_) {
        uni.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f6f7fb;
  padding: 24rpx;
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  box-shadow: 0 10rpx 24rpx rgba(31, 42, 68, 0.06);
}

.title {
  font-size: 36rpx;
  font-weight: 800;
  color: #1f2a44;
}

.subtitle {
  margin-top: 10rpx;
  margin-bottom: 32rpx;
  font-size: 24rpx;
  color: #8b95a7;
}

.field {
  margin-bottom: 26rpx;
}

.label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 25rpx;
  color: #4a5568;
  font-weight: 700;
}

.input {
  height: 92rpx;
  background: #fff7f7;
  border-radius: 18rpx;
  padding: 0 26rpx;
  border: 1rpx solid #f6dddd;
  font-size: 28rpx;
  box-sizing: border-box;
}

.save-btn {
  margin-top: 28rpx;
  height: 92rpx;
  border-radius: 46rpx;
  background: linear-gradient(135deg, #e85b5b, #f08a6b);
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 700;
}
</style>
