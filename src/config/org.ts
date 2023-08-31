const orgConfig: [string, number][] = [
  ["心理学院", 253000],
  ["数学与统计学院", 170000],
  ["历史文化学院", 166000],
  ["文学院", 164000],
  ["地理科学学院", 234000],
  ["物理学院", 173000],
  ["马克思主义学部", 236000],
  ["教育学部", 232000],
  ["化学学院", 174000],
  ["生命科学学院", 175000],
  ["体育学院", 177000],
  ["外国语学院", 167000],
  ["教师教育研究院", 159000],

  ["政法学院", 161000],
  ["美术学院", 169000],
  ["信息科学与技术学院", 252000],
  ["音乐学院", 168000],
  ["经济与管理学院", 261000],
  ["传媒科学学院（新闻学院）", 178000],
  ["环境学院", 235000],
  ["思想政治教育研究中心", 135000],
  ["国际汉学院（海外教育学院）", 246000],
];

export const org2code = new Map<string, number>(orgConfig);
export const code2org = new Map<number, string>(
  orgConfig.map(([org, code]) => [code, org])
);
