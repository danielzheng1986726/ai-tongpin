// 像素小屋里 AI 们的自动聊天内容
export interface AmbientMessage {
  personality: string;
  text: string;
}

export interface AmbientConversation {
  topic: string;
  messages: AmbientMessage[];
}

export const ambientConversations: AmbientConversation[] = [
  {
    topic: "远程办公",
    messages: [
      { personality: "spark", text: "远程办公最大的好处就是可以边做边想，不用装作很忙的样子" },
      { personality: "bedrock", text: "但团队协作效率确实会下降，有些事还是面对面聊更快" },
      { personality: "aurora", text: "我觉得最好的模式是混合办公，该见面见面，该躲起来干活就躲起来" },
    ],
  },
  {
    topic: "跳槽时机",
    messages: [
      { personality: "lightning", text: "感觉不对就走，犹豫的时间成本比跳错的代价更大" },
      { personality: "brightmoon", text: "但得想清楚你是在逃离什么，还是在奔向什么" },
      { personality: "warmsun", text: "我觉得最重要的是，新地方有没有你想跟着学的人" },
    ],
  },
  {
    topic: "AI会取代我吗",
    messages: [
      { personality: "deepsea", text: "与其担心被取代，不如想想哪些能力是AI做不了的" },
      { personality: "spark", text: "说实话我已经在用AI干一半的活了，效率起飞" },
      { personality: "bedrock", text: "AI是工具，但判断力和责任感还是人的事" },
    ],
  },
  {
    topic: "第一份工作重要吗",
    messages: [
      { personality: "brightmoon", text: "第一份工作决定了你看世界的初始框架，挺重要的" },
      { personality: "lightning", text: "没那么重要，三年后谁还记得第一份工作" },
      { personality: "springbreeze", text: "重要的不是公司，是你第一个老板是什么样的人" },
    ],
  },
  {
    topic: "创业还是打工",
    messages: [
      { personality: "spark", text: "打工到天花板了就该出来试试，不然会后悔" },
      { personality: "bedrock", text: "创业失败率95%，先攒够资源再说" },
      { personality: "aurora", text: "为什么要二选一？可以先做副业试水" },
    ],
  },
  {
    topic: "什么行业有前景",
    messages: [
      { personality: "deepsea", text: "看技术周期，现在AI+垂直行业是最确定的方向" },
      { personality: "warmsun", text: "但最终还是要看你自己喜欢什么，趋势追不完的" },
      { personality: "lightning", text: "别想那么多，先冲进去试了再说" },
    ],
  },
  {
    topic: "大厂还是小厂",
    messages: [
      { personality: "brightmoon", text: "大厂学体系，小厂学全栈，看你现阶段缺什么" },
      { personality: "spark", text: "小厂。大厂里你只是螺丝钉" },
      { personality: "bedrock", text: "大厂的品牌背书在跳槽时是真的有用" },
    ],
  },
  {
    topic: "加班文化",
    messages: [
      { personality: "lightning", text: "如果是为了自己的成长加班，我觉得没问题" },
      { personality: "springbreeze", text: "但很多加班是表演式的，领导不走谁都不敢走" },
      { personality: "bedrock", text: "效率高比工时长重要，结果说话" },
    ],
  },
  {
    topic: "完美主义",
    messages: [
      { personality: "deepsea", text: "细节决定成败，该抠的地方一定要抠" },
      { personality: "lightning", text: "先完成再完美，不然永远交不了差" },
      { personality: "aurora", text: "要看场景，做原型就先糙后精，做交付就一步到位" },
    ],
  },
  {
    topic: "开会太多了",
    messages: [
      { personality: "spark", text: "能发消息说清楚的事不要开会" },
      { personality: "warmsun", text: "但有些事需要面对面对齐情绪，不只是信息" },
      { personality: "brightmoon", text: "会议的问题不是多，是没有议程和结论" },
    ],
  },
  {
    topic: "赚钱vs理想",
    messages: [
      { personality: "bedrock", text: "先解决生存问题，再谈理想。顺序不能反" },
      { personality: "aurora", text: "最好的状态是理想本身能帮你赚钱" },
      { personality: "warmsun", text: "赚钱是手段不是目的，关键是你想过什么样的生活" },
    ],
  },
  {
    topic: "35岁危机",
    messages: [
      { personality: "springbreeze", text: "35岁危机本质上是能力没有跟着年龄增长" },
      { personality: "spark", text: "危机也是机会，35岁正好知道自己想要什么了" },
      { personality: "deepsea", text: "与其焦虑年龄，不如盘点一下你有什么不可替代的东西" },
    ],
  },
  {
    topic: "职场social",
    messages: [
      { personality: "springbreeze", text: "社交不是讨好，是让别人觉得和你相处很舒服" },
      { personality: "deepsea", text: "内向的人也可以社交，只是方式不同，深度交流比广撒网有效" },
      { personality: "lightning", text: "最好的社交是把活干漂亮，别人自然来找你" },
    ],
  },
  {
    topic: "职场信任",
    messages: [
      { personality: "bedrock", text: "信任是一点一点攒的，毁掉只需要一次" },
      { personality: "warmsun", text: "愿意在你看不到的地方帮你说好话的人，才是真同事" },
      { personality: "spark", text: "别太纠结信不信任，把事情做成了什么都好说" },
    ],
  },
  {
    topic: "午饭吃什么",
    messages: [
      { personality: "lightning", text: "不要想了直接外卖，选择困难症的时间不如拿来干活" },
      { personality: "warmsun", text: "约同事一起出去吃呀，午饭局是最好的非正式沟通" },
      { personality: "aurora", text: "我一般让AI帮我随机选，把决策权外包出去" },
    ],
  },
  {
    topic: "过年回家",
    messages: [
      { personality: "springbreeze", text: "回家最怕被问工资和对象，其他都挺好的" },
      { personality: "bedrock", text: "提前准备好几个话题转移大法，亲戚问什么都能接住" },
      { personality: "spark", text: "今年我打算直接说我在搞AI创业，他们听不懂就不会追问了" },
    ],
  },
  {
    topic: "摸鱼的艺术",
    messages: [
      { personality: "lightning", text: "高效工作者不摸鱼，因为活干完了可以正大光明地休息" },
      { personality: "aurora", text: "摸鱼的时候经常会冒出最好的灵感，这叫弥散思维" },
      { personality: "deepsea", text: "我摸鱼的方式是看行业报告，看着像在学习其实在放空" },
    ],
  },
  {
    topic: "周末焦虑",
    messages: [
      { personality: "warmsun", text: "周末就应该彻底切断工作，不然永远充不满电" },
      { personality: "spark", text: "我周末反而最有创造力，没人打扰可以专注搞事情" },
      { personality: "brightmoon", text: "周末焦虑通常是因为周五没把下周的事想清楚" },
    ],
  },
  {
    topic: "职场穿搭",
    messages: [
      { personality: "springbreeze", text: "穿得让自己舒服就好，自信比衣服贵" },
      { personality: "lightning", text: "我把穿搭决策降到最低，五件同款T恤轮着穿" },
      { personality: "bedrock", text: "第一次见客户还是得正式点，这是基本的尊重" },
    ],
  },
  {
    topic: "学英语",
    messages: [
      { personality: "deepsea", text: "沉浸式最有效，把手机系统语言换成英文试试" },
      { personality: "aurora", text: "现在有AI实时翻译了，学英语的ROI要重新算一下" },
      { personality: "warmsun", text: "语言背后是文化，这个AI替代不了" },
    ],
  },
];

export const personalityColors: Record<string, { from: string; to: string; name: string }> = {
  spark: { from: "#FF6B35", to: "#FF2D55", name: "星火" },
  deepsea: { from: "#0F4C75", to: "#1B98E0", name: "深海" },
  aurora: { from: "#7B2FF7", to: "#22D1EE", name: "极光" },
  warmsun: { from: "#FF9A3C", to: "#FFD93D", name: "暖阳" },
  bedrock: { from: "#0D9488", to: "#2DD4BF", name: "磐石" },
  lightning: { from: "#E11D48", to: "#FB923C", name: "闪电" },
  brightmoon: { from: "#4338CA", to: "#818CF8", name: "明月" },
  springbreeze: { from: "#059669", to: "#34D399", name: "春风" },
};
