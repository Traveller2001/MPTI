(function () {
  const dimensionMeta = {
    G1: { name: "G1 控制欲", model: "带组管理模型" },
    G2: { name: "G2 推进强度", model: "带组管理模型" },
    G3: { name: "G3 开会密度", model: "带组管理模型" },
    C1: { name: "C1 响应速度", model: "沟通反馈模型" },
    C2: { name: "C2 反馈温度", model: "沟通反馈模型" },
    C3: { name: "C3 画饼浓度", model: "沟通反馈模型" },
    A1: { name: "A1 选题冒险度", model: "学术策略模型" },
    A2: { name: "A2 结果偏好", model: "学术策略模型" },
    A3: { name: "A3 资源嗅觉", model: "学术策略模型" },
    T1: { name: "T1 放养程度", model: "培养生态模型" },
    T2: { name: "T2 护崽指数", model: "培养生态模型" },
    T3: { name: "T3 情绪天气", model: "培养生态模型" },
    L1: { name: "L1 经费手感", model: "导师生存模型" },
    L2: { name: "L2 在场概率", model: "导师生存模型" },
    L3: { name: "L3 边界感", model: "导师生存模型" }
  };

  const questions = [
    {
      id: "q1",
      dim: "G1",
      text: "你给导师发了一版初稿后，最常发生的情况是：",
      options: [
        { label: "一句“收到，有空看”，然后世界安静了。", value: 1 },
        { label: "会改结构和关键段落，但不会把你当实习排版。", value: 2 },
        { label: "从标题到配色都批满，仿佛文档里住着导师本人。", value: 3 }
      ]
    },
    {
      id: "q2",
      dim: "G1",
      text: "导师对你实验和论文细节的介入程度，更像：",
      options: [
        { label: "放权型股东，方向给了，细节你自己长。", value: 1 },
        { label: "项目经理，会抓关键节点。", value: 2 },
        { label: "远程桌面接管，恨不得帮你点保存。", value: 3 }
      ]
    },
    {
      id: "q3",
      dim: "G2",
      text: "学期初导师给你定目标时，最常见的语气是：",
      options: [
        { label: "先活下来，稳步推进，别一上来把自己卷断电。", value: 1 },
        { label: "做出一篇像样的，节奏别太散。", value: 2 },
        { label: "论文、比赛、项目、专利都看看，年轻人别设上限。", value: 3 }
      ]
    },
    {
      id: "q4",
      dim: "G2",
      text: "当你说“最近进度一般”时，导师更可能：",
      options: [
        { label: "让你先调整节奏，别原地自爆。", value: 1 },
        { label: "帮你拆任务，顺便补一个小 deadline。", value: 2 },
        { label: "当场再塞两个里程碑，像在给项目续命。", value: 3 }
      ]
    },
    {
      id: "q5",
      dim: "G3",
      text: "你们组会频率大概是：",
      options: [
        { label: "导师想起来才开，像不定期流星雨。", value: 1 },
        { label: "周更或双周更，正常人类可承受。", value: 2 },
        { label: "密到你怀疑会议本身就是科研。", value: 3 }
      ]
    },
    {
      id: "q6",
      dim: "G3",
      text: "除了正式组会，导师还会：",
      options: [
        { label: "基本不临时 call，你只要别失联就行。", value: 1 },
        { label: "关键节点会加开小会，精准补刀。", value: 2 },
        { label: "走廊偶遇都能立刻变成站会。", value: 3 }
      ]
    },
    {
      id: "q7",
      dim: "C1",
      text: "你晚上给导师发消息，通常会收到：",
      options: [
        { label: "第二天甚至更久后的回音，像向山谷喊话。", value: 1 },
        { label: "有空会回，速度看对方当天行程。", value: 2 },
        { label: "已读、回复、追加任务，一气呵成。", value: 3 }
      ]
    },
    {
      id: "q8",
      dim: "C1",
      text: "导师对文档和汇报的反馈速度通常：",
      options: [
        { label: "跟期刊审稿差不多，主打一个等等。", value: 1 },
        { label: "比你预想快一些，属于可沟通范围。", value: 2 },
        { label: "你还没出门，修改版已经发回来了。", value: 3 }
      ]
    },
    {
      id: "q9",
      dim: "C2",
      text: "导师指出问题时，更像：",
      options: [
        { label: "匿名审稿人，字字不多，刀刀到肉。", value: 1 },
        { label: "严格但正常，先说问题再说改法。", value: 2 },
        { label: "虽然在批评你，但你居然没有想哭。", value: 3 }
      ]
    },
    {
      id: "q10",
      dim: "C2",
      text: "你做出一点进展时，导师通常：",
      options: [
        { label: "默认这是你该做的，不额外庆祝。", value: 1 },
        { label: "会简单肯定一下，情绪价值刚刚够用。", value: 2 },
        { label: "能把一句“不错”说出颁奖现场的味道。", value: 3 }
      ]
    },
    {
      id: "q11",
      dim: "C3",
      text: "你刚跑通一个 baseline，导师最可能说：",
      options: [
        { label: "先别想太多，把实验补完整。", value: 1 },
        { label: "这个可以往一篇文章去靠。", value: 2 },
        { label: "做大一点，说不定能冲个大的。", value: 3 }
      ]
    },
    {
      id: "q12",
      dim: "C3",
      text: "导师描述项目未来时，画面通常是：",
      options: [
        { label: "朴素务实，能毕业能发就很好。", value: 1 },
        { label: "有想象空间，但还在正常人类区间。", value: 2 },
        { label: "从这个图一路通向顶刊、大奖和改变世界。", value: 3 }
      ]
    },
    {
      id: "q13",
      dim: "A1",
      text: "选题时导师更偏好：",
      options: [
        { label: "成熟稳妥路线，别拿学位做压力测试。", value: 1 },
        { label: "保底方向和探索方向并行。", value: 2 },
        { label: "不够新就没兴趣，主打一个赌大的。", value: 3 }
      ]
    },
    {
      id: "q14",
      dim: "A1",
      text: "如果一个方向成功率低但可能很炸，导师通常：",
      options: [
        { label: "先别碰，学术生涯也要讲现金流。", value: 1 },
        { label: "可以小规模试试，别 all in。", value: 2 },
        { label: "冲，这才像样。保守的结果不会自己发光。", value: 3 }
      ]
    },
    {
      id: "q15",
      dim: "A2",
      text: "当结果“扎实但不炸裂”时，导师通常会：",
      options: [
        { label: "挺好，能讲清楚就值得写。", value: 1 },
        { label: "再想想亮点，稳和新最好同时存在。", value: 2 },
        { label: "不够刺激，继续炼，没爆点不甘心。", value: 3 }
      ]
    },
    {
      id: "q16",
      dim: "A2",
      text: "导师看论文最在意的，更接近：",
      options: [
        { label: "逻辑自洽、可复现、别整虚的。", value: 1 },
        { label: "既要稳，也要有个能讲的亮点。", value: 2 },
        { label: "第一眼能不能把人震住。", value: 3 }
      ]
    },
    {
      id: "q17",
      dim: "A3",
      text: "导师搞资源的能力更像：",
      options: [
        { label: "随缘拾荒型，能省就省，能借就借。", value: 1 },
        { label: "正常申请型，知道该去哪里敲门。", value: 2 },
        { label: "基金、合作、设备和机会像会自己长出来。", value: 3 }
      ]
    },
    {
      id: "q18",
      dim: "A3",
      text: "当新的合作或资源窗口出现时，导师通常：",
      options: [
        { label: "先观望，确认值不值得再说。", value: 1 },
        { label: "能接就接，但会算投入产出比。", value: 2 },
        { label: "消息还没公开，导师已经在路上了。", value: 3 }
      ]
    },
    {
      id: "q19",
      dim: "T1",
      text: "你卡住一周没进展，导师更可能：",
      options: [
        { label: "拉你一起拆问题，像手把手捞人。", value: 1 },
        { label: "给几条建议，然后让你自己去跑。", value: 2 },
        { label: "说“你先自己想想”，然后消失在宇宙里。", value: 3 }
      ]
    },
    {
      id: "q20",
      dim: "T1",
      text: "导师带学生的整体方式更像：",
      options: [
        { label: "教练模式，连姿势都想帮你摆正。", value: 1 },
        { label: "前期扶，后期放，节奏比较均衡。", value: 2 },
        { label: "野外生存训练营，活下来就算出师。", value: 3 }
      ]
    },
    {
      id: "q21",
      dim: "T2",
      text: "项目翻车或被合作方质疑时，导师更可能：",
      options: [
        { label: "先问你怎么回事，锅的方向比较明确。", value: 1 },
        { label: "对外缓一缓，对内再复盘。", value: 2 },
        { label: "先把锅拦住，关起门来再一起修。", value: 3 }
      ]
    },
    {
      id: "q22",
      dim: "T2",
      text: "投稿被怼时，导师对学生的态度通常：",
      options: [
        { label: "你自己先改，我随后看看。", value: 1 },
        { label: "我帮你捋回复思路，别慌。", value: 2 },
        { label: "审稿意见先给我，我来当第一层防爆墙。", value: 3 }
      ]
    },
    {
      id: "q23",
      dim: "T3",
      text: "你进导师办公室前，最像在做什么：",
      options: [
        { label: "正常汇报，心率基本平稳。", value: 1 },
        { label: "先观察一下今日气压，再决定怎么开口。", value: 2 },
        { label: "抽卡，看今天是晴天、阴天还是雷暴。", value: 3 }
      ]
    },
    {
      id: "q24",
      dim: "T3",
      text: "同一件事导师前后给出的反馈，通常：",
      options: [
        { label: "比较稳定，口径不会乱跳。", value: 1 },
        { label: "忙炸的时候会明显变急一点。", value: 2 },
        { label: "昨天夸、今天改口，像实时行情。", value: 3 }
      ]
    },
    {
      id: "q25",
      dim: "L1",
      text: "报差旅、买设备、付版面费时，导师风格更像：",
      options: [
        { label: "能省则省，预算表里都能闻到紧张感。", value: 1 },
        { label: "合理就批，但不会乱开闸。", value: 2 },
        { label: "该花就花，别让小钱拖死项目。", value: 3 }
      ]
    },
    {
      id: "q26",
      dim: "L1",
      text: "你对课题组整体资源条件的感受更像：",
      options: [
        { label: "贫穷但顽强，大家靠意志力维持科研。", value: 1 },
        { label: "够用，但很多资源要排队。", value: 2 },
        { label: "富得不像学生项目，偶尔怀疑自己误入工业界。", value: 3 }
      ]
    },
    {
      id: "q27",
      dim: "L2",
      text: "导师最近最常出现的位置是：",
      options: [
        { label: "办公室或实验室，实体化率较高。", value: 1 },
        { label: "会议和办公室两头跑，偶尔刷到真人。", value: 2 },
        { label: "机场、评审会、别的城市。", value: 3 }
      ]
    },
    {
      id: "q28",
      dim: "L2",
      text: "你和导师线下完整聊一次天的难度，大概是：",
      options: [
        { label: "随时能约，至少还算现实存在。", value: 1 },
        { label: "得精准卡时间，错过就下次再说。", value: 2 },
        { label: "像抢演唱会门票，靠运气和师兄师姐通风报信。", value: 3 }
      ]
    },
    {
      id: "q29",
      dim: "L3",
      text: "导师发消息的时间带通常是：",
      options: [
        { label: "基本工作时间，不拿深夜做办公桌。", value: 1 },
        { label: "忙起来会打破边界，但平时还算克制。", value: 2 },
        { label: "周末深夜和清晨都可能看到“在吗”。", value: 3 }
      ]
    },
    {
      id: "q30",
      dim: "L3",
      text: "当你请假或明确休息时，导师通常：",
      options: [
        { label: "尊重节奏，真急事也会先说明。", value: 1 },
        { label: "关键节点会找你一下，但不至于全天追杀。", value: 2 },
        { label: "休息可以，但最好带着电脑和良心。", value: 3 }
      ]
    }
  ];

  const specialQuestions = [
    {
      id: "ghost_gate_q1",
      special: true,
      kind: "ghost_gate",
      text: "如果让你用一个场景描述导师最近的存在感，你会选：",
      options: [
        { label: "办公室偶遇率还行，至少不是都市传说。", value: 1 },
        { label: "在会里能看到人，线下接触主要靠预约。", value: 2 },
        { label: "朋友圈定位永远在机场、酒店或会议中心。", value: 3 },
        { label: "我主要通过传说和师兄师姐认识导师。", value: 4 }
      ]
    },
    {
      id: "ghost_gate_q2",
      special: true,
      kind: "ghost_trigger",
      text: "你上一次和导师单独聊超过 10 分钟，大概是什么时候？",
      options: [
        { label: "最近一个月内，真人还算能捕捉到。", value: 1 },
        { label: "已经记不清了，我和导师更像校友。", value: 2 }
      ]
    }
  ];

  const typeLibrary = {
    KING: {
      code: "KING",
      cn: "王者导师",
      intro: "资源、判断力、保护欲和边界感都在线，像稀有卡。",
      desc: "你抽到的是导师界天花板样本。TA 既能给方向，也愿意给资源；既能把关质量，也不至于把学生当遥控器。关键时刻会顶在前面，平时又知道留出成长空间。最可怕的是，这种导师通常还不怎么乱发脾气，所以会让人怀疑自己是不是在做梦。",
      rarity: "legendary"
    },
    CTRL: {
      code: "CTRL",
      cn: "微操总监",
      intro: "你的论文不是你在写，是你和导师共同操控鼠标在写。",
      desc: "CTRL 型导师对细节有近乎本能的控制欲。题目、图表、字号、注释、语气，哪怕是一个不顺眼的空格都可能被点名。好处是论文质量通常不会太离谱，坏处是你有时会分不清自己到底是学生还是导师的外设。TA 不一定凶，但一定会让你理解什么叫全链路介入。",
      rarity: "rare"
    },
    KPIX: {
      code: "KPIX",
      cn: "KPI 永动机",
      intro: "昨天的目标是目标，今天的目标是再加一个目标。",
      desc: "KPIX 型导师的大脑里常驻一块永不熄灭的进度看板。TA 对推进速度的执念高到离谱，似乎每个学期都要活出创业公司冲 A 轮的节奏。你刚完成一件事，新的里程碑已经在路上。不是说 TA 不关心你，而是 TA 真心觉得年轻人的上限应该比 deadline 更高。",
      rarity: "rare"
    },
    CAKE: {
      code: "CAKE",
      cn: "画饼仙人",
      intro: "你只是跑通了 baseline，导师已经看见封面故事了。",
      desc: "CAKE 型导师的语言系统自带放大镜和投影仪。一个小结果到了 TA 嘴里，能被讲成赛道拐点、领域机会和未来招牌方向。你很难判断这是战略视野还是情绪价值，但不可否认，很多人就是靠这口饼续到了投稿。唯一的问题是，饼太大时，学生得自己负责胃口。",
      rarity: "rare"
    },
    CASH: {
      code: "CASH",
      cn: "经费喷泉",
      intro: "别人愁预算，TA 愁的是钱怎么分配才不会太离谱。",
      desc: "CASH 型导师最可怕的地方，不是有钱，而是会弄钱。项目、合作、设备、差旅、版面费，TA 像知道所有资源入口的隐藏坐标。你会发现组里总能在关键时刻拿到新机会，像有人在科研地图上开了透视。跟着这种导师做事，最大的风险不是没钱，而是机会太多你忙不过来。",
      rarity: "epic"
    },
    CAMP: {
      code: "CAMP",
      cn: "组会军官",
      intro: "每周都有汇报，每次汇报都像点名。",
      desc: "CAMP 型导师把会议当成科研推进的第一生产力。TA 的世界里没有“有空再聊”，只有“你现在方便打开一下 PPT 吗”。组会节奏严整得像军训，临时小会出现得像随机抽查。好消息是，进度很难彻底烂尾；坏消息是，你会逐渐学会在茶水间里用三分钟讲清楚整个项目。",
      rarity: "rare"
    },
    FARM: {
      code: "FARM",
      cn: "放养宗师",
      intro: "真正贯彻“放手让学生成长”，也可能顺手把学生放进野外。",
      desc: "FARM 型导师对独立性的理解相当彻底。TA 会默认你是一个能自己解决问题的成熟研究者，哪怕你显然还在找文献入口。平时很少盯过程，更不爱频繁 check 进度。优点是自由，缺点是自由过量后会带来一种近似失重的孤独感。",
      rarity: "common"
    },
    NICE: {
      code: "NICE",
      cn: "情绪价值机",
      intro: "能把“这里要重做”说得像“你完全有希望”。",
      desc: "NICE 型导师是那种不靠糖衣炮弹、但确实会让学生觉得自己还有救的人。TA 不会放弃标准，但会把反馈说到人能听进去的程度。汇报翻车时不会先把你拍进地里，反而可能先帮你找回一点脑子。跟这种导师做事，最大的副作用是你容易误以为学术圈是个温柔行业。",
      rarity: "rare"
    },
    SHLD: {
      code: "SHLD",
      cn: "护崽骑士",
      intro: "对外先挡枪，对内再复盘，学生不是一次性消耗品。",
      desc: "SHLD 型导师对学生有明确的保护意识。合作出问题、投稿被怼、外部压力砸下来时，TA 往往会先站到前面，而不是第一时间把锅精准空投给学生。等局面稳住，才会回来一起拆问题。跟这种导师相处久了，你会第一次体会到“导师和老板不是一回事”。",
      rarity: "epic"
    },
    VOLC: {
      code: "VOLC",
      cn: "火山天气",
      intro: "今天夸你天赋异禀，明天骂你为什么还没改完。",
      desc: "VOLC 型导师的问题不一定是标准，而是气压。TA 可能真有能力，也可能真能带出结果，但情绪像实时天气，稳定性全靠运气。你在门口深呼吸的次数会明显增加，学会通过脚步声和语速判断今日风险等级。久而久之，你可能比做实验更擅长做气象预报。",
      rarity: "uncommon"
    },
    PING: {
      code: "PING",
      cn: "秒回战神",
      intro: "你的消息刚发出去，对面已经开始回第三条了。",
      desc: "PING 型导师让人分不清 TA 是高效，还是根本不睡。消息、文档、想法、临时疑问，TA 都能用一种几乎即时的速度处理掉。效率高得让学生很有安全感，也很容易顺手把你的拖延症衬成犯罪证据。唯一的问题是，秒回型导师往往也会默认你同样在线。",
      rarity: "uncommon"
    },
    SWAN: {
      code: "SWAN",
      cn: "仙鹤点拨者",
      intro: "平时少见，一开口就戳中问题核心。",
      desc: "SWAN 型导师的存在感不是靠频率，而是靠命中率。TA 不一定常驻，也不一定爱事无巨细跟进，但偶尔出现的那几句点评往往比你一周的自我挣扎还有效。TA 像那种不爱多说、却总能把事情点透的人。学生对 TA 最大的抱怨，通常不是意见差，而是见面机会太少。",
      rarity: "uncommon"
    },
    MOSS: {
      code: "MOSS",
      cn: "稳健老派",
      intro: "不追风口，不讲神话，主打一个扎扎实实别翻车。",
      desc: "MOSS 型导师对科研的理解非常传统，也非常稳。TA 更愿意押成熟路线、可靠结果和能站住脚的故事，而不是一把梭哈新赛道。你可能很少从 TA 那里听到“颠覆性”这种词，但翻车率通常也比较低。适合想稳稳毕业的人，不太适合想一夜爆红的人。",
      rarity: "uncommon"
    },
    RISK: {
      code: "RISK",
      cn: "赛道赌徒",
      intro: "保守路线只配当备胎，真正的乐趣在未知里。",
      desc: "RISK 型导师对高风险方向有天然好感。越是新、越是没验证、越是别人不敢碰，TA 越像看到了机会。跟着这种导师会很刺激，你会感觉自己不是在做课题，而是在押时代趋势。好消息是一旦中了会非常亮，坏消息是如果没中，你会在一堆试验尸体里学到人生。",
      rarity: "epic"
    },
    HOST: {
      code: "HOST",
      cn: "合作发动机",
      intro: "在 TA 的世界里，学术成果的一半来自人，一半来自连人。",
      desc: "HOST 型导师深信合作是科研的倍增器。TA 的通讯录、会议胸牌和临时饭局都可能直接变成项目、数据或共同作者。你很难在组里长期闭门造车，因为 TA 总能把外部资源接进来。跟着这种导师最大的技能提升，可能不是方法本身，而是你终于学会如何和陌生学者自然地说第一句话。",
      rarity: "rare"
    },
    SPIN: {
      code: "SPIN",
      cn: "包装大师",
      intro: "普通结果到 TA 手里，都能被讲出一个高级故事。",
      desc: "SPIN 型导师特别擅长把东西讲好。TA 未必造得出最炸的结果，但很会找到叙事角度、亮点顺序和表达姿势。你有时候甚至会怀疑，是实验本身一般，还是自己以前根本不会包装。跟着这类导师写论文，会明显学会什么叫“同样的数据，不同的命”。",
      rarity: "uncommon"
    },
    JURY: {
      code: "JURY",
      cn: "评审附体",
      intro: "TA 看自己学生稿子的眼神，像看匿名投稿。",
      desc: "JURY 型导师的脑内常驻审稿人格。每个逻辑漏洞、每个图表弱点、每个 Related Work 缺口，都很难逃过 TA 的眼睛。学生在 TA 手下写稿通常会提前经历一次残酷内审，所以投稿质量往往不差。只是这个过程不太像被指导，更像被提前审判。",
      rarity: "uncommon"
    },
    OTTO: {
      code: "OTTO",
      cn: "周末召唤师",
      intro: "边界感这种东西，在 TA 看来像选修课。",
      desc: "OTTO 型导师并不一定恶意压榨，TA 只是默认科研是全天候系统。周末、深夜、假期、早晨，只要想到事，就会自然地发消息。TA 可能觉得自己只是在高效沟通，但学生通常会感觉人生处于持续待机状态。跟久了之后，你的静音和免打扰设置会进化得很彻底。",
      rarity: "uncommon"
    },
    NANNY: {
      code: "NANNY",
      cn: "保姆型导师",
      intro: "会提醒你吃饭、交表、改格式，甚至顺便担心你睡没睡。",
      desc: "NANNY 型导师的照顾是全流程的。TA 不只是关心你课题做得怎么样，还会顺手关心你汇报模板、毕业节点、参考文献格式和身体状态。你在 TA 手下很少会彻底迷路，因为关键路标会有人帮你插好。代价是自主性不一定拉满，但安全感通常够高。",
      rarity: "uncommon"
    },
    MUTE: {
      code: "MUTE",
      cn: "已读不回体",
      intro: "你和导师之间隔着消息、缘分，以及若干位师兄师姐。",
      desc: "MUTE 型导师不一定坏，可能只是忙，也可能只是天然低频。问题在于，对学生来说这种低频会被放大成不确定感。你发出去的消息像漂流瓶，文档像扔进黑洞，反馈周期以“再等等”计。久而久之，学生会学会一门新学问：如何在没有指导的前提下自己维持项目不塌。",
      rarity: "common"
    },
    PILOT: {
      code: "PILOT",
      cn: "放权机长",
      intro: "给你航线、给你跑道，起飞以后别总回头问。",
      desc: "PILOT 型导师很擅长给方向感，但不爱微操。TA 会把大框架、资源边界和判断标准说清楚，然后把驾驶杆交还给学生。关键时刻能兜住，平时不抢你对项目的所有权。跟着这种导师成长很快，前提是你真的愿意握住自己的方向盘。",
      rarity: "epic"
    },
    CLOCK: {
      code: "CLOCK",
      cn: "时间折叠师",
      intro: "甘特图不是工具，是 TA 的世界观。",
      desc: "CLOCK 型导师对时间管理有执念。每个项目都应该有节点，每个节点都应该有人推进，每次推进都应该可见。TA 喜欢让一切处于可追踪状态，所以跟进、会议和回顾都比较规律。学生在这种组里待久了，通常会自动学会怎么把混乱压成表格。",
      rarity: "uncommon"
    },
    BUDD: {
      code: "BUDD",
      cn: "佛系主任",
      intro: "别把人生过成 reviewer comment，这是 TA 的隐性管理哲学。",
      desc: "BUDD 型导师整体气质很松弛。TA 不怎么乱催，不怎么深夜追命，也不觉得每个学生都必须活成学术劳模。标准未必低，但态度通常柔和，节奏也更像慢炖而不是爆炒。适合想保住精神状态的人，不太适合急需外力强推的人。",
      rarity: "common"
    },
    ADMIN: {
      code: "ADMIN",
      cn: "行政超导体",
      intro: "你以为你有导师，其实你有一位副院长在兼职带组。",
      desc: "ADMIN 型导师经常处于多线程行政模式。TA 有资源、有判断，也确实想带学生，但现实里永远有会议、签字、评审和各种无法推掉的杂事。于是学生得到的是一种很有含金量、但不怎么稳定的指导。你会逐渐理解：导师不是不回你，只是 TA 的日历已经像一块被打满补丁的操作系统。",
      rarity: "rare"
    },
    GHOST: {
      code: "GHOST",
      cn: "量子导师",
      intro: "你知道 TA 存在，因为邮件抄送、报销签字和论文致谢里有名字。",
      desc: "恭喜你触发了 MPTI 的隐藏人格。量子导师的特点是：你无法稳定观测到 TA，但系统坚称 TA 一直存在。导师可能常年在会场、机场、评审会和别的城市之间跃迁，和学生的关系主要靠邮件、传话和运气维持。严格来说你不是没有导师，你只是拥有了一位高能粒子级别的导师。",
      rarity: "hidden"
    },
    404: {
      code: "404",
      cn: "查无此导",
      intro: "你的导师同时像很多种导师，又不像任何一种。",
      desc: "系统试图把你的导师塞进标准人格库，但失败了。TA 可能上午像佛系主任，中午像微操总监，下午像画饼仙人，晚上又切成周末召唤师。总之这个人设稳定性太差，或者太独特，以至于现有模板集体宕机。恭喜，你成功把一个分类系统逼到了蓝屏边缘。",
      rarity: "hidden"
    }
  };

  const normalTypes = [
    { code: "KING", pattern: "MHM-MHM-MHH-MHL-HMH" },
    { code: "CTRL", pattern: "HHH-HLM-LHM-LMM-MML" },
    { code: "KPIX", pattern: "MHH-HLH-MHH-MLM-HML" },
    { code: "CAKE", pattern: "MMM-MHH-HHM-HML-MMH" },
    { code: "CASH", pattern: "MHM-MMH-MHH-MHM-HMM" },
    { code: "CAMP", pattern: "HHH-MML-LMM-LMM-MLL" },
    { code: "FARM", pattern: "LLL-LML-MLL-HLL-LMH" },
    { code: "NICE", pattern: "LMM-HHM-MMM-MHL-MLH" },
    { code: "SHLD", pattern: "MMM-MHL-LMM-MHL-MLH" },
    { code: "VOLC", pattern: "HHH-MLM-MHM-LLH-MLL" },
    { code: "PING", pattern: "MMM-HML-MMM-MML-MLM" },
    { code: "SWAN", pattern: "LML-LHM-MMM-HML-MHH" },
    { code: "MOSS", pattern: "MMM-MML-LLM-MML-MLM" },
    { code: "RISK", pattern: "MHM-MMH-HHM-HMM-MML" },
    { code: "HOST", pattern: "MHM-HHM-MMH-MHM-HMM" },
    { code: "SPIN", pattern: "MHM-MMH-MHH-MMM-MMM" },
    { code: "JURY", pattern: "HMM-MLL-LLM-MLL-MLM" },
    { code: "OTTO", pattern: "MHM-HMM-MMM-MMM-MLL" },
    { code: "NANNY", pattern: "MMM-HHL-LMM-LHL-MLM" },
    { code: "MUTE", pattern: "LLL-LLL-LLL-HLL-LHH" },
    { code: "PILOT", pattern: "LHL-MMM-MHH-HHL-HMH" },
    { code: "CLOCK", pattern: "HMH-HML-LMM-LML-MLM" },
    { code: "BUDD", pattern: "LLL-MML-LLL-HML-MMH" },
    { code: "ADMIN", pattern: "MHL-LLH-MHH-HLM-HHL" }
  ];

  const dimExplanations = {
    G1: {
      L: "TA 主打一个相信学生，除非你主动求助，不然默认你还能活。",
      M: "关键节点会抓，但不至于连你图题字号都想远程接管。",
      H: "控制欲拉满，从课题结构到段落语气都想过目。"
    },
    G2: {
      L: "目标设置偏保守，先稳住别炸，比口号更看重可持续。",
      M: "该催会催，节奏有压力但还没到创业冲刺级别。",
      H: "TA 的目标密度常让人怀疑一年是不是有 18 个月。"
    },
    G3: {
      L: "会议不算多，存在感主要靠关键时刻现身。",
      M: "周更或双周更，属于正常科研社会的常规气候。",
      H: "组会和站会密到像在过军事化学术生活。"
    },
    C1: {
      L: "消息反馈靠缘分，学生需要学会自给自足。",
      M: "大体可联系，但速度明显取决于导师当天的行程和状态。",
      H: "回复快到让你不敢随便敲“老师方便吗”。"
    },
    C2: {
      L: "反馈风格更像冷静审稿，不太负责照顾你的情绪。",
      M: "问题归问题，沟通还算像正常人对话。",
      H: "就算批评也有温度，学生通常还能保住一点自尊离场。"
    },
    C3: {
      L: "很少乱画大饼，TA 讲未来通常比你想得还务实。",
      M: "会适度鼓励，也会给愿景，但不至于动不动改变世界。",
      H: "饼感浓烈，一个 baseline 都能通往宏大叙事。"
    },
    A1: {
      L: "更偏爱成熟路线，安全和可控优先于冒险和传奇。",
      M: "会做探索，但通常会留后手，不把所有人绑上同一条船。",
      H: "越新越想碰，越险越兴奋，主打一个赛道赌博。"
    },
    A2: {
      L: "更在意扎实、逻辑和可复现，亮点够用就行。",
      M: "既想稳，也想有一个别人记得住的亮点。",
      H: "没有爆点就难满意，结果最好一眼就能震住人。"
    },
    A3: {
      L: "资源意识偏弱，很多机会要靠学生自己闻到味道。",
      M: "知道怎么申请和谈合作，但不会时时刻刻都在追资源。",
      H: "资源路子极广，机会总能比公开通知更早一步抵达。"
    },
    T1: {
      L: "属于手把手型带法，学生不太容易彻底迷路。",
      M: "前期扶着走，后期逐步放手，属于较平衡的培养方式。",
      H: "放养程度高，学生成长速度和迷失概率都会同步上升。"
    },
    T2: {
      L: "出事时学生更容易被直接推到第一责任位。",
      M: "会看情况协调，不算完全护短，也不算彻底甩锅。",
      H: "关键时刻护学生的意愿很强，先稳住外部再内部处理。"
    },
    T3: {
      L: "情绪天气比较稳定，学生汇报前心率通常还能控制住。",
      M: "忙起来会有气压变化，但大体还能预测。",
      H: "反馈波动明显，今天晴天明天雷暴都很正常。"
    },
    L1: {
      L: "组里预算感偏紧，很多事要先算能不能活。",
      M: "资源基本够用，但每一笔钱还是得讲合理性。",
      H: "经费手感松，关键投入通常不会被小钱卡死。"
    },
    L2: {
      L: "导师实体化概率较高，办公室还能稳定刷到本人。",
      M: "时隐时现，想见面需要一点调度能力。",
      H: "神隐属性明显，导师位置共享长期显示在路上。"
    },
    L3: {
      L: "边界感偏弱，周末和深夜都可能突然被点名。",
      M: "忙的时候会打破边界，但平时尚能维持体面。",
      H: "相对尊重学生节奏，知道不是每条消息都要立刻回。"
    }
  };

  const dimensionOrder = ["G1", "G2", "G3", "C1", "C2", "C3", "A1", "A2", "A3", "T1", "T2", "T3", "L1", "L2", "L3"];

  const rarityMeta = {
    legendary: { label: "传说", color: "#f59e0b", order: 0 },
    epic: { label: "史诗", color: "#a855f7", order: 1 },
    rare: { label: "稀有", color: "#3b82f6", order: 2 },
    uncommon: { label: "优秀", color: "#22c55e", order: 3 },
    common: { label: "普通", color: "#6b7280", order: 4 },
    hidden: { label: "隐藏", color: "#ef4444", order: 5 }
  };

  const specialLogic = {
    gateQuestionId: "ghost_gate_q1",
    insertQuestionId: "ghost_gate_q2",
    gateValues: [3, 4],
    triggerQuestionId: "ghost_gate_q2",
    triggerValue: 2,
    hiddenTypeCode: "GHOST"
  };

  Object.values(typeLibrary).forEach((type) => {
    type.image = `./images/${type.code}/${type.code}.webp`;
  });

  window.MPTI_DATA = {
    appName: "MPTI",
    appFullName: "Mentor Personality Type Indicator",
    dimensionMeta,
    questions,
    specialQuestions,
    typeLibrary,
    normalTypes,
    dimExplanations,
    dimensionOrder,
    rarityMeta,
    specialLogic
  };
})();
