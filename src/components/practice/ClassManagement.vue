<template>
  <div class="class-mgmt">
    <div class="iq-page-titlebar">
      <h1>班级管理</h1>
      <div class="iq-page-actions">
        <button class="iq-btn iq-btn-secondary" @click="openUnassignedDialog">
          👥 可添加学生 ({{ unassignedCount }})
        </button>
        <button class="iq-btn iq-btn-primary" @click="openCreateClass">+ 新建班级</button>
      </div>
    </div>

    <div class="class-mgmt-layout">
      <!-- 班级列表 -->
      <aside class="iq-card class-side">
        <div class="class-side-head">
          <b>班级列表</b>
          <span class="iq-text-sm iq-text-muted">共 {{ classList.length }} 个班</span>
        </div>
        <div v-if="classLoading" class="iq-table-loading" style="padding:40px 0;">
          <span class="iq-loading-spinner"></span>
          <span class="iq-text-sm iq-text-muted">加载中...</span>
        </div>
        <div v-else class="class-list">
          <button
            v-for="cls in classList"
            :key="cls.id"
            type="button"
            class="class-item"
            :class="{ active: selectedClassId === cls.id }"
            @click="selectClass(cls.id)"
          >
            <div class="class-item-main">
              <div class="class-item-name">{{ cls.name }}</div>
              <div class="class-item-meta">
                <span>👥 {{ cls.student_count ?? cls.students?.length ?? 0 }} 人</span>
                <span v-if="cls.grade">年级 {{ cls.grade }}</span>
              </div>
            </div>
            <div class="class-item-actions" @click.stop>
              <button class="iq-btn iq-btn-ghost iq-btn-sm act-edit" @click="openEditClass(cls)">编辑</button>
              <button
                class="iq-btn iq-btn-ghost iq-btn-sm act-del"
                @click="handleDeleteClass(cls)"
              >删除</button>
            </div>
          </button>
          <div v-if="classList.length === 0" class="iq-empty-box" style="padding:30px 0;">
            <div class="iq-empty-icon">🏫</div>
            <div class="iq-empty-text iq-text-sm iq-text-muted">还没有班级，点击右上角新建</div>
          </div>
        </div>
      </aside>

      <!-- 班内学生 -->
      <section class="iq-card class-main">
        <template v-if="!selectedClassId">
          <div class="iq-empty-box" style="padding:80px 0;">
            <div class="iq-empty-icon">👈</div>
            <div class="iq-empty-text iq-text-base" style="color:var(--iq-neutral-600);">请从左侧选择一个班级</div>
            <div class="iq-text-sm iq-text-muted">查看班内学生、添加学生、调班或移出</div>
          </div>
        </template>
        <template v-else>
          <div class="class-main-head">
            <div>
              <h2 class="iq-text-lg iq-font-semibold" style="margin:0;">{{ currentClass?.name }}</h2>
              <p class="iq-text-sm iq-text-muted" style="margin:4px 0 0;">
                <span v-if="currentClass?.grade">年级：{{ currentClass.grade }} · </span>
                班内学生：{{ studentList.length }} 人
                <span v-if="currentClass?.description"> · 备注：{{ currentClass.description }}</span>
              </p>
            </div>
            <div class="iq-page-actions">
              <button class="iq-btn iq-btn-secondary" @click="openAddStudents">+ 添加学生</button>
            </div>
          </div>

          <div v-if="studentLoading" class="iq-table-loading" style="padding:60px 0;">
            <span class="iq-loading-spinner"></span>
            <span class="iq-text-sm iq-text-muted">加载学生列表...</span>
          </div>
          <div v-else class="iq-table-wrap">
            <table class="iq-table">
              <thead>
                <tr>
                  <th style="width:56px;"><input type="checkbox" class="iq-checkbox" :checked="isAllSelected" :indeterminate.prop="isIndeterminate" @change="toggleAllStudents" /></th>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>专业</th>
                  <th>学号</th>
                  <th>入班时间</th>
                  <th style="width:260px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stu in studentList" :key="stu.id">
                  <td><input type="checkbox" class="iq-checkbox" :checked="selectedStudentIds.includes(stu.id)" @change="toggleStudent(stu.id)" /></td>
                  <td><span class="iq-id-chip">{{ stu.id }}</span></td>
                  <td>
                    <button class="stu-name-btn" @click="openStudentRecords(stu)" :title="`查看 ${stu.username} 的答题记录`">
                      {{ stu.username }}
                    </button>
                  </td>
                  <td class="ellipsis-cell" :title="stu.college || stu.school || ''">{{ stu.college || stu.school || '--' }}</td>
                  <td>{{ stu.student_no || '--' }}</td>
                  <td class="iq-text-sm iq-text-muted">{{ stu.joined_at || '--' }}</td>
                  <td>
                    <div class="iq-table-action">
                      <button class="iq-btn iq-btn-ghost iq-btn-sm act-view" @click="openStudentRecords(stu)">查看记录</button>
                      <button class="iq-btn iq-btn-ghost iq-btn-sm act-edit" @click="openTransfer(stu)">调班</button>
                      <button class="iq-btn iq-btn-ghost iq-btn-sm act-del" @click="handleRemove(stu)">移出班级</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="studentList.length === 0">
                  <td colspan="7" class="iq-empty-row">
                    <div class="iq-empty-box" style="padding:40px 0;">
                      <div class="iq-empty-icon">👥</div>
                      <div class="iq-empty-text iq-text-sm iq-text-muted">班级还没有学生</div>
                      <div class="iq-text-sm iq-text-muted">点击右上角「添加学生」</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="selectedStudentIds.length > 0" class="batch-bar">
            <span>已选 {{ selectedStudentIds.length }} 名学生</span>
            <button class="iq-btn iq-btn-secondary iq-btn-sm" @click="openBatchTransfer">批量调班</button>
            <button class="iq-btn iq-btn-danger iq-btn-sm" @click="handleBatchRemove">批量移出</button>
            <button class="iq-btn iq-btn-ghost iq-btn-sm" @click="selectedStudentIds = []">取消选择</button>
          </div>
        </template>
      </section>
    </div>

    <!-- 班级表单弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="classDialogVisible" class="iq-modal-overlay" @click.self="classDialogVisible = false">
          <div class="iq-modal iq-modal-md">
            <div class="iq-modal-header">
              <div class="iq-modal-title-wrap">
                <div class="iq-modal-icon" :style="{ background: isEditClass ? 'var(--iq-state-warning-bg)' : 'var(--iq-primary-50)', color: isEditClass ? 'var(--iq-state-warning)' : 'var(--iq-primary-600)' }">
                  <svg v-if="!isEditClass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="iq-modal-title">{{ isEditClass ? '编辑班级' : '新建班级' }}</h3>
                  <p class="iq-modal-subtitle">{{ isEditClass ? '修改班级信息' : '填写班级基本信息' }}</p>
                </div>
              </div>
              <button class="iq-modal-close" @click="classDialogVisible = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form class="iq-modal-body" @submit.prevent="handleSubmitClass">
              <div class="iq-form-field">
                <label class="iq-form-label">班级名称 <span class="iq-req">*</span></label>
                <input v-model="classForm.name" class="iq-input" placeholder="如：计算机2401班" />
              </div>
              <div class="iq-form-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="iq-form-field">
                  <label class="iq-form-label">年级</label>
                  <input v-model="classForm.grade" class="iq-input" placeholder="如：大一 / 2024" />
                </div>
                <div class="iq-form-field">
                  <label class="iq-form-label">班主任</label>
                  <input v-model="classForm.head_teacher" class="iq-input" placeholder="班主任姓名" />
                </div>
              </div>
              <div class="iq-form-field">
                <label class="iq-form-label">备注</label>
                <textarea v-model="classForm.description" rows="3" class="iq-textarea" placeholder="选填，班级描述信息"></textarea>
              </div>
              <div class="iq-modal-footer">
                <button type="button" class="iq-btn iq-btn-secondary" @click="classDialogVisible = false">取消</button>
                <button type="submit" class="iq-btn iq-btn-primary" :disabled="classSubmitting.value">
                  <span v-if="classSubmitting.value" class="iq-btn-spinner"></span>
                  {{ classSubmitting.value ? '提交中...' : (isEditClass ? '确认修改' : '确认创建') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 添加学生弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="addDialogVisible" class="iq-modal-overlay" @click.self="addDialogVisible = false">
          <div class="iq-modal iq-modal-lg">
            <div class="iq-modal-header">
              <div class="iq-modal-title-wrap">
                <div class="iq-modal-icon" style="background:var(--iq-primary-50);color:var(--iq-primary-600);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="iq-modal-title">添加学生到班级</h3>
                  <p class="iq-modal-subtitle">
                    {{ selectedClassId ? '将选中的学生加入「' + (currentClass?.name || '') + '」' : '查看当前可添加的学生' }}
                    · 学生可同时属于多个班级，加入本班不影响其已加入的其他班级
                  </p>
                </div>
              </div>
              <button class="iq-modal-close" @click="addDialogVisible = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="iq-modal-body">
              <div class="iq-filter-card" style="margin-bottom:14px;">
                <div class="iq-filter-field" style="max-width:360px;">
                  <label class="iq-filter-label">搜索</label>
                  <input v-model="unassignedKeyword" class="iq-input" placeholder="搜索用户名 / 昵称 / 学号" @keyup.enter="loadUnassigned" />
                </div>
              </div>
              <div v-if="unassignedLoading" class="iq-table-loading">
                <span class="iq-loading-spinner"></span>
                <span class="iq-text-sm iq-text-muted">加载中...</span>
              </div>
              <div v-else class="iq-table-wrap" style="max-height:420px;overflow:auto;">
                <table class="iq-table">
                  <thead>
                    <tr>
                      <th style="width:50px;"><input type="checkbox" class="iq-checkbox" :checked="isAllUnassignedSelected" :indeterminate.prop="isUnassignedIndeterminate" @change="toggleAllUnassigned" /></th>
                      <th>ID</th>
                      <th>用户名</th>
                      <th>专业</th>
                      <th>学号</th>
                      <th>注册时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="stu in unassignedList" :key="stu.id">
                      <td><input type="checkbox" class="iq-checkbox" :value="stu.id" v-model="unassignedSelectedIds" /></td>
                      <td><span class="iq-id-chip">{{ stu.id }}</span></td>
                      <td class="iq-font-medium" style="color:var(--iq-neutral-800);">{{ stu.username }}</td>
                      <td class="ellipsis-cell" :title="stu.college || stu.school || ''">{{ stu.college || stu.school || '--' }}</td>
                      <td>{{ stu.student_no || '--' }}</td>
                      <td class="iq-text-sm iq-text-muted">{{ stu.created_at || '--' }}</td>
                    </tr>
                    <tr v-if="unassignedList.length === 0">
                      <td colspan="6" class="iq-empty-row">
                        <div class="iq-empty-box" style="padding:40px 0;">
                          <div class="iq-empty-icon">✅</div>
                          <div class="iq-empty-text iq-text-sm iq-text-muted">没有可添加的学生</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="iq-modal-footer">
                <button class="iq-btn iq-btn-secondary" @click="addDialogVisible = false">关闭</button>
                <button
                  v-if="selectedClassId"
                  class="iq-btn iq-btn-primary"
                  :disabled="unassignedSelectedIds.length === 0 || addSubmitting"
                  @click="handleBatchAddToClass"
                >
                  <span v-if="addSubmitting" class="iq-btn-spinner"></span>
                  {{ addSubmitting ? '添加中...' : `确认加入 (${unassignedSelectedIds.length})` }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 调班弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="transferDialogVisible" class="iq-modal-overlay" @click.self="transferDialogVisible = false">
          <div class="iq-modal iq-modal-sm">
            <div class="iq-modal-header">
              <div class="iq-modal-title-wrap">
                <div class="iq-modal-icon" style="background:var(--iq-state-info-bg);color:var(--iq-state-info);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="iq-modal-title">学生调班</h3>
                  <p class="iq-modal-subtitle">将 {{ transferStudents.length }} 名学生调到目标班级</p>
                </div>
              </div>
              <button class="iq-modal-close" @click="transferDialogVisible = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="iq-modal-body">
              <div class="iq-form-field">
                <label class="iq-form-label">学生</label>
                <div class="transfer-students">
                  <span v-for="s in transferStudents" :key="s.id" class="iq-user-subject-tag" style="margin-right:4px;margin-bottom:4px;">
                    {{ s.nickname || s.username }}
                  </span>
                </div>
              </div>
              <div class="iq-form-field">
                <label class="iq-form-label">目标班级 <span class="iq-req">*</span></label>
                <select v-model="transferToClassId" class="iq-select">
                  <option value="">请选择目标班级</option>
                  <option
                    v-for="cls in classList.filter(c => c.id !== selectedClassId)"
                    :key="cls.id"
                    :value="cls.id"
                  >{{ cls.name }}</option>
                </select>
              </div>
              <div class="iq-modal-footer">
                <button class="iq-btn iq-btn-secondary" @click="transferDialogVisible = false">取消</button>
                <button class="iq-btn iq-btn-primary" :disabled="!transferToClassId || transferSubmitting" @click="handleConfirmTransfer">
                  <span v-if="transferSubmitting" class="iq-btn-spinner"></span>
                  {{ transferSubmitting ? '调班中...' : '确认调班' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 学生答题记录弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="recordsDialogVisible" class="iq-modal-overlay" @click.self="closeRecordsDialog">
          <div class="iq-modal iq-modal-lg student-records-modal">
            <div class="iq-modal-header">
              <div class="iq-modal-title-wrap">
                <div class="iq-modal-icon" style="background:var(--iq-primary-50);color:var(--iq-primary-600);">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
                <div>
                  <h3 class="iq-modal-title">📊 答题记录</h3>
                  <p class="iq-modal-subtitle">
                    {{ recordsStudent?.username }}
                    <span v-if="recordsStudent?.student_no"> · 学号 {{ recordsStudent.student_no }}</span>
                    <span v-if="recordsStudent?.college || recordsStudent?.school"> · {{ recordsStudent.college || recordsStudent.school }}</span>
                  </p>
                </div>
              </div>
              <button class="iq-modal-close" @click="closeRecordsDialog">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="iq-modal-body">
              <!-- 汇总统计 -->
              <div v-if="!recordsLoading && studentRecords.length > 0" class="stu-stats-grid">
                <div class="stu-stat-card">
                  <div class="stu-stat-label">练习次数</div>
                  <div class="stu-stat-value">{{ studentSummary.total }}</div>
                </div>
                <div class="stu-stat-card">
                  <div class="stu-stat-label">平均得分</div>
                  <div class="stu-stat-value" :class="studentSummary.avgScore >= 80 ? 'text-good' : studentSummary.avgScore >= 60 ? 'text-mid' : 'text-bad'">{{ studentSummary.avgScore }}</div>
                </div>
                <div class="stu-stat-card">
                  <div class="stu-stat-label">平均正确率</div>
                  <div class="stu-stat-value" :class="studentSummary.avgAccuracy >= 80 ? 'text-good' : studentSummary.avgAccuracy >= 60 ? 'text-mid' : 'text-bad'">{{ studentSummary.avgAccuracy }}%</div>
                </div>
                <div class="stu-stat-card">
                  <div class="stu-stat-label">累计对/错</div>
                  <div class="stu-stat-value stu-stat-duo">
                    <span class="text-good">{{ studentSummary.totalCorrect }}</span>
                    <span class="stu-stat-sep">/</span>
                    <span class="text-bad">{{ studentSummary.totalWrong }}</span>
                  </div>
                </div>
              </div>

              <div v-if="recordsLoading" class="iq-table-loading">
                <span class="iq-loading-spinner"></span>
                <span class="iq-text-sm iq-text-muted">加载答题记录...</span>
              </div>

              <div v-else-if="studentRecords.length === 0" class="iq-empty-box" style="padding:50px 0;">
                <div class="iq-empty-icon">📭</div>
                <div class="iq-empty-text iq-text-sm iq-text-muted">该学生暂无答题记录</div>
              </div>

              <div v-else class="stu-records-wrap">
                <table class="iq-table stu-records-table">
                  <thead>
                    <tr>
                      <th>试卷</th>
                      <th style="width:70px;">得分</th>
                      <th style="width:80px;">正确率</th>
                      <th style="width:120px;">对/错/未答</th>
                      <th style="width:80px;">用时</th>
                      <th style="width:130px;">提交时间</th>
                      <th style="width:80px;">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="r in studentRecords" :key="r.id">
                      <tr :class="{ 'stu-row-active': activeRecord && activeRecord.id === r.id }" @click="viewRecordDetail(r)" class="stu-record-row">
                        <td class="stu-exam-cell" :title="r.exam_title || r.examTitle || ('试卷#' + r.exam_id)">
                          <span class="stu-exam-name">{{ r.exam_title || r.examTitle || ('试卷#' + r.exam_id) }}</span>
                          <span v-if="r.subject" class="iq-subject-tag">{{ r.subject }}</span>
                        </td>
                        <td><span class="stu-score" :class="scoreTagClass(r.score)">{{ r.score }}</span></td>
                        <td>
                          <span class="iq-font-semibold" :class="r.accuracy >= 80 ? 'text-good' : r.accuracy >= 60 ? 'text-mid' : 'text-bad'">{{ r.accuracy }}%</span>
                        </td>
                        <td class="iq-text-sm">
                          <span class="text-good">{{ r.correct_count }}</span> /
                          <span class="text-bad">{{ r.wrong_count }}</span> /
                          <span class="iq-text-muted">{{ r.skipped_count }}</span>
                        </td>
                        <td class="iq-text-sm">{{ formatDuration(r.duration_seconds) }}</td>
                        <td class="iq-text-sm iq-text-muted">{{ formatTime(r.submitted_at) }}</td>
                        <td @click.stop>
                          <button
                            class="iq-btn iq-btn-ghost iq-btn-sm"
                            @click="viewRecordDetail(r)"
                          >{{ activeRecord && activeRecord.id === r.id ? '收起' : '详情' }}</button>
                        </td>
                      </tr>
                      <!-- 题目维度下钻 -->
                      <tr v-if="activeRecord && activeRecord.id === r.id" class="stu-detail-row">
                        <td colspan="7">
                          <div v-if="recordDetailLoading" class="iq-table-loading" style="padding:24px 0;">
                            <span class="iq-loading-spinner"></span>
                            <span class="iq-text-sm iq-text-muted">加载题目详情...</span>
                          </div>
                          <div v-else-if="recordDetail && (recordDetail.answers || recordDetail.questions || recordDetail.details) && detailList.length" class="stu-detail-wrap">
                            <div class="stu-detail-title">
                              <b>📝 逐题作答详情</b>
                              <span class="iq-text-sm iq-text-muted">共 {{ detailList.length }} 题</span>
                            </div>
                            <table class="iq-table stu-detail-table">
                              <thead>
                                <tr>
                                  <th style="width:36px;">#</th>
                                  <th>题目</th>
                                  <th style="width:70px;">题型</th>
                                  <th style="width:80px;">结果</th>
                                  <th>学生作答</th>
                                  <th>正确答案</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="(q, idx) in detailList" :key="idx">
                                  <td><span class="iq-id-chip">{{ idx + 1 }}</span></td>
                                  <td class="stu-q-cell" :title="getQField(q, ['题目','title','question','question_title'])">{{ getQField(q, ['题目','title','question','question_title']) || '--' }}</td>
                                  <td><span class="stu-type-tag">{{ getTypeName(Number(getQField(q, ['题型','type','question_type','questionType']) || 0)) }}</span></td>
                                  <td>
                                    <span v-if="questionResult(q) === 'correct'" class="stu-result stu-result-correct">✓ 正确</span>
                                    <span v-else-if="questionResult(q) === 'wrong'" class="stu-result stu-result-wrong">✗ 错误</span>
                                    <span v-else-if="questionResult(q) === 'subjective'" class="stu-result stu-result-skip">📝 待阅</span>
                                    <span v-else class="stu-result stu-result-skip">— 未答</span>
                                  </td>
                                  <td class="stu-ans-cell" :title="formatAnswer(getQField(q, ['学生作答','userAnswer','user_answer','user_ans','stu_answer']))">{{ formatAnswer(getQField(q, ['学生作答','userAnswer','user_answer','user_ans','stu_answer'])) }}</td>
                                  <td class="stu-ans-cell stu-correct-ans" :title="formatAnswer(getQField(q, ['答案','answer','correctAnswer','correct_answer','right_answer']))">{{ formatAnswer(getQField(q, ['答案','answer','correctAnswer','correct_answer','right_answer'])) }}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div v-else class="iq-empty-box" style="padding:24px 0;">
                            <div class="iq-empty-text iq-text-sm iq-text-muted">暂无题目明细数据</div>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>

              <div class="iq-modal-footer">
                <button class="iq-btn iq-btn-secondary" @click="closeRecordsDialog">关闭</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  addStudentsToClass,
  transferStudent,
  removeStudentFromClass,
  getUnassignedStudents,
} from '@/api/class';
import { adminListUserRecords, adminGetRecord } from '@/api/practice';
import { formatTime, formatDuration } from '@/utils/format';
import { getTypeName } from '@/utils/constants';

const emit = defineEmits(['toast']);
const showToast = (message, type = 'success') => emit('toast', { message, type });

// ===== 班级列表 =====
const classList = ref([]);
const classLoading = ref(false);
const selectedClassId = ref(null);
const currentClass = ref(null);

const loadClasses = async () => {
  classLoading.value = true;
  try {
    const data = await getClasses();
    classList.value = Array.isArray(data) ? data : (data.list || []);
  } catch (err) {
    showToast(err.message || '加载班级列表失败', 'error');
  } finally {
    classLoading.value = false;
  }
};

const selectClass = async (id) => {
  selectedClassId.value = id;
  selectedStudentIds.value = [];
  await loadStudents(id);
};

// ===== 班内学生 =====
const studentList = ref([]);
const studentLoading = ref(false);
const selectedStudentIds = ref([]);

const loadStudents = async (id) => {
  studentLoading.value = true;
  try {
    const data = await getClassById(id);
    currentClass.value = data;
    studentList.value = Array.isArray(data.students) ? data.students : [];
  } catch (err) {
    showToast(err.message || '加载班内学生失败', 'error');
  } finally {
    studentLoading.value = false;
  }
};

const isAllSelected = computed(() =>
  studentList.value.length > 0 && studentList.value.every(s => selectedStudentIds.value.includes(s.id))
);
const isIndeterminate = computed(() => {
  const c = studentList.value.filter(s => selectedStudentIds.value.includes(s.id)).length;
  return c > 0 && c < studentList.value.length;
});
const toggleStudent = (id) => {
  const idx = selectedStudentIds.value.indexOf(id);
  if (idx >= 0) selectedStudentIds.value.splice(idx, 1);
  else selectedStudentIds.value.push(id);
};
const toggleAllStudents = (e) => {
  selectedStudentIds.value = e.target.checked
    ? studentList.value.map(s => s.id)
    : [];
};

// ===== 未分班学生 =====
const unassignedList = ref([]);
const unassignedLoading = ref(false);
const unassignedCount = ref(0);
const unassignedKeyword = ref('');
const unassignedSelectedIds = ref([]);
const addDialogVisible = ref(false);
const addSubmitting = ref(false);

const loadUnassigned = async () => {
  unassignedLoading.value = true;
  try {
    const params = {};
    if (unassignedKeyword.value) params.keyword = unassignedKeyword.value;
    const data = await getUnassignedStudents(params);
    unassignedList.value = Array.isArray(data) ? data : (data.list || []);
    unassignedCount.value = Array.isArray(data) ? data.length : (data.total ?? unassignedList.value.length);
  } catch (err) {
    showToast(err.message || '加载未分班学生失败', 'error');
  } finally {
    unassignedLoading.value = false;
  }
};

const loadUnassignedCount = async () => {
  try {
    const data = await getUnassignedStudents({ pageSize: 1 });
    unassignedCount.value = data.total ?? (Array.isArray(data) ? data.length : 0);
  } catch { /* ignore */ }
};

const isAllUnassignedSelected = computed(() =>
  unassignedList.value.length > 0 && unassignedList.value.every(s => unassignedSelectedIds.value.includes(s.id))
);
const isUnassignedIndeterminate = computed(() => {
  const c = unassignedList.value.filter(s => unassignedSelectedIds.value.includes(s.id)).length;
  return c > 0 && c < unassignedList.value.length;
});
const toggleAllUnassigned = (e) => {
  unassignedSelectedIds.value = e.target.checked
    ? unassignedList.value.map(s => s.id)
    : [];
};

const openUnassignedDialog = () => {
  unassignedKeyword.value = '';
  unassignedSelectedIds.value = [];
  addDialogVisible.value = true;
  loadUnassigned();
};

const openAddStudents = () => {
  if (!selectedClassId.value) return;
  unassignedKeyword.value = '';
  unassignedSelectedIds.value = [];
  addDialogVisible.value = true;
  loadUnassigned();
};

const handleBatchAddToClass = async () => {
  if (!selectedClassId.value || unassignedSelectedIds.value.length === 0) return;
  addSubmitting.value = true;
  try {
    await addStudentsToClass(selectedClassId.value, unassignedSelectedIds.value);
    showToast(`成功添加 ${unassignedSelectedIds.value.length} 名学生到「${currentClass.value?.name}」`, 'success');
    addDialogVisible.value = false;
    await Promise.all([loadStudents(selectedClassId.value), loadUnassignedCount(), loadClasses()]);
  } catch (err) {
    showToast(err.message || '添加失败', 'error');
  } finally {
    addSubmitting.value = false;
  }
};

// ===== 调班 =====
const transferDialogVisible = ref(false);
const transferStudents = ref([]);
const transferToClassId = ref('');
const transferSubmitting = ref(false);

const openTransfer = (stu) => {
  transferStudents.value = [stu];
  transferToClassId.value = '';
  transferDialogVisible.value = true;
};
const openBatchTransfer = () => {
  if (selectedStudentIds.value.length === 0) return;
  transferStudents.value = studentList.value.filter(s => selectedStudentIds.value.includes(s.id));
  transferToClassId.value = '';
  transferDialogVisible.value = true;
};
const handleConfirmTransfer = async () => {
  if (!transferToClassId.value || transferStudents.value.length === 0) return;
  transferSubmitting.value = true;
  try {
    for (const stu of transferStudents.value) {
      await transferStudent(selectedClassId.value, transferToClassId.value, stu.id);
    }
    showToast(`调班成功，共 ${transferStudents.value.length} 名学生`, 'success');
    transferDialogVisible.value = false;
    selectedStudentIds.value = [];
    await Promise.all([loadStudents(selectedClassId.value), loadClasses()]);
  } catch (err) {
    showToast(err.message || '调班失败', 'error');
  } finally {
    transferSubmitting.value = false;
  }
};

// ===== 移出班级 =====
const handleRemove = async (stu) => {
  if (!window.confirm(`确定将「${stu.nickname || stu.username}」移出班级吗？移出后变为未分班状态。`)) return;
  try {
    await removeStudentFromClass(selectedClassId.value, stu.id);
    showToast('已移出班级', 'success');
    await Promise.all([loadStudents(selectedClassId.value), loadUnassignedCount(), loadClasses()]);
  } catch (err) {
    showToast(err.message || '移出失败', 'error');
  }
};
const handleBatchRemove = async () => {
  if (selectedStudentIds.value.length === 0) return;
  if (!window.confirm(`确定将选中的 ${selectedStudentIds.value.length} 名学生移出班级吗？`)) return;
  try {
    for (const id of selectedStudentIds.value) {
      await removeStudentFromClass(selectedClassId.value, id);
    }
    showToast(`已批量移出 ${selectedStudentIds.value.length} 名学生`, 'success');
    selectedStudentIds.value = [];
    await Promise.all([loadStudents(selectedClassId.value), loadUnassignedCount(), loadClasses()]);
  } catch (err) {
    showToast(err.message || '批量移出失败', 'error');
  }
};

// ===== 学生答题记录 =====
const recordsDialogVisible = ref(false);
const recordsStudent = ref(null);
const studentRecords = ref([]);
const recordsLoading = ref(false);
const activeRecord = ref(null);
const recordDetailLoading = ref(false);
const recordDetail = ref(null);

const studentSummary = computed(() => {
  const list = studentRecords.value;
  if (list.length === 0) return { total: 0, avgScore: 0, avgAccuracy: 0, totalCorrect: 0, totalWrong: 0 };
  const scores = list.map(r => Number(r.score) || 0);
  const accs = list.map(r => Number(r.accuracy) || 0);
  const correct = list.reduce((a, r) => a + (Number(r.correct_count) || 0), 0);
  const wrong = list.reduce((a, r) => a + (Number(r.wrong_count) || 0), 0);
  return {
    total: list.length,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    avgAccuracy: Math.round(accs.reduce((a, b) => a + b, 0) / accs.length),
    totalCorrect: correct,
    totalWrong: wrong,
  };
});

const openStudentRecords = async (stu) => {
  recordsStudent.value = stu;
  recordsDialogVisible.value = true;
  activeRecord.value = null;
  recordDetail.value = null;
  studentRecords.value = [];
  recordsLoading.value = true;
  try {
    const data = await adminListUserRecords(stu.id, { pageSize: 100 });
    // 兼容：后端可能直接返回数组或 {list,total}
    if (Array.isArray(data)) {
      studentRecords.value = data;
    } else {
      studentRecords.value = data?.list || [];
    }
  } catch (err) {
    showToast(err.message || '加载答题记录失败', 'error');
  } finally {
    recordsLoading.value = false;
  }
};

const viewRecordDetail = async (record) => {
  if (activeRecord.value && activeRecord.value.id === record.id) {
    activeRecord.value = null;
    recordDetail.value = null;
    return;
  }
  activeRecord.value = record;
  recordDetail.value = null;
  recordDetailLoading.value = true;
  try {
    const data = await adminGetRecord(record.id);
    // 兼容：后端可能把详情放在 data/record 字段下
    recordDetail.value = data?.data || data?.record || data;
  } catch (err) {
    showToast(err.message || '加载记录详情失败', 'error');
  } finally {
    recordDetailLoading.value = false;
  }
};

const closeRecordsDialog = () => {
  recordsDialogVisible.value = false;
  recordsStudent.value = null;
  studentRecords.value = [];
  activeRecord.value = null;
  recordDetail.value = null;
};

const scoreTagClass = (score) => {
  if (score >= 80) return 'stu-score-excellent';
  if (score >= 60) return 'stu-score-pass';
  return 'stu-score-fail';
};

const formatAnswer = (ans) => {
  if (ans === null || ans === undefined || ans === '') return '—';
  if (typeof ans === 'object') {
    try { return JSON.stringify(ans); } catch { return String(ans); }
  }
  return String(ans);
};

// 从题目对象中按字段优先级查找（兼容多种接口字段）
const getQField = (q, fields) => {
  if (!q) return '';
  for (const f of fields) {
    if (q[f] !== null && q[f] !== undefined && q[f] !== '') return q[f];
  }
  return '';
};

// 判断 is_correct 兼容 boolean / number 1,0,3
const questionResult = (q) => {
  if (!q) return 'skip';
  const v = getQField(q, ['is_correct', 'isCorrect', 'correct', 'status']);
  // 数字: 1=正确, 0=错误, 3=主观题/待批阅
  if (typeof v === 'number') {
    if (v === 1) return 'correct';
    if (v === 0) return 'wrong';
    if (v === 3) return 'subjective';
  }
  if (typeof v === 'boolean') return v ? 'correct' : 'wrong';
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (['true','1','correct','right','yes','ok','对','正确'].includes(s)) return 'correct';
    if (['false','0','wrong','no','error','错','错误'].includes(s)) return 'wrong';
  }
  // 判断是否未作答
  const skipped = getQField(q, ['is_skipped', 'isSkipped', 'skipped']);
  if (skipped === true || skipped === 1 || skipped === 'true') return 'skip';
  return 'skip';
};

// 统一提取答题详情列表（兼容 answers / questions / details）
const detailList = computed(() => {
  if (!recordDetail.value) return [];
  const list = recordDetail.value.answers || recordDetail.value.questions || recordDetail.value.details || [];
  return Array.isArray(list) ? list : [];
});

// ===== 班级 CRUD =====
const classDialogVisible = ref(false);
const isEditClass = ref(false);
const classSubmitting = reactive({ value: false });
const classForm = reactive({ id: null, name: '', grade: '', head_teacher: '', description: '' });

const openCreateClass = () => {
  isEditClass.value = false;
  Object.assign(classForm, { id: null, name: '', grade: '', head_teacher: '', description: '' });
  classDialogVisible.value = true;
};
const openEditClass = (cls) => {
  isEditClass.value = true;
  Object.assign(classForm, {
    id: cls.id,
    name: cls.name || '',
    grade: cls.grade || '',
    head_teacher: cls.head_teacher || '',
    description: cls.description || '',
  });
  classDialogVisible.value = true;
};
const handleDeleteClass = async (cls) => {
  if (!window.confirm(`确定删除班级「${cls.name}」吗？班内学生将变为未分班状态。`)) return;
  try {
    await deleteClass(cls.id);
    showToast('班级已删除', 'success');
    if (selectedClassId.value === cls.id) {
      selectedClassId.value = null;
      currentClass.value = null;
      studentList.value = [];
    }
    await Promise.all([loadClasses(), loadUnassignedCount()]);
  } catch (err) {
    showToast(err.message || '删除失败', 'error');
  }
};
const handleSubmitClass = async () => {
  if (!classForm.name.trim()) { alert('班级名称不能为空'); return; }
  classSubmitting.value = true;
  try {
    if (isEditClass.value) {
      await updateClass(classForm.id, {
        name: classForm.name,
        grade: classForm.grade,
        head_teacher: classForm.head_teacher,
        description: classForm.description,
      });
      showToast('班级修改成功', 'success');
    } else {
      await createClass({
        name: classForm.name,
        grade: classForm.grade,
        head_teacher: classForm.head_teacher,
        description: classForm.description,
      });
      showToast('班级创建成功', 'success');
    }
    classDialogVisible.value = false;
    await loadClasses();
  } catch (err) {
    showToast(err.message || '操作失败', 'error');
  } finally {
    classSubmitting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadClasses(), loadUnassignedCount()]);
});
</script>

<style scoped>
.class-mgmt { display: flex; flex-direction: column; gap: 16px; }
.class-mgmt-layout { display: grid; grid-template-columns: 320px 1fr; gap: 16px; align-items: start; }
.class-side { padding: 18px 16px; }
.class-side-head { display: flex; justify-content: space-between; align-items: center; padding: 4px 6px 12px; border-bottom: 1px dashed var(--iq-border); margin-bottom: 10px; }
.class-list { display: flex; flex-direction: column; gap: 6px; max-height: 72vh; overflow: auto; }
.class-item {
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
  padding: 12px; border: 1px solid var(--iq-border); border-radius: 10px;
  background: var(--iq-neutral-0); cursor: pointer; transition: all 0.15s; text-align: left;
}
.class-item:hover { border-color: var(--iq-primary-300); background: var(--iq-primary-50); }
.class-item.active { border-color: var(--iq-primary); background: var(--iq-primary-50); box-shadow: 0 0 0 2px rgba(79,70,229,.08); }
.class-item-main { flex: 1; min-width: 0; }
.class-item-name { font-weight: 600; color: var(--iq-neutral-800); font-size: 14px; }
.class-item-meta { display: flex; gap: 10px; margin-top: 3px; font-size: 12px; color: var(--iq-neutral-500); }
.class-item-actions { display: none; gap: 4px; }
.class-item:hover .class-item-actions { display: flex; }

.class-main { padding: 20px 22px; }
.class-main-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px dashed var(--iq-border); }

.batch-bar {
  display: flex; align-items: center; gap: 10px; margin-top: 12px;
  padding: 10px 14px; background: var(--iq-primary-50); border-radius: 8px;
  border: 1px solid var(--iq-primary-200); color: var(--iq-primary-700); font-size: 13px; font-weight: 500;
}
.batch-bar .iq-btn { margin-left: 6px; }

.transfer-students { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 0; }

.iq-filter-card { padding: 14px 16px; background: var(--iq-neutral-50); border: 1px solid var(--iq-border); border-radius: var(--iq-radius-medium); }
.iq-filter-field { display: flex; flex-direction: column; gap: 6px; }
.iq-filter-label { font-size: 12px; font-weight: 500; color: var(--iq-neutral-600); }

.iq-table-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px 0;
}
.iq-loading-spinner {
  width: 28px; height: 28px; border: 3px solid var(--iq-neutral-200);
  border-top-color: var(--iq-primary); border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.iq-id-chip {
  display: inline-block; font-family: var(--iq-font-mono); font-size: 12px;
  padding: 2px 8px; background: var(--iq-neutral-100); color: var(--iq-neutral-700);
  border-radius: 4px; font-weight: 500;
}
.iq-empty-row { padding: 0 !important; }
.iq-empty-box {
  display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 0;
}
.iq-empty-icon { font-size: 40px; opacity: 0.5; }

/* ===== 弹窗通用样式（与项目其他弹窗一致）===== */
.iq-modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15, 23, 42, 0.55); display: grid; place-items: center; padding: 30px; }
.iq-modal {
  background: var(--iq-neutral-0); border-radius: var(--iq-radius-large); box-shadow: var(--iq-shadow-float);
  width: 100%; max-width: 100%; overflow: hidden;
}
.iq-modal-md { max-width: 520px; }
.iq-modal-lg { max-width: 820px; }
.iq-modal-sm { max-width: 440px; }
.iq-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--iq-border); }
.iq-modal-title-wrap { display: flex; align-items: center; gap: 12px; }
.iq-modal-icon {
  width: 40px; height: 40px; border-radius: var(--iq-radius-medium);
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.iq-modal-icon svg { width: 20px; height: 20px; }
.iq-modal-title { font-size: 16px; font-weight: 600; color: var(--iq-neutral-900); margin: 0; }
.iq-modal-subtitle { font-size: 12px; color: var(--iq-muted-foreground); margin: 2px 0 0; }
.iq-modal-close {
  width: 32px; height: 32px; border: none; background: transparent; color: var(--iq-neutral-400);
  cursor: pointer; border-radius: var(--iq-radius-medium);
  display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.iq-modal-close:hover { background: var(--iq-neutral-100); color: var(--iq-neutral-700); }
.iq-modal-close svg { width: 18px; height: 18px; }
.iq-modal-body { padding: 24px; }
.iq-form-grid { display: grid; gap: 16px; margin-bottom: 16px; }
.iq-form-grid .iq-form-field { margin-bottom: 0; }
.iq-form-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.iq-form-label { font-size: 13px; font-weight: 500; color: var(--iq-neutral-700); }
.iq-req { color: var(--iq-state-error); margin-left: 2px; }
.iq-modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; }
.iq-btn-spinner {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite;
  margin-right: 6px; flex-shrink: 0; display: inline-block; vertical-align: middle;
}

.iq-checkbox {
  width: 16px; height: 16px; accent-color: var(--iq-primary); cursor: pointer;
}

.iq-table-wrap { overflow-x: auto; }
.iq-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.iq-table th, .iq-table td {
  padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--iq-border);
  color: var(--iq-neutral-700); vertical-align: middle;
}
.iq-table th {
  background: var(--iq-neutral-50); color: var(--iq-neutral-700); font-weight: 600; font-size: 12px;
}
.iq-table tbody tr:hover { background: var(--iq-neutral-50); }

.ellipsis-cell {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iq-table-action { display: flex; gap: 4px; flex-wrap: wrap; }
.act-edit { color: var(--iq-state-warning) !important; }
.act-edit:hover:not(:disabled) { background: var(--iq-state-warning-bg) !important; color: #b45309 !important; }
.act-del { color: var(--iq-state-error) !important; }
.act-del:hover:not(:disabled) { background: var(--iq-state-error-bg) !important; color: #b91c1c !important; }

.iq-user-subject-tag {
  display: inline-block; font-size: 11px; padding: 1px 6px;
  background: #e0e7ff; color: #4338ca; border-radius: 4px; font-weight: 500;
}

/* ===== 学生姓名按钮 ===== */
.stu-name-btn {
  background: none; border: none; padding: 0; cursor: pointer;
  font-weight: 500; color: var(--iq-neutral-800); font-size: 13px;
  text-decoration: none; transition: color 0.15s;
}
.stu-name-btn:hover { color: var(--iq-primary); text-decoration: underline; }

.act-view { color: var(--iq-primary) !important; }
.act-view:hover:not(:disabled) { background: var(--iq-primary-50) !important; color: var(--iq-primary-600) !important; }

.text-good { color: #059669; }
.text-mid { color: #d97706; }
.text-bad { color: #dc2626; }

/* ===== 学生答题记录弹窗 ===== */
.student-records-modal {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.student-records-modal .iq-modal-header { flex-shrink: 0; }
.student-records-modal .iq-modal-body {
  padding: 20px 24px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.stu-stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  margin-bottom: 18px;
}
.stu-stat-card {
  padding: 14px; text-align: center;
  background: var(--iq-neutral-50); border: 1px solid var(--iq-border);
  border-radius: var(--iq-radius-medium);
}
.stu-stat-label { font-size: 12px; color: var(--iq-neutral-500); margin-bottom: 6px; }
.stu-stat-value { font-size: 24px; font-weight: 700; color: var(--iq-neutral-900); }
.stu-stat-duo { font-size: 20px; display: flex; align-items: center; justify-content: center; gap: 4px; }
.stu-stat-sep { color: var(--iq-neutral-300); font-weight: 400; }

.stu-records-wrap { border: 1px solid var(--iq-border); border-radius: var(--iq-radius-medium); overflow: hidden; }
.stu-records-table { font-size: 12px; }
.stu-records-table th, .stu-records-table td { padding: 8px 10px; }
.stu-record-row { cursor: pointer; transition: background 0.15s; }
.stu-record-row:hover { background: var(--iq-neutral-50); }
.stu-row-active { background: var(--iq-primary-50) !important; }

.stu-exam-cell { display: flex; align-items: center; gap: 6px; }
.stu-exam-name {
  font-weight: 500; color: var(--iq-neutral-800);
  max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.iq-subject-tag {
  display: inline-block; font-size: 10px; padding: 1px 6px;
  background: #e0e7ff; color: #4338ca; border-radius: 4px; font-weight: 500; flex-shrink: 0;
}

.stu-score {
  display: inline-block; padding: 2px 10px; border-radius: var(--iq-radius-full);
  font-weight: 700; font-size: 12px; min-width: 36px; text-align: center;
}
.stu-score-excellent { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.stu-score-pass { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.stu-score-fail { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.stu-detail-row { background: var(--iq-neutral-50); }
.stu-detail-row > td { padding: 14px 16px; }
.stu-detail-wrap {
  background: var(--iq-neutral-0); border: 1px solid var(--iq-border);
  border-radius: var(--iq-radius-medium); overflow: hidden;
}
.stu-detail-title {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  border-bottom: 1px solid var(--iq-border); background: var(--iq-neutral-50);
}
.stu-detail-title b { font-size: 13px; color: var(--iq-neutral-800); }
.stu-detail-table { font-size: 12px; }
.stu-detail-table th, .stu-detail-table td { padding: 7px 10px; }

.stu-q-cell {
  max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--iq-neutral-700);
}
.stu-type-tag {
  display: inline-block; padding: 1px 8px; border-radius: var(--iq-radius-full);
  font-size: 11px; font-weight: 500; background: #ede9fe; color: #6d28d9;
}
.stu-result { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
.stu-result-correct { color: #059669; background: #ecfdf5; }
.stu-result-wrong { color: #dc2626; background: #fef2f2; }
.stu-result-skip { color: var(--iq-neutral-500); background: var(--iq-neutral-100); }
.stu-result-unknown { color: var(--iq-neutral-400); }

.stu-ans-cell {
  max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--iq-neutral-600); font-size: 12px;
}
.stu-correct-ans { color: #059669; font-weight: 500; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-active .iq-modal, .modal-fade-leave-active .iq-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .iq-modal, .modal-fade-leave-to .iq-modal {
  opacity: 0; transform: translateY(8px) scale(0.98);
}

@media (max-width: 900px) {
  .class-mgmt-layout { grid-template-columns: 1fr; }
  .stu-stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
