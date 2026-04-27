<template>
  <view class="page">
    <!-- 用户卡 -->
    <view class="user-card">
      <image class="avatar" src="/static/avatar-user.png" mode="aspectFill"></image>
      <view class="user-name">用户</view>
      <view class="user-phone">138****8899</view>
      <view class="user-desc">乡村互助网络体验用户</view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-card">
      <view class="menu-item">
        <text class="menu-label">紧急联系人</text>
        <text class="menu-value">妈妈 / 138****2234</text>
      </view>
      <view class="menu-item">
        <text class="menu-label">默认地址</text>
        <text class="menu-value">XX村三组</text>
      </view>
      <view class="menu-item">
        <text class="menu-label">夜间守护模式</text>
        <text class="menu-value active">已开启</text>
      </view>
      <view class="menu-item">
        <text class="menu-label">语音风险检测</text>
        <text class="menu-value active">已开启</text>
      </view>
      <view class="menu-item">
        <text class="menu-label">高风险区域提醒</text>
        <text class="menu-value active">已开启</text>
      </view>
    </view>

    <!-- 我的求助记录 -->
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

    <!-- 关于 -->
    <view class="about-card">
      <view class="card-title">关于平台</view>
      <view class="about-text">
        本平台聚焦乡村及周边弱势群体安全互助场景，支持 SOS 紧急求助、附近志愿者响应、风险区域预警与夜间守护等功能。
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const myRecords = ref([
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
])
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f6f7fb;
  padding: 24rpx;
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
  padding: 22rpx 0;
  border-bottom: 1rpx solid #eef1f6;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-label {
  font-size: 26rpx;
  color: #1f2a44;
}

.menu-value {
  font-size: 24rpx;
  color: #6d7890;
  text-align: right;
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

.record-desc {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #6d7890;
}

.about-text {
  font-size: 24rpx;
  line-height: 1.8;
  color: #6d7890;
}
</style>
