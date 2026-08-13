const TYPE_MAP = {
  1: '判断题',
  2: '单选题',
  3: '多选题',
  4: '填空题',
  5: '简答题',
  6: '程序论述题',
};

const DIFFICULTY_MAP = {
  '1': '⭐',
  '2': '⭐⭐',
  '3': '⭐⭐⭐',
  '4': '⭐⭐⭐⭐',
  '5': '⭐⭐⭐⭐⭐',
  '入门': '⭐',
  '简单': '⭐⭐',
  '中等': '⭐⭐⭐',
  '困难': '⭐⭐⭐⭐',
  '挑战': '⭐⭐⭐⭐⭐',
  '容易': '⭐⭐',
  '一般': '⭐⭐⭐',
  '较难': '⭐⭐⭐⭐',
  '困难': '⭐⭐⭐⭐⭐',
};

const CHAPTER_MAP = {
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

const TYPE_OPTIONS = Object.entries(TYPE_MAP).map(([value, label]) => ({ value: Number(value), label }));

const DIFFICULTY_OPTIONS = [
  { value: '1', label: '⭐ 入门' },
  { value: '2', label: '⭐⭐ 简单' },
  { value: '3', label: '⭐⭐⭐ 中等' },
  { value: '4', label: '⭐⭐⭐⭐ 困难' },
  { value: '5', label: '⭐⭐⭐⭐⭐ 挑战' },
];

export const getTypeName = (type) => TYPE_MAP[type] || '未知';
export const getDifficultyLabel = (d) => {
  const s = String(d || '');
  return DIFFICULTY_MAP[s] || s;
};
export const getChapterName = (chapter) => CHAPTER_MAP[Number(chapter)] || '未命名章节';
export const getChapterLabel = (chapter) => `第${Number(chapter)}章 ${getChapterName(chapter)}`;

export { TYPE_MAP, DIFFICULTY_MAP, CHAPTER_MAP, TYPE_OPTIONS, DIFFICULTY_OPTIONS };
