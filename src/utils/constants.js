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

const CHAPTER_MAP = {};

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

export { TYPE_MAP, DIFFICULTY_MAP, CHAPTER_MAP, TYPE_OPTIONS, DIFFICULTY_OPTIONS };
