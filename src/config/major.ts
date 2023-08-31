const majorConfig: [string, string][] = [
  // 文学院
  ["汉语言文学（公费师范）", "164111"],
  ["汉语言文学（优师专项）", "164112"],
  ["汉语言文学", "164110"],
  ["汉语言文学（预科）", "164114"],
  ["学科教学（语文）", "045103"],
  ["汉语言文字学", "050103"],
  ["中国现当代文学", "050106"],

  // 心理学院
  ["心理学（公费师范）", "158141"],
  ["心理学", "158140"],
  ["心理学（预科）", "158142"],
  ["应用心理", "045400"],
  ["心理健康教育", "045116"],
  ["基础心理学", "040201"],
  ["应用心理学", "040203"],
  ["发展与教育心理学", "040202"],

  // 历史文化学院
  ["历史学（预科）", "166115"],
  ["历史学", "166110"],
  ["历史学（公费师范）", "166111"],
  ["历史学（优师专项）", "166114"],
  ["世界史", "060300"],
  ["中国史", "060200"],
  ["学科教学（历史）", "045109"],

  // 教育学部
  ["小学教育", "158130"],
  ["小学教育（公费师范）", "158131"],
  ["教育学类", "158010"],
  ["教育学类（预科）", "158011"],
  ["学前教育（公费师范）", "158121"],
  ["学前教育", "158120"],
  ["教育学", "158110"],
  ["小学教育", "045115"],
  ["学前教育", "045118"],

  // 马克思主义学部
  ["马克思主义理论类", "179910"],
  ["马克思主义理论类（预科）", "179911"],
  ["思想政治教育", "161120"],
  ["思想政治教育（第二学士学位）", "161122"],
  ["社会学", "179120"],
  ["哲学", "179110"],
  ["马克思主义基本原理", "030501"],
  ["党的建设", "0305Z1"],
  ["马克思主义中国化研究", "030503"],

  // 数学与统计学院
  ["数学与应用数学（公费师范）", "170111"],
  ["数学类", "170910"],
  ["数学与应用数学（优师专项）", "170112"],
  ["数学与应用数学", "170110"],
  ["统计学", "170120"],
  ["统计学（本硕博基地班）", "170121"],
  ["应用数学", "070104"],
  ["运筹学与控制论", "070105"],
  ["学科教学（数学）", "045104"],
  ["基础数学", "070101"],
  ["计算数学", "070102"],
  ["应用统计", "025200"],
  ["统计学", "071400"],
  ["数学教育", "0701Z1"],

  // 物理学院
  ["物理学（公费师范）", "173111"],
  ["物理学（优师专项）", "173112"],
  ["物理学类", "173910"],
  ["物理学类（预科）", "173911"],
  ["物理学", "173110"],
  ["电子信息科学与技术", "173140"],
  ["材料物理", "173120"],
  ["学科教学（物理）", "045105"],
  ["理论物理", "070201"],
  ["电子信息", "085400"],
  ["材料学", "077302"],
  ["凝聚态物理", "070205"],
  ["粒子物理与原子核物理", "070202"],
  ["光学", "070207"],

  // 化学学院
  ["化学（公费师范）", "174111"],
  ["化学（优师专项）", "174113"],
  ["化学", "174110"],
  ["物理化学", "070304"],
  ["学科教学（化学）", "045106"],
  ["无机化学", "070301"],
  ["有机化学", "070303"],

  // 生命科学学院
  ["生物科学（公费师范）", "175111"],
  ["生物科学（优师专项）", "175112"],
  ["生物科学类", "175910"],
  ["生物科学", "175110"],
  ["生物技术", "175120"],
  ["生物学", "071000"],
  ["学科教学（生物）", "045107"],

  // 地理科学学院
  ["地理科学（公费师范）", "234111"],
  ["地理科学（优师专项）", "234113"],
  ["地理科学类", "234910"],
  ["地理科学类（预科）", "234911"],
  ["地理科学", "234110"],
  ["地理信息科学", "234140"],
  ["人文地理与城乡规划", "234130"],
  ["湿地科学", "0705Z2"],
  ["自然地理学", "070501"],
  ["地图学与地理信息系统", "070503"],
  ["城乡规划学", "083300"],
  ["人文地理学", "070502"],
  ["学科教学（地理）", "045110"],

  // 体育学院
  ["体育教育（公费师范）", "177111"],
  ["体育教育", "177110"],
  ["冰雪运动", "177140"],
  ["运动训练", "177120"],
  ["武术与民族传统体育", "177130"],
  ["运动训练", "045202"],
  ["体育教学", "045201"],
  ["体育教育训练学", "040303"],

  // 教师教育研究院
  ["教师教育", "0401Z2"],

  // 经济与管理学院
  ["经济学类", "162010"],
  ["经济学类（预科）", "162011"],
  ["工商管理类", "163010"],
  ["会计学（中美合作）", "163141"],
  ["金融学", "162150"],
  ["人力资源管理", "163120"],
  ["市场营销", "163110"],
  ["经济学", "162110"],
  ["会计", "125300"],
  ["会计学", "163140"],
  ["区域经济学", "020202"],
  ["金融", "025100"],

  // 音乐学院
  ["音乐学（钢琴，师范）", "168126"],
  ["音乐学（器乐）", "168115"],
  ["音乐学（声乐，师范）", "168127"],
  ["舞蹈编导", "168120"],
  ["音乐学（钢琴演奏）", "168193"],
  ["音乐", "135101"],
  ["音乐与舞蹈学", "130200"],
  ["舞蹈", "135106"],
  ["音乐学（师范）", "168111"],
  ["学科教学（音乐）", "045111"],

  // 美术学院
  ["设计学类", "169030"],
  ["美术学", "169110"],
  ["美术学（师范）", "169111"],
  ["服装与服饰设计", "169160"],
  ["艺术设计", "135108"],
  ["视觉传达设计", "169130"],
  ["设计学", "130500"],
  ["雕塑", "169120"],
  ["美术", "135107"],
  ["美术学（水彩画）", "169114"],
  ["美术学（中国画）", "169113"],
  ["美术学（油画）", "169116"],
  ["美术学（版画）", "169115"],

  // 政法学院
  ["政治学类（预科）", "161011"],
  ["政治学类", "161010"],
  ["思想政治教育（公费师范）", "161121"],
  ["思想政治教育（优师专项）", "161123"],
  ["国际政治", "161110"],
  ["法学", "161140"],
  ["法学（预科）", "161141"],
  ["图书馆学", "171130"],
  ["政治学与行政学", "161150"],
  ["学科教学（思政）", "045102"],
  ["政治学", "030200"],
  ["法律（法学）", "035102"],
  ["法律（非法学）", "035101"],
  ["法学", "030100"],

  // 信息科学与技术学院
  ["计算机类", "252010"],
  ["计算机类（预科）", "252011"],
  ["计算机科学与技术", "171120"],
  ["计算机科学与技术（中美合作）", "171121"],
  ["计算机科学与技术（第二学士学位）", "171123"],
  ["教育技术学（公费师范）", "171111"],
  ["教育技术学", "171110"],
  ["智能科学与技术", "252160"],
  ["图书情报", "125500"],
  ["计算机科学与技术", "077500"],
  ["计算机技术", "085404"],

  // 环境学院
  ["环境科学与工程类", "235010"],
  ["环境科学与工程类（预科）", "235011"],
  ["环境工程", "235140"],
  ["环境科学与工程", "077600"],
  ["环境工程", "083002"],
  ["环境科学", "235120"],

  // 传媒科学学院
  ["新闻传播学类", "178010"],
  ["新闻传播学类（预科）", "178011"],
  ["广播电视", "135105"],
  ["广播电视编导", "178130"],
  ["数字媒体技术", "178160"],
  ["播音与主持艺术", "178140"],
  ["新闻学", "178170"],
  ["广告学", "178120"],
  ["视觉传达设计(数字媒介设计)", "169132"],
  ["新闻与传播", "055200"],

  // 外国语学院 本部
  ["英语（公费师范）", "167111"],
  ["英语（优师专项）", "167118"],
  ["英语", "167110"],
  ["英语（科技交流）", "1066"],
  ["英语语言文学", "050201"],
  ["英语笔译", "055101"],
  ["英语口译", "055102"],
  ["学科教学（英语）", "045108"],

  // 外国语学院 净月
  ["俄语", "167120"],
  ["德语", "167180"],
  ["日语", "167130"],
  ["商务英语", "167140"],
  ["俄语笔译", "055103"],
  ["日语语言文学", "050205"],

  // 国际汉学院
  ["汉语国际教育", "045300"],
  ["汉语国际教育", "045174"],

  // 思想政治教育研究中心
  ["思想政治教育", "030505"],

  // 未知
  ["外语教育", "0502Z2"],
  ["外国语言学及应用语言学", "050211"],
  ["生态学", "235110"],
  ["材料物理与化学", "080501"],
  ["材料科学与工程", "077300"],
  ["学生发展与教育", "045172"],
  ["学校课程与教学", "045171"],
  ["高等教育学", "040106"],
  ["中国近现代史基本问题研究", "030506"],
  ["现代教育技术", "045114"],
  ["科学技术哲学", "010108"],
  ["教育史", "040103"],
  ["教育学原理", "040101"],
  ["课程与教学论", "040102"],
  ["材料物理与化学", "077301"],
  ["材料与化工", "085600"],
  ["马克思主义哲学", "010101"],
  ["环境设计", "169140"],
  ["社会工作", "035200"],
  ["语言学及应用语言学", "050102"],
  ["草学", "090900"],
  ["教育经济与管理", "047101"],
  ["行政管理", "161130"],
  ["比较教育学", "040104"],
  ["文艺学", "050101"],
  ["企业管理", "120202"],
  ["控制科学与工程", "081100"],
  ["资源与环境", "085700"],
  ["情报学", "120502"],
  ["劳动经济学", "020207"],
  ["艺术学理论", "130100"],
  ["学前教育学", "040105"],
  ["美术学", "130400"],
  ["生态学", "071300"],
  ["统计学", "AA4F800F47A145F69078738011E88A44"],
  ["公共管理", "125200"],
  ["金融学", "020204"],
  ["数学技术", "0701Z2"],
  ["教育领导与管理", "045173"],
];

export const code2major = new Map<string, string>(
  majorConfig.map(([major, code]) => [code, major])
);
