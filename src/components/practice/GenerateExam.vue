<template>
  <div class="exam-builder">
    <div class="iq-page-header"><div><h2>智能组卷</h2><p>按照章节、六种题型、五级难度和知识点要求生成结构合理的试卷</p></div></div>

    <section class="iq-card section-card">
      <div class="section-title"><b>1. 基本设置</b><span v-if="inventory">当前范围可用 {{ inventory.total }} 题 · {{ inventory.knowledgePoints.length }} 个知识点</span></div>
      <div class="paper-presets">
        <button v-for="preset in paperPresets" :key="preset.key" type="button" class="paper-preset" :class="{ active: activePaperPreset === preset.key }" @click="selectPaperPreset(preset)">
          <span class="preset-name">{{ preset.name }}<small>{{ preset.tag }}</small></span>
          <span class="preset-description">{{ preset.description }}</span>
          <span class="preset-detail">{{ preset.detail }}</span>
        </button>
        <button type="button" class="paper-preset manual-preset" :class="{ active: isManualMode }" @click="switchToManualMode">
          <span class="preset-name">手动自定义<small>自由设置</small></span>
          <span class="preset-description">取消整卷方案和难度模板</span>
          <span class="preset-detail">保留当前数字，可继续逐项修改</span>
        </button>
      </div>
      <p class="preset-help">快速方案会同时配置题型、难度和知识点要求；选择章节后仍会按该章节真实库存进行组合检查。</p>
      <div v-if="currentPaperPreset" class="variant-panel">
        <div class="variant-panel-head"><b>{{ currentPaperPreset.name }}可选方案</b><span>方案参数只读，选择一套即可；如需逐项修改请切换到手动自定义。</span></div>
        <div class="variant-grid">
          <button v-for="variant in currentPaperPreset.variants" :key="variant.key" type="button" class="variant-card" :class="{ active: activePaperVariant === variant.key }" @click="applyPaperVariant(currentPaperPreset, variant)">
            <span class="variant-title">{{ variant.name }}<small>{{ variant.scene }}</small></span>
            <span>{{ variant.description }}</span>
            <span><b>题型：</b>{{ presetTypeText(variant) }}</span>
            <span><b>难度：</b>{{ presetDifficultyText(variant) }}</span>
            <span><b>规模：</b>{{ variant.count }}题，至少{{ variant.knowledge }}个知识点</span>
          </button>
        </div>
      </div>
      <div class="mode-status"><b>当前配置方式：</b><span>{{ configurationModeText }}</span><button v-if="!isManualMode" type="button" @click="switchToManualMode">退出当前方案，改为手动设置</button></div>
      <div v-if="presetNotice" class="preset-notice">{{ presetNotice }}</div>
      <div class="base-grid">
        <label><span>试卷标题</span><input v-model="form.title" class="iq-input" placeholder="留空则自动生成" /></label>
        <label><span>总题数</span><input v-model.number="form.count" type="number" min="1" max="100" class="iq-input" :disabled="!!activePaperPreset" @change="handleCountChange" /></label>
        <label><span>最少知识点覆盖</span><input v-model.number="form.minKnowledgePoints" type="number" min="1" :max="inventory?.knowledgePoints.length || 111" class="iq-input" :disabled="!!activePaperPreset" @input="markTypeCustom" /></label>
      </div>
      <div class="chapter-selector">
        <div class="chapter-selector-head">
          <div><b>章节范围</b><small>支持多选；不选择表示使用全题库</small></div>
          <div class="chapter-actions">
            <button type="button" class="chapter-action" @click="clearChapters">不限章节</button>
            <button type="button" class="chapter-action" @click="selectAllChapters">选择全部</button>
          </div>
        </div>
        <div class="selected-summary" :class="{ empty: !form.chapters.length }">
          <span class="summary-icon">{{ form.chapters.length ? '✓' : '○' }}</span>
          <div>
            <b>{{ selectedChapterTitle }}</b>
            <small>{{ selectedChapterDetail }}</small>
          </div>
        </div>
        <div class="chapter-grid">
          <button
            v-for="chapter in 10"
            :key="chapter"
            type="button"
            class="chapter-chip"
            :class="{ active: form.chapters.includes(chapter) }"
            :aria-pressed="form.chapters.includes(chapter)"
            @click="toggleChapter(chapter)"
          >
            <span class="chapter-check">{{ form.chapters.includes(chapter) ? '✓' : '' }}</span>
            <span class="chapter-name"><b>第{{ chapter }}章</b><em>{{ getChapterName(chapter) }}</em></span>
            <small>{{ chapterTotals[chapter] || 0 }}题</small>
          </button>
        </div>
        <p class="chapter-help">点击任意章节即可选中或取消；可以连续点击选择多个章节。</p>
      </div>
    </section>

    <section class="iq-card section-card">
      <div class="section-title"><b>2. 题型结构</b><span :class="sumClass(typeSum)">已分配 {{ typeSum }}/{{ form.count }} 题</span></div>
      <div class="distribution-grid">
        <label v-for="type in typeOptions" :key="type.value" class="distribution-item">
          <span>{{ type.label }} <small>{{ type.value <= 4 ? '自动判分' : '人工查看' }}</small></span>
          <b>库存 {{ inventory?.byType?.[type.value] || 0 }}</b>
          <input v-model.number="form.typeDistribution[type.value]" type="number" min="0" :max="inventory?.byType?.[type.value] || 0" class="iq-input" :disabled="!!activePaperPreset" @input="markTypeCustom" />
        </label>
      </div>
      <div v-if="subjectiveCount" class="info-note">本试卷包含 {{ subjectiveCount }} 道主观题，简答题和程序论述题不计入自动判分正确率。</div>
    </section>

    <section class="iq-card section-card">
      <div class="section-title"><b>3. 五级难度结构</b><span :class="sumClass(difficultySum)">已分配 {{ difficultySum }}/{{ form.count }} 题</span></div>
      <div class="template-actions">
        <button v-for="item in templates" :key="item.key" class="iq-btn iq-btn-secondary iq-btn-sm" :class="{ selected: activeTemplate === item.key && !activePaperPreset }" @click="activeTemplate === item.key && !activePaperPreset ? switchToManualMode() : applyTemplate(item.key)">{{ item.label }}</button>
        <button type="button" class="iq-btn iq-btn-secondary iq-btn-sm manual-mode-btn" :class="{ selected: !activeTemplate && !activePaperPreset }" @click="switchToManualMode">取消模板，手动设置</button>
      </div>
      <div class="distribution-grid difficulty-grid">
        <label v-for="level in 5" :key="level" class="distribution-item"><span>难度 {{ level }} <small>{{ difficultyNames[level] }}</small></span><b>库存 {{ inventory?.byDifficulty?.[level] || 0 }}</b><input v-model.number="form.difficultyDistribution[level]" type="number" min="0" :max="inventory?.byDifficulty?.[level] || 0" class="iq-input" :disabled="!!activeTemplate || !!activePaperPreset" @input="markCustomConfig" /></label>
      </div>
    </section>

    <section class="iq-card section-card">
      <div class="section-title"><b>4. 组卷检查</b><span>同分候选题优先选择历史使用次数较少的题目</span></div>
      <div v-if="inventoryLoading" class="info-note">正在读取题库库存...</div>
      <div v-else class="check-list">
        <span :class="typeSum === form.count ? 'ok' : 'bad'">{{ typeSum === form.count ? '✓' : '!' }} 题型合计</span>
        <span :class="difficultySum === form.count ? 'ok' : 'bad'">{{ difficultySum === form.count ? '✓' : '!' }} 难度合计</span>
        <span :class="form.count <= (inventory?.total || 0) ? 'ok' : 'bad'">{{ form.count <= (inventory?.total || 0) ? '✓' : '!' }} 总库存</span>
        <span :class="form.minKnowledgePoints <= (inventory?.knowledgePoints.length || 0) ? 'ok' : 'bad'">{{ form.minKnowledgePoints <= (inventory?.knowledgePoints.length || 0) ? '✓' : '!' }} 知识点库存</span>
        <span :class="combinationCheckClass">{{ combinationCheckIcon }} 题型与难度组合</span>
      </div>
      <div v-if="previewLoading" class="info-note">正在检查题型与难度能否同时满足...</div>
      <div v-else-if="preview && !preview.feasible" class="feasibility-note">
        <div class="feasibility-title"><b>当前设置不能生成完整试卷</b><span v-if="isCombinationConflict">最多可匹配 {{ preview.maxAssignable }}/{{ form.count }} 题</span></div>
        <ul><li v-for="reason in preview.reasons" :key="reason">{{ formatReason(reason) }}</li></ul>
        <div v-if="preview.alternativePlans?.length" class="alternative-section">
          <div class="alternative-heading"><b>请选择一套可行调整方案</b><span>以下方案均已按当前章节库存重新验证</span></div>
          <div class="alternative-grid">
            <div v-for="plan in preview.alternativePlans" :key="plan.id" class="alternative-card">
              <div><b>{{ plan.title }}</b><span>{{ plan.description }}</span></div>
              <p><strong>题型：</strong>{{ typeDistributionText(plan.typeDistribution) }}</p>
              <p><strong>难度：</strong>{{ difficultyDistributionText(plan.difficultyDistribution) }}</p>
              <button type="button" class="iq-btn iq-btn-secondary iq-btn-sm" @click="applyAlternativePlan(plan)">采用这套方案</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="preview?.feasible" class="success-note">题型、难度和章节库存的交叉组合检查通过，可以生成 {{ form.count }} 题试卷。</div>
      <div v-if="errorMsg" class="error-note">{{ errorMsg }}</div>
      <div class="action-row"><button class="iq-btn iq-btn-primary" :disabled="!canGenerate" @click="handleGenerate">{{ loading ? '正在组卷...' : '生成智能试卷' }}</button><button class="iq-btn ai-btn" :disabled="aiLoading" @click="handleSmartExam">{{ aiLoading ? 'AI 组卷中...' : 'AI 辅助组卷' }}</button></div>
    </section>

    <section v-if="result" class="iq-card section-card result-card">
      <div class="result-head"><div><h3>{{ aiResult ? 'AI 辅助组卷成功' : '智能组卷成功' }}</h3><p>{{ result.title }} · 共 {{ result.total }} 题 · 客观题 {{ result.objectiveCount }} 题</p></div><div class="result-actions"><button v-if="!aiResult" class="iq-btn iq-btn-secondary" :disabled="loading" @click="handleRegenerate">{{ loading ? '正在重新生成...' : '条件不变，换一套题' }}</button><button class="iq-btn iq-btn-primary" @click="emit('start-exam', result.examId)">开始答题</button></div></div>
      <div v-if="!aiResult" class="info-note">如果对本次题目不满意，可以按相同章节、题型、难度和知识点要求重新抽取；新试卷会保留在试卷列表中。</div>
      <template v-if="result.report">
        <div class="report-grid">
          <div><h4>题型：目标 / 实际</h4><p v-for="type in typeOptions" :key="type.value">{{ type.label }}：{{ result.report.targetTypeDistribution[type.value] || 0 }} / {{ result.report.actualTypeDistribution[type.value] || 0 }}</p></div>
          <div><h4>难度：目标 / 实际</h4><p v-for="level in 5" :key="level">难度{{ level }}：{{ result.report.targetDifficultyDistribution[level] || 0 }} / {{ result.report.actualDifficultyDistribution[level] || 0 }}</p></div>
          <div><h4>知识点覆盖</h4><div class="point-list"><span v-for="point in result.report.knowledgePoints" :key="point">{{ point }}</span></div><p>首次进入试卷的题目：{{ result.report.unusedQuestionCount }} 道</p></div>
        </div>
        <div v-if="result.report.warnings.length" class="warning-note"><b>调整说明</b><span v-for="warning in result.report.warnings" :key="warning">{{ warning }}</span></div>
        <div v-else class="success-note">全部组卷约束均已满足。</div>
      </template>
      <div v-else-if="result.strategy" class="strategy-note">{{ result.strategy }}</div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { generateRuleExam, getExamInventory, previewRuleExam } from '@/api/practice';
import { smartExam } from '@/api/ai';
import { TYPE_OPTIONS, getChapterLabel, getChapterName } from '@/utils/constants';

const emit = defineEmits(['start-exam', 'toast']);
const typeOptions = TYPE_OPTIONS;
const difficultyNames = { 1: '入门', 2: '简单', 3: '中等', 4: '困难', 5: '挑战' };
const templates = [{ key: 'basic', label: '基础练习' }, { key: 'standard', label: '标准练习' }, { key: 'advanced', label: '提升练习' }];
const weights = { basic: [35,30,20,10,5], standard: [20,20,25,25,10], advanced: [5,10,25,35,25] };
const paperPresets = [
  { key:'foundation', name:'基础巩固卷', tag:'适合复习', description:'基础题为主，客观题占比高', detail:'提供基础均衡、客观强化和章节复习三套方案', variants:[
    { key:'foundation-balanced', name:'基础均衡', scene:'日常复习', description:'兼顾四类客观题，少量简答题', count:20, knowledge:4, typeWeights:[25,40,15,15,5,0], difficultyWeights:[40,30,20,10,0] },
    { key:'foundation-objective', name:'客观强化', scene:'快速检测', description:'判断和单选占比较高，全部自动判分', count:20, knowledge:4, typeWeights:[30,45,15,10,0,0], difficultyWeights:[35,30,20,10,5] },
    { key:'foundation-review', name:'章节复习', scene:'单章回顾', description:'题型更完整，保留少量主观题', count:20, knowledge:5, typeWeights:[20,40,15,15,10,0], difficultyWeights:[30,30,25,10,5] },
  ]},
  { key:'standard', name:'标准综合卷', tag:'日常测验', description:'题型和五级难度相对均衡', detail:'提供综合均衡、客观测验和主客观结合三套方案', variants:[
    { key:'standard-balanced', name:'综合均衡', scene:'日常测验', description:'题型与五级难度分布均衡', count:20, knowledge:5, typeWeights:[20,40,15,15,10,0], difficultyWeights:[20,20,25,25,10] },
    { key:'standard-objective', name:'客观测验', scene:'自动判分', description:'全部使用可自动判分题型', count:20, knowledge:5, typeWeights:[25,40,20,15,0,0], difficultyWeights:[20,25,25,20,10] },
    { key:'standard-mixed', name:'主客观结合', scene:'综合考查', description:'保留一定比例简答题', count:20, knowledge:5, typeWeights:[20,35,15,15,15,0], difficultyWeights:[15,20,30,25,10] },
  ]},
  { key:'advanced', name:'难点提升卷', tag:'查漏补缺', description:'增加多选、简答和高难度题', detail:'提供难题突破、思维强化和综合挑战三套方案', variants:[
    { key:'advanced-breakthrough', name:'难题突破', scene:'专项提高', description:'困难与挑战题占比较高', count:20, knowledge:6, typeWeights:[15,35,20,10,20,0], difficultyWeights:[5,10,25,35,25] },
    { key:'advanced-thinking', name:'思维强化', scene:'能力训练', description:'提高多选和简答题占比', count:20, knowledge:6, typeWeights:[15,30,25,10,20,0], difficultyWeights:[5,10,25,35,25] },
    { key:'advanced-comprehensive', name:'综合挑战', scene:'阶段测试', description:'覆盖更多题型并保持高难度', count:20, knowledge:6, typeWeights:[10,35,20,15,20,0], difficultyWeights:[10,15,25,30,20] },
  ]},
];
const form = reactive({ title: '', chapters: [], count: 20, minKnowledgePoints: 5, typeDistribution: {1:4,2:8,3:3,4:3,5:2,6:0}, difficultyDistribution: {1:4,2:4,3:5,4:5,5:2} });
const inventory = ref(null), inventoryLoading = ref(false), preview = ref(null), previewLoading = ref(false), loading = ref(false), aiLoading = ref(false), result = ref(null), aiResult = ref(false), errorMsg = ref(''), presetNotice = ref(''), activeTemplate = ref('standard'), activePaperPreset = ref('standard'), activePaperVariant = ref('standard-balanced');
const chapterTotals = {1:43,2:40,3:40,4:29,5:30,6:35,7:37,8:44,9:40,10:37};
const typeSum = computed(() => Object.values(form.typeDistribution).reduce((s,v)=>s+(Number(v)||0),0));
const difficultySum = computed(() => Object.values(form.difficultyDistribution).reduce((s,v)=>s+(Number(v)||0),0));
const subjectiveCount = computed(() => (Number(form.typeDistribution[5])||0)+(Number(form.typeDistribution[6])||0));
const combinationCheckClass = computed(() => previewLoading.value ? '' : preview.value?.feasible ? 'ok' : 'bad');
const combinationCheckIcon = computed(() => previewLoading.value ? '…' : preview.value?.feasible ? '✓' : '!');
const canGenerate = computed(() => !loading.value && !inventoryLoading.value && !previewLoading.value && preview.value?.feasible === true && (!activePaperPreset.value || !!activePaperVariant.value));
const isCombinationConflict = computed(() => preview.value?.checks && Object.values(preview.value.checks).every(Boolean));
const isManualMode = computed(() => !activePaperPreset.value && !activeTemplate.value);
const currentPaperPreset = computed(() => paperPresets.find(item => item.key === activePaperPreset.value) || null);
const currentPaperVariant = computed(() => currentPaperPreset.value?.variants.find(item => item.key === activePaperVariant.value) || null);
const configurationModeText = computed(() => {
  const paper = paperPresets.find(item => item.key === activePaperPreset.value);
  if (paper && currentPaperVariant.value) return `${paper.name}－${currentPaperVariant.value.name}（参数只读，系统按章节库存校验）`;
  if (paper) return `${paper.name}（请选择下方一套具体方案）`;
  const difficulty = templates.find(item => item.key === activeTemplate.value);
  if (difficulty) return `${difficulty.label}难度模板（题型仍可手动修改）`;
  return '手动自定义（所有数量由你设置）';
});
const selectedChapterTitle = computed(() => form.chapters.length ? `已选择 ${form.chapters.length} 个章节` : '当前使用全部章节');
const selectedChapterDetail = computed(() => form.chapters.length
  ? [...form.chapters].sort((a,b)=>a-b).map(getChapterLabel).join('、')
  : '第1章至第10章，共375道题');
const sumClass = (sum) => sum === form.count ? 'sum-ok' : 'sum-bad';
const toggleChapter = (chapter) => { const index=form.chapters.indexOf(chapter); index>=0 ? form.chapters.splice(index,1) : form.chapters.push(chapter); form.chapters.sort((a,b)=>a-b); };
const clearChapters = () => { form.chapters = []; };
const selectAllChapters = () => { form.chapters = Array.from({ length: 10 }, (_, index) => index + 1); };
const allocate = (total, values) => { const raw=values.map(v=>total*v/100); const out=raw.map(Math.floor); let left=total-out.reduce((a,b)=>a+b,0); raw.map((v,i)=>({i,r:v%1})).sort((a,b)=>b.r-a.r).forEach(x=>{if(left>0){out[x.i]++;left--;}}); return out; };
const presetTypeText = (variant) => typeOptions.map((type,index) => `${type.label}${allocate(variant.count,variant.typeWeights)[index]}题`).join('、');
const presetDifficultyText = (variant) => allocate(variant.count,variant.difficultyWeights).map((count,index) => `${index+1}级${count}题`).join('、');
const applyTemplate = (key) => { if (!weights[key]) return; activePaperPreset.value=''; activePaperVariant.value=''; presetNotice.value=''; activeTemplate.value=key; allocate(Number(form.count)||0,weights[key]).forEach((value,index)=>{form.difficultyDistribution[index+1]=value;}); };
const switchToManualMode = () => {
  activePaperPreset.value = '';
  activePaperVariant.value = '';
  activeTemplate.value = '';
  presetNotice.value = '已切换为手动自定义，当前题型和难度数字已保留，可以直接修改。';
};
const markCustomConfig = () => {
  activePaperPreset.value = '';
  activePaperVariant.value = '';
  activeTemplate.value = '';
  presetNotice.value = '';
};
const markTypeCustom = () => {
  activePaperPreset.value = '';
  activePaperVariant.value = '';
  presetNotice.value = '';
};
const selectPaperPreset = (preset) => {
  activePaperPreset.value = preset.key;
  activePaperVariant.value = '';
  activeTemplate.value = '';
  presetNotice.value = `请选择“${preset.name}”下的一套具体方案。方案参数将只读展示，无需手动修改。`;
  preview.value = null;
};
const applyPaperVariant = async (preset, variant) => {
  activePaperPreset.value = preset.key;
  activePaperVariant.value = variant.key;
  presetNotice.value = '';
  activeTemplate.value = preset.key === 'foundation' ? 'basic' : preset.key === 'advanced' ? 'advanced' : 'standard';
  form.count = variant.count;
  allocate(variant.count,variant.typeWeights).forEach((value,index)=>{form.typeDistribution[index+1]=value;});
  allocate(variant.count,variant.difficultyWeights).forEach((value,index)=>{form.difficultyDistribution[index+1]=value;});
  form.minKnowledgePoints = Math.min(variant.knowledge, inventory.value?.knowledgePoints.length || variant.knowledge);
  try {
    const checked = await previewRuleExam(buildRulePayload());
    if (!checked.feasible && checked.alternativePlans?.length) {
      setAlternativePlan(checked.alternativePlans[0], true);
      presetNotice.value = `${variant.name}的原始比例与当前章节库存不完全匹配，系统已${checked.alternativePlans[0].description}，调整后的只读方案已经过可行性验证。`;
    } else if (checked.feasible) {
      presetNotice.value = `${preset.name}－${variant.name}与当前章节库存匹配，可以直接生成。`;
    }
  } catch (err) {
    errorMsg.value = err.message || '快速方案检查失败';
  }
};
const handleCountChange = () => {
  if (activePaperPreset.value) return;
  applyTemplate(activeTemplate.value);
};
const buildRulePayload = () => ({
  title: form.title,
  chapters: [...form.chapters],
  count: Number(form.count),
  minKnowledgePoints: Number(form.minKnowledgePoints),
  typeDistribution: { ...form.typeDistribution },
  difficultyDistribution: { ...form.difficultyDistribution },
});
let previewTimer;
let previewRequestId = 0;
const loadPreview = async () => {
  const requestId = ++previewRequestId;
  previewLoading.value = true;
  try {
    const data = await previewRuleExam(buildRulePayload());
    if (requestId === previewRequestId) preview.value = data;
  } catch (err) {
    if (requestId === previewRequestId) {
      preview.value = null;
      errorMsg.value = err.message || '组合检查失败，请确认后端服务是否正常';
    }
  } finally {
    if (requestId === previewRequestId) previewLoading.value = false;
  }
};
const schedulePreview = () => {
  clearTimeout(previewTimer);
  preview.value = null;
  previewTimer = setTimeout(loadPreview, 300);
};
const loadInventory = async () => {
  inventoryLoading.value=true;
  errorMsg.value='';
  try { inventory.value=await getExamInventory(form.chapters); }
  catch(err){errorMsg.value=err.message||'读取题库库存失败';}
  finally{
    inventoryLoading.value=false;
    const preset = paperPresets.find(item => item.key === activePaperPreset.value);
    const variant = preset?.variants.find(item => item.key === activePaperVariant.value);
    if (preset && variant) applyPaperVariant(preset, variant); else schedulePreview();
  }
};
watch(() => [...form.chapters], loadInventory);
watch(() => [form.count, form.minKnowledgePoints, ...Object.values(form.typeDistribution), ...Object.values(form.difficultyDistribution)], schedulePreview);
onMounted(loadInventory);
const validate = () => { if(!Number.isInteger(form.count)||form.count<1||form.count>100)return '总题数需为1-100之间的整数'; if(typeSum.value!==form.count)return `题型合计为${typeSum.value}，应为${form.count}`; if(difficultySum.value!==form.count)return `难度合计为${difficultySum.value}，应为${form.count}`; if(form.count>(inventory.value?.total||0))return '当前章节范围题目库存不足'; if(form.minKnowledgePoints>(inventory.value?.knowledgePoints.length||0))return '知识点覆盖要求超过当前库存'; return ''; };
const formatReason = (reason) => reason.replace(/题型1/g, '判断题').replace(/题型2/g, '单选题').replace(/题型3/g, '多选题').replace(/题型4/g, '填空题').replace(/题型5/g, '简答题').replace(/题型6/g, '程序论述题');
const typeDistributionText = (distribution) => typeOptions.map(type => `${type.label}${Number(distribution?.[type.value]) || 0}题`).join('、');
const difficultyDistributionText = (distribution) => [1,2,3,4,5].map(level => `${level}级${Number(distribution?.[level]) || 0}题`).join('、');
const setAlternativePlan = (plan, keepPreset = false) => {
  [1,2,3,4,5,6].forEach(type => { form.typeDistribution[type] = Number(plan.typeDistribution?.[type]) || 0; });
  [1,2,3,4,5].forEach(level => { form.difficultyDistribution[level] = Number(plan.difficultyDistribution?.[level]) || 0; });
  activeTemplate.value = '';
  if (!keepPreset) { activePaperPreset.value = ''; activePaperVariant.value = ''; }
};
const applyAlternativePlan = (plan) => { presetNotice.value = ''; setAlternativePlan(plan); };
const handleGenerate = async () => { errorMsg.value=validate(); if(errorMsg.value)return; if(!preview.value?.feasible){errorMsg.value='当前设置未通过题型与难度组合检查，请先调整后再生成';return;} loading.value=true; try{result.value=await generateRuleExam(buildRulePayload());aiResult.value=false;emit('toast',{message:'智能组卷成功',type:'success'});}catch(err){errorMsg.value=err.message||'组卷失败';schedulePreview();}finally{loading.value=false;} };
const handleRegenerate = async () => {
  if (!preview.value?.feasible || loading.value) return;
  loading.value = true;
  errorMsg.value = '';
  try {
    const payload = buildRulePayload();
    const baseTitle = String(form.title || result.value?.title || '智能试卷').replace(/-重组-\d{6}$/, '');
    const stamp = new Date().toTimeString().slice(0,8).replace(/:/g,'');
    payload.title = `${baseTitle}-重组-${stamp}`;
    result.value = await generateRuleExam(payload);
    aiResult.value = false;
    emit('toast',{message:'已按相同条件重新生成一套试卷',type:'success'});
  } catch (err) { errorMsg.value=err.message||'重新生成失败'; schedulePreview(); }
  finally { loading.value=false; }
};
const handleSmartExam = async () => { errorMsg.value='';aiLoading.value=true;try{const body={count:form.count};if(form.chapters.length===1)body.章节=form.chapters[0];result.value=await smartExam(body);aiResult.value=true;emit('toast',{message:'AI辅助组卷成功',type:'success'});}catch(err){errorMsg.value=err.message||'AI辅助组卷失败';}finally{aiLoading.value=false;} };
</script>

<style scoped>
.exam-builder{display:flex;flex-direction:column;gap:16px;max-width:1120px}.iq-page-header h2{margin:0;color:var(--iq-neutral-900)}.iq-page-header p,.section-title span,.result-head p{margin:4px 0 0;color:var(--iq-neutral-500);font-size:13px}.section-card{padding:22px 26px}.section-title,.result-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}.base-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px}.base-grid label,.distribution-item{display:flex;flex-direction:column;gap:6px;font-size:13px}.inline-actions,.template-actions,.action-row{display:flex;gap:8px;margin-top:12px}.distribution-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.difficulty-grid{grid-template-columns:repeat(5,1fr)}.distribution-item{padding:12px;border:1px solid var(--iq-neutral-200);border-radius:8px}.distribution-item span{font-weight:600}.distribution-item small{font-weight:400;color:var(--iq-neutral-500)}.distribution-item b{font-size:12px;color:var(--iq-neutral-500)}.sum-ok,.ok{color:#059669!important}.sum-bad,.bad{color:#dc2626!important}.info-note,.error-note,.warning-note,.success-note,.strategy-note{padding:11px 13px;border-radius:8px;margin-top:12px;font-size:13px}.info-note{background:#eff6ff;color:#1d4ed8}.error-note{background:#fef2f2;color:#b91c1c}.success-note{background:#ecfdf5;color:#047857}.warning-note{background:#fffbeb;color:#92400e;display:flex;flex-direction:column;gap:4px}.check-list{display:flex;flex-wrap:wrap;gap:18px;font-size:13px}.ai-btn{background:#7c3aed;color:#fff;border-color:#7c3aed}.result-card{border-left:4px solid #10b981}.result-head h3{margin:0}.report-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.report-grid h4{margin:0 0 10px}.report-grid p{margin:5px 0;font-size:13px}.point-list{display:flex;flex-wrap:wrap;gap:5px}.point-list span{background:var(--iq-primary-50);color:var(--iq-primary-700);padding:3px 8px;border-radius:15px;font-size:12px}

.chapter-selector{margin-top:20px;padding:18px;border:1px solid #dbe3f0;border-radius:12px;background:#f8fafc}.chapter-selector-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}.chapter-selector-head>div:first-child{display:flex;flex-direction:column;gap:3px}.chapter-selector-head b{font-size:14px;color:#172033}.chapter-selector-head small{font-size:12px;color:#64748b}.chapter-actions{display:flex;gap:8px}.chapter-action{padding:7px 12px;border:1px solid #c7d2fe;border-radius:7px;background:#fff;color:#4f46e5;font-size:12px;font-weight:600;cursor:pointer}.chapter-action:hover{background:#eef2ff}.selected-summary{display:flex;align-items:center;gap:10px;padding:11px 13px;margin-bottom:12px;border:1px solid #a5b4fc;border-radius:9px;background:#eef2ff;color:#3730a3}.selected-summary.empty{border-color:#cbd5e1;background:#fff;color:#475569}.summary-icon{display:inline-flex;width:25px;height:25px;align-items:center;justify-content:center;border-radius:50%;background:#4f46e5;color:#fff;font-weight:700}.selected-summary.empty .summary-icon{background:#94a3b8}.selected-summary>div{display:flex;flex-direction:column;gap:2px}.selected-summary b{font-size:13px}.selected-summary small{font-size:12px;color:#6366f1}.selected-summary.empty small{color:#64748b}.chapter-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.chapter-chip{position:relative;display:grid;grid-template-columns:24px 1fr;grid-template-rows:auto auto;align-items:center;column-gap:8px;min-height:64px;padding:10px 11px;border:2px solid #e2e8f0;border-radius:10px;background:#fff;color:#334155;text-align:left;cursor:pointer;transition:border-color .15s,background .15s,box-shadow .15s,transform .15s}.chapter-chip:hover{border-color:#a5b4fc;background:#f8faff;transform:translateY(-1px)}.chapter-chip.active{border-color:#4f46e5;background:#eef2ff;color:#312e81;box-shadow:0 0 0 2px rgba(79,70,229,.1)}.chapter-check{grid-row:1/3;display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center;border:2px solid #cbd5e1;border-radius:6px;background:#fff;color:#fff;font-size:14px;font-weight:800}.chapter-chip.active .chapter-check{border-color:#4f46e5;background:#4f46e5}.chapter-name{font-size:13px;font-weight:700}.chapter-chip small{font-size:11px;color:#64748b}.chapter-chip.active small{color:#6366f1}.chapter-help{margin:10px 0 0;color:#64748b;font-size:12px}
.feasibility-note{padding:14px;margin-top:12px;border:1px solid #fecaca;border-radius:9px;background:#fff7f7;color:#991b1b;font-size:13px}.feasibility-title{display:flex;justify-content:space-between;gap:12px}.feasibility-title span{color:#b91c1c}.feasibility-note ul{margin:9px 0 0;padding-left:20px}.feasibility-note li+li{margin-top:5px}.suggestion-box{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 12px;margin-top:12px;border-radius:8px;background:#fff;color:#334155}.suggestion-box>div{display:flex;flex-direction:column;gap:4px}.suggestion-box span{font-size:12px;color:#64748b}
.paper-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:7px}.paper-preset{display:flex;flex-direction:column;gap:5px;padding:13px;border:2px solid #e2e8f0;border-radius:10px;background:#fff;text-align:left;color:#334155;cursor:pointer}.paper-preset:hover{border-color:#a5b4fc}.paper-preset.active{border-color:#4f46e5;background:#eef2ff}.manual-preset.active{border-color:#0f766e;background:#f0fdfa}.preset-name{display:flex;align-items:center;justify-content:space-between;font-weight:700}.preset-name small{padding:2px 7px;border-radius:12px;background:#eef2ff;color:#4f46e5;font-size:11px}.paper-preset.active .preset-name small{background:#fff}.preset-description{font-size:12px;color:#475569}.preset-detail,.preset-help{font-size:11px;color:#64748b}.preset-help{margin:0 0 8px}.mode-status{display:flex;align-items:center;gap:7px;padding:8px 11px;margin-bottom:8px;border-radius:8px;background:#f8fafc;color:#475569;font-size:12px}.mode-status span{color:#334155}.mode-status button{margin-left:auto;border:0;background:transparent;color:#4f46e5;font-size:12px;font-weight:600;cursor:pointer}.mode-status button:hover{text-decoration:underline}.preset-notice{padding:9px 11px;margin-bottom:14px;border-radius:8px;background:#f0fdf4;color:#047857;font-size:12px}.manual-mode-btn.selected{border-color:#0f766e;background:#f0fdfa;color:#0f766e}.alternative-section{margin-top:13px}.alternative-heading{display:flex;justify-content:space-between;gap:12px;margin-bottom:9px}.alternative-heading span{font-size:12px;color:#64748b}.alternative-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.alternative-card{padding:11px;border:1px solid #fecaca;border-radius:8px;background:#fff;color:#334155}.alternative-card>div{display:flex;flex-direction:column;gap:2px}.alternative-card>div span,.alternative-card p{font-size:12px;color:#64748b}.alternative-card p{margin:7px 0}.alternative-card strong{color:#334155}.result-actions{display:flex;gap:8px}
.variant-panel{padding:14px;margin:10px 0;border:1px solid #c7d2fe;border-radius:10px;background:#f8faff}.variant-panel-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px;color:#312e81}.variant-panel-head span{font-size:12px;color:#64748b}.variant-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.variant-card{display:flex;flex-direction:column;gap:6px;padding:12px;border:2px solid #e2e8f0;border-radius:9px;background:#fff;color:#475569;text-align:left;font-size:11px;cursor:pointer}.variant-card:hover{border-color:#a5b4fc}.variant-card.active{border-color:#4f46e5;background:#eef2ff}.variant-title{display:flex;align-items:center;justify-content:space-between;color:#1e293b;font-size:13px;font-weight:700}.variant-title small{padding:2px 6px;border-radius:10px;background:#f1f5f9;color:#64748b;font-size:10px}.variant-card b{color:#334155}.iq-input:disabled{background:#f1f5f9;color:#475569;cursor:not-allowed;opacity:1}.distribution-item:has(.iq-input:disabled){background:#f8fafc}.result-actions{display:flex;gap:8px}

@media(max-width:900px){.chapter-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.difficulty-grid{grid-template-columns:repeat(3,1fr)}.variant-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:800px){.base-grid,.distribution-grid,.report-grid,.paper-presets,.alternative-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.base-grid,.distribution-grid,.difficulty-grid,.report-grid,.paper-presets,.alternative-grid,.variant-grid{grid-template-columns:1fr}.chapter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.chapter-selector-head,.alternative-heading,.variant-panel-head,.result-head{flex-direction:column}.chapter-actions{width:100%}.chapter-action{flex:1}.result-actions{width:100%;flex-direction:column}}
.chapter-chip{grid-template-columns:24px minmax(0,1fr);min-height:78px}.chapter-name{display:grid;gap:2px;min-width:0}.chapter-name b{font-size:13px}.chapter-name em{font-size:12px;line-height:1.35;font-style:normal;font-weight:500;color:#475569;overflow-wrap:anywhere}.chapter-chip.active .chapter-name em{color:#4338ca}.selected-summary>div{min-width:0}.selected-summary small{line-height:1.6}
</style>
