<template>
  <div class="favorites-page">
    <!-- ===== 顶部横幅 ===== -->
    <header class="page-hero">
      <div class="hero-content">
        <span class="hero-badge">⭐ 我的宝典</span>
        <h1 class="hero-title">我的收藏</h1>
        <p class="hero-desc">你主动标记的重点题目，方便集中复习</p>
      </div>
      <div class="hero-actions">
        <button class="btn-back" @click="goBack">
          ← 返回
        </button>
      </div>
    </header>

    <!-- ===== 统计信息 ===== -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-number">{{ favoritesData.total || 0 }}</span>
        <span class="stat-label">已收藏题目</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ favoriteChaptersCount }}</span>
        <span class="stat-label">覆盖章节</span>
      </div>
    </div>

    <!-- ===== 加载状态 ===== -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载收藏列表...</p>
    </div>

    <!-- ===== 空状态 ===== -->
    <div v-else-if="!favoritesData.list?.length" class="empty-state">
      <div class="empty-icon">📖</div>
      <h3>还没有收藏题目</h3>
      <p>遇到好题、重点题时，点击「收藏」按钮即可加入宝典</p>
      <button class="btn-primary" @click="goBack">去刷题</button>
    </div>

    <!-- ===== 收藏列表 ===== -->
    <div v-else class="favorites-list">
      <div
          v-for="item in favoritesData.list"
          :key="item.questionId"
          class="favorite-card"
      >
        <div class="card-header">
          <span class="type-tag" :class="`type-${item.questionType}`">
            {{ getTypeName(item.questionType) }}
          </span>
          <span class="chapter-tag">{{ getChapterLabel(item.chapter) }}</span>
          <span class="favorite-time">⭐ 收藏于 {{ formatTime(item.createdAt) }}</span>
        </div>

        <div class="card-body">
          <div class="question-title">{{ item.question || item.title || '（题目内容）' }}</div>
          <div v-if="item.options" class="question-options">
            {{ item.options }}
          </div>
        </div>

        <div class="card-footer">
          <button class="btn-unfavorite" @click="handleUnfavorite(item.questionId)">
            ❌ 取消收藏
          </button>
          <!-- ===== 修改：练习此题触发单题练习 ===== -->
          <button class="btn-practice" @click="handleSinglePractice(item)">
            📝 练习此题
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 分页（如果有更多） ===== -->
    <div v-if="favoritesData.total > favoritesData.list.length" class="pagination-more">
      <button class="btn-load-more" @click="loadMore" :disabled="loadingMore">
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { getFavorites, removeFavorite } from '@/api/student';
// ===== [修改] 不再需要 startSingleQuestion API =====

// ================================================================
// [修改] 添加 start-single-practice 事件
// ================================================================
const emit = defineEmits(['close', 'start-exam', 'start-single-practice']);

// ================================================================
// 常量
// ================================================================
const TYPE_NAMES = {
  1: '判断题',
  2: '单选题',
  3: '多选题',
  4: '填空题',
  5: '简答题',
  6: '程序论述题',
};

const CHAPTER_NAMES = {
  1: '计算思维基础',
  2: '计算机系统基础',
  3: 'Python 程序设计',
  4: '算法与问题求解',
  5: '数字素养与数字化',
  6: '人工智能基础',
  7: '智能技术应用',
  8: '智能技术与机器学习',
  9: '大模型与办公实践',
  10: '科技伦理与治理',
};

const getTypeName = (id) => {
  return TYPE_NAMES[id] || `题型${id}`;
};

const getChapterLabel = (id) => {
  const num = Number(id);
  return `第${num}章 ${CHAPTER_NAMES[num] || '未命名章节'}`;
};

const formatTime = (v) => {
  if (!v) return '';
  try {
    return new Date(v).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

// ================================================================
// 组件逻辑
// ================================================================
const loading = ref(false);
const loadingMore = ref(false);
const page = ref(1);
const pageSize = ref(20);

const favoritesData = reactive({
  list: [],
  total: 0,
});

const favoriteChaptersCount = computed(() => {
  const chapters = new Set();
  favoritesData.list.forEach(item => {
    if (item.chapter) chapters.add(item.chapter);
  });
  return chapters.size;
});

// ===== 加载收藏列表 =====
const loadFavorites = async (append = false) => {
  if (loading.value || loadingMore.value) return;

  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
  }

  try {
    const res = await getFavorites({ page: page.value, size: pageSize.value });
    const list = res.list || [];
    const total = res.total || 0;

    if (append) {
      favoritesData.list = [...favoritesData.list, ...list];
    } else {
      favoritesData.list = list;
    }
    favoritesData.total = total;
  } catch (e) {
    console.warn('加载收藏失败:', e.message);
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// ===== 加载更多 =====
const loadMore = () => {
  page.value++;
  loadFavorites(true);
};

// ===== 取消收藏 =====
const handleUnfavorite = async (questionId) => {
  if (!window.confirm('确定要取消收藏这道题吗？')) return;

  try {
    await removeFavorite(questionId);
    favoritesData.list = favoritesData.list.filter(
        item => item.questionId !== questionId
    );
    favoritesData.total--;

    if (favoritesData.list.length === 0 && page.value > 1) {
      page.value = 1;
      await loadFavorites();
    }

    window.dispatchEvent(new CustomEvent('toast', {
      detail: { message: '已取消收藏', type: 'success' }
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { message: e.message || '取消收藏失败', type: 'error' }
    }));
  }
};

// ===== [修改] 单题练习 =====
const handleSinglePractice = (item) => {
  emit('start-single-practice', item.questionId);
};

// ===== 返回 =====
const goBack = () => {
  emit('close');
};

// ================================================================
// 生命周期
// ================================================================
onMounted(() => {
  loadFavorites();
});
</script>

<style scoped>
/* ================================================================
   收藏夹页面样式
   ================================================================ */
.favorites-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

/* ===== 顶部横幅 ===== */
.page-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 34px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  box-shadow: 0 8px 30px rgba(245, 158, 11, 0.25);
  margin-bottom: 20px;
}

.hero-content .hero-badge {
  font-size: 12px;
  opacity: 0.8;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 4px;
}

.hero-content .hero-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.hero-content .hero-desc {
  font-size: 14px;
  opacity: 0.85;
  color: rgba(255, 255, 255, 0.9);
  margin: 4px 0 0;
}

.btn-back {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* ===== 统计栏 ===== */
.stats-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px 20px;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: 10px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #B45309;
}

.stat-label {
  font-size: 14px;
  color: #92400E;
}

/* ===== 加载状态 ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #94A3B8;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E2E8F0;
  border-top: 3px solid #F59E0B;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== 空状态 ===== */
.empty-state {
  text-align: center;
  padding: 60px 40px;
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  color: #1E293B;
  margin: 0 0 8px;
}

.empty-state p {
  color: #64748B;
  font-size: 14px;
  margin: 0 0 20px;
}

.btn-primary {
  padding: 10px 28px;
  background: #6366F1;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn-primary:hover {
  background: #4F46E5;
}

/* ===== 收藏列表 ===== */
.favorites-list {
  display: grid;
  gap: 16px;
}

.favorite-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 18px 22px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.favorite-card:hover {
  border-color: #FDE68A;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.type-tag {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 12px;
  border-radius: 12px;
}
.type-tag.type-1 { background: #EDE9FE; color: #6D28D9; }
.type-tag.type-2 { background: #DBEAFE; color: #1D4ED8; }
.type-tag.type-3 { background: #FCE7F3; color: #BE185D; }
.type-tag.type-4 { background: #D1FAE5; color: #047857; }
.type-tag.type-5 { background: #FEF3C7; color: #B45309; }
.type-tag.type-6 { background: #FFEDD5; color: #C2410C; }

.chapter-tag {
  font-size: 12px;
  color: #94A3B8;
}

.favorite-time {
  font-size: 12px;
  color: #94A3B8;
  margin-left: auto;
}

.card-body {
  margin-bottom: 12px;
}

.question-title {
  font-size: 15px;
  font-weight: 500;
  color: #1E293B;
  line-height: 1.8;
}

.question-options {
  font-size: 13px;
  color: #64748B;
  margin-top: 4px;
  padding: 8px 12px;
  background: #F8FAFC;
  border-radius: 6px;
  white-space: pre-wrap;
}

.card-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
}

.btn-unfavorite {
  padding: 6px 16px;
  border: 1px solid #FCA5A5;
  border-radius: 8px;
  background: #FEF2F2;
  color: #B91C1C;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-unfavorite:hover {
  background: #FEE2E2;
}

.btn-practice {
  padding: 6px 16px;
  border: 1px solid #6366F1;
  border-radius: 8px;
  background: #EEF2FF;
  color: #4338CA;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-practice:hover {
  background: #E0E7FF;
}

/* ===== 加载更多 ===== */
.pagination-more {
  text-align: center;
  margin-top: 20px;
}

.btn-load-more {
  padding: 8px 24px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
  color: #64748B;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-load-more:hover:not(:disabled) {
  background: #F1F5F9;
}
.btn-load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .page-hero {
    flex-direction: column;
    text-align: center;
    padding: 20px;
    gap: 12px;
  }
  .stats-bar {
    flex-direction: column;
    gap: 10px;
  }
  .stat-item {
    justify-content: center;
  }
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .favorite-time {
    margin-left: 0;
  }
  .card-footer {
    flex-direction: column;
  }
  .btn-unfavorite,
  .btn-practice {
    width: 100%;
    text-align: center;
  }
}
</style>