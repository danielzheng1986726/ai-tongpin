export type PersonalityKey =
  | "spark"
  | "deepsea"
  | "aurora"
  | "warmsun"
  | "bedrock"
  | "lightning"
  | "brightmoon"
  | "springbreeze";

export interface PersonalityType {
  key: PersonalityKey;
  name: string;
  nameEn: string;
  quote: string;
  traits: string[];
  description: string;
  colors: {
    gradient: string;
    from: string;
    to: string;
    text: string;
  };
  bestPartners: PersonalityKey[];
  needAdjustment: PersonalityKey[];
  rarityText: string;
}

export const PERSONALITIES: Record<PersonalityKey, PersonalityType> = {
  spark: {
    key: "spark",
    name: "星火",
    nameEn: "Spark",
    quote: "最好的计划，就是先干起来",
    traits: ["行动派", "敢想敢做", "天生的破局者"],
    description:
      "你是团队里最先冲出去的那个人。当别人还在犹豫的时候，你已经在试错的路上了。你相信做比想更重要，速度比完美更关键。你的存在让团队永远不会陷入瘫痪式的讨论。",
    colors: {
      gradient: "linear-gradient(135deg, #FF6B35, #FF2D55)",
      from: "#FF6B35",
      to: "#FF2D55",
      text: "#FFFFFF",
    },
    bestPartners: ["bedrock", "deepsea"],
    needAdjustment: ["brightmoon"],
    rarityText: "仅 8.3% 的职场人拥有星火特质",
  },
  deepsea: {
    key: "deepsea",
    name: "深海",
    nameEn: "Deep Sea",
    quote: "别人看到表面，你看到结构",
    traits: ["深度思考", "专业主义", "细节控"],
    description:
      "你是那个能把问题拆到最底层的人。别人满足于知道 what，你一定要搞清楚 why。你的专业深度是团队最硬的底牌，你的判断力来自无数小时的积累。在你的领域，你就是最终解释权。",
    colors: {
      gradient: "linear-gradient(135deg, #0F4C75, #1B98E0)",
      from: "#0F4C75",
      to: "#1B98E0",
      text: "#FFFFFF",
    },
    bestPartners: ["spark", "springbreeze"],
    needAdjustment: ["lightning"],
    rarityText: "仅 11.2% 的职场人拥有深海特质",
  },
  aurora: {
    key: "aurora",
    name: "极光",
    nameEn: "Aurora",
    quote: "最有趣的事，发生在边界上",
    traits: ["跨界思维", "融合创新", "多面手"],
    description:
      "你不属于任何一个标签，这恰恰是你最大的优势。你能在技术和商业之间搭桥，在理性和感性之间游走。当所有人都在自己的领域里深挖时，你看到的是领域与领域之间的空白地带——那里藏着最大的机会。",
    colors: {
      gradient: "linear-gradient(135deg, #7B2FF7, #22D1EE)",
      from: "#7B2FF7",
      to: "#22D1EE",
      text: "#FFFFFF",
    },
    bestPartners: ["brightmoon", "warmsun"],
    needAdjustment: ["bedrock"],
    rarityText: "仅 9.7% 的职场人拥有极光特质",
  },
  warmsun: {
    key: "warmsun",
    name: "暖阳",
    nameEn: "Warm Sun",
    quote: "成就别人，就是成就自己",
    traits: ["天生leader", "赋能者", "团队粘合剂"],
    description:
      "你身上有一种让人安心的力量。被你带过的人都会成长得更快，被你待过的团队都会变得更好。你不是那种站在聚光灯下的领导者，你是那种让每个人都觉得自己被看见的人。这种能力比任何硬技能都稀缺。",
    colors: {
      gradient: "linear-gradient(135deg, #FF9A3C, #FFD93D)",
      from: "#FF9A3C",
      to: "#FFD93D",
      text: "#5C3D00",
    },
    bestPartners: ["lightning", "aurora"],
    needAdjustment: ["deepsea"],
    rarityText: "仅 7.1% 的职场人拥有暖阳特质",
  },
  bedrock: {
    key: "bedrock",
    name: "磐石",
    nameEn: "Bedrock",
    quote: "靠谱这件事，永远不会过时",
    traits: ["值得信赖", "稳如磐石", "长期主义者"],
    description:
      "你是所有人的安全感来源。Deadline 前你一定交付，承诺的事你一定做到。在这个充满不确定性的时代，你就是确定性本身。你不追风口，但你做的每一件事都经得起时间检验。聪明的领导者都知道，团队里最不能少的就是你。",
    colors: {
      gradient: "linear-gradient(135deg, #0D9488, #2DD4BF)",
      from: "#0D9488",
      to: "#2DD4BF",
      text: "#FFFFFF",
    },
    bestPartners: ["spark", "lightning"],
    needAdjustment: ["aurora"],
    rarityText: "仅 14.5% 的职场人拥有磐石特质",
  },
  lightning: {
    key: "lightning",
    name: "闪电",
    nameEn: "Lightning",
    quote: "速度本身就是一种战略",
    traits: ["极致效率", "结果导向", "雷厉风行"],
    description:
      "你的字典里没有「再等等」三个字。你相信天下武功唯快不破，在别人还在做 PPT 的时候你已经拿到了结果。你不是不思考，你是边跑边想、边做边调。在这个快鱼吃慢鱼的时代，你就是那条最快的鱼。",
    colors: {
      gradient: "linear-gradient(135deg, #E11D48, #FB923C)",
      from: "#E11D48",
      to: "#FB923C",
      text: "#FFFFFF",
    },
    bestPartners: ["warmsun", "bedrock"],
    needAdjustment: ["deepsea"],
    rarityText: "仅 10.8% 的职场人拥有闪电特质",
  },
  brightmoon: {
    key: "brightmoon",
    name: "明月",
    nameEn: "Bright Moon",
    quote: "慢一步想清楚，快十步走对路",
    traits: ["战略眼光", "全局思维", "高瞻远瞩"],
    description:
      "你是棋盘上看得最远的那个人。当团队陷入细节的泥潭时，你能拉大家回到全局视角。你的建议可能当时没人听，但三个月后所有人都会说「果然被你说中了」。你不急，因为你知道方向对了，速度自然会来。",
    colors: {
      gradient: "linear-gradient(135deg, #4338CA, #818CF8)",
      from: "#4338CA",
      to: "#818CF8",
      text: "#FFFFFF",
    },
    bestPartners: ["aurora", "deepsea"],
    needAdjustment: ["spark"],
    rarityText: "仅 12.6% 的职场人拥有明月特质",
  },
  springbreeze: {
    key: "springbreeze",
    name: "春风",
    nameEn: "Spring Breeze",
    quote: "最好的影响力，是让人感觉不到你在影响",
    traits: ["润物无声", "共情高手", "氛围营造者"],
    description:
      "你是团队里最被低估的超能力者。你不声不响地化解了无数潜在的冲突，你不经意的一句话让犹豫的人有了勇气。你不需要title来证明影响力，因为你的影响力写在每一个你待过的团队的氛围里。",
    colors: {
      gradient: "linear-gradient(135deg, #059669, #34D399)",
      from: "#059669",
      to: "#34D399",
      text: "#FFFFFF",
    },
    bestPartners: ["deepsea", "warmsun"],
    needAdjustment: ["lightning"],
    rarityText: "仅 15.8% 的职场人拥有春风特质",
  },
};

// Relationship quotes keyed by alphabetically sorted pair: "typeA-typeB"
const RELATIONSHIP_QUOTES: Record<string, string> = {
  // Cross-type pairs (28)
  "bedrock-spark": "一个点火，一个扎根，这是最互补的搭档",
  "deepsea-spark": "你负责冲锋，TA负责弹药，绝配",
  "brightmoon-spark": "一个想干就干，一个三思后行，磨合好了天下无敌",
  "aurora-brightmoon": "跨界的灵感遇上战略的眼光，能创造新物种",
  "lightning-warmsun": "一个赋能团队，一个冲刺结果，攻守兼备",
  "deepsea-springbreeze": "专业深度加上柔性沟通，最让人信服的组合",
  "aurora-bedrock": "稳定的基座上才能跳出最美的舞，互相成就",
  "deepsea-lightning": "快与深的碰撞，急需一个好的节奏调和",
  "springbreeze-warmsun": "双重温暖，团队幸福感爆表",
  "lightning-spark": "火上浇油型组合，速度拉满但记得踩刹车",
  "bedrock-brightmoon": "战略加执行，稳中求进的黄金组合",
  "aurora-warmsun": "创新的火花加上温暖的土壤，什么都能长出来",
  "aurora-spark": "两个不安分的灵魂碰撞，能量场直接爆表",
  "aurora-lightning": "跨界创新遇上极致效率，落地速度快到飞起",
  "aurora-springbreeze": "创意需要好的土壤，你们就是最佳温室组合",
  "aurora-deepsea": "广度遇上深度，互相补位的最佳拍档",
  "bedrock-deepsea": "两个靠谱的人在一起，信任感拉满",
  "bedrock-lightning": "一个稳一个快，节奏互补刚刚好",
  "bedrock-springbreeze": "安全感叠加，团队最坚固的后防线",
  "bedrock-warmsun": "可靠遇上温暖，最让人想跟随的组合",
  "brightmoon-deepsea": "战略高度加专业深度，洞察力无敌",
  "brightmoon-lightning": "看得远的人遇上跑得快的人，配合好了一骑绝尘",
  "brightmoon-springbreeze": "远见加上共情，最有格局的领导力组合",
  "brightmoon-warmsun": "战略温暖派，既能指路又能暖心",
  "deepsea-warmsun": "专业的冷静加温暖的关怀，最有说服力的组合",
  "lightning-springbreeze": "速度与温度的平衡，效率和氛围都在线",
  "spark-springbreeze": "破局者遇上润滑剂，开路加修路的黄金组合",
  "spark-warmsun": "一个冲锋一个赋能，互相成就的最佳搭档",

  // Same-type pairs (8)
  "spark-spark": "两团火碰一起，要么烧出新天地，要么把厨房炸了",
  "deepsea-deepsea": "两个技术宅凑一起，能聊到天亮但记得抬头看路",
  "aurora-aurora": "两个跨界选手相遇，世界线开始交叉",
  "warmsun-warmsun": "双倍温暖，治愈系梦之队",
  "bedrock-bedrock": "稳上加稳，但偶尔需要有人喊一声「冲！」",
  "lightning-lightning": "双倍速度，效率怪物，但谁来做文档？",
  "brightmoon-brightmoon": "神仙打棋，但记得最后要有人落子",
  "springbreeze-springbreeze": "氛围组天花板，但需要一个推进器",
};

export function getRelationshipQuote(
  typeA: PersonalityKey,
  typeB: PersonalityKey
): string {
  const sorted = [typeA, typeB].sort();
  const key = `${sorted[0]}-${sorted[1]}`;
  return (
    RELATIONSHIP_QUOTES[key] || "每一种组合都有无限可能"
  );
}

export const ALL_PERSONALITY_KEYS: PersonalityKey[] = [
  "spark",
  "deepsea",
  "aurora",
  "warmsun",
  "bedrock",
  "lightning",
  "brightmoon",
  "springbreeze",
];
