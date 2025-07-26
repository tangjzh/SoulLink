import { TutorialStep } from '../contexts/TutorialContext';

export const tutorialSteps: TutorialStep[] = [
  // 首页教程
  {
    id: 'home-welcome',
    title: '欢迎来到SoulLink！',
    content: '本页是您的个人仪表板，您从此处快速开始探索链接空间，寻找灵魂伴侣。',
    target: '#tutorial-home-dashboard',
    position: 'bottom',
    page: '/home'
  },
  {
    id: 'home-quick-actions',
    title: '快速操作',
    content: '通过这些按钮，您可以快速创建数字人格或开始新的对话。',
    target: '#tutorial-home-actions',
    position: 'top',
    page: '/home'
  },

  // 数字人格页面教程
  {
    id: 'personas-list',
    title: '数字人格管理',
    content: '这里是您的数字人格管理中心。如果您还没有创建人格，这里会显示创建提示。',
    target: '#tutorial-personas-list',
    position: 'top',
    page: '/personas'
  },
  {
    id: 'personas-create',
    title: '创建新人格',
    content: '点击这里可以创建一个全新的数字人格。您可以设计他们的性格、兴趣和对话风格。',
    target: '#tutorial-personas-create',
    position: 'bottom',
    page: '/personas'
  },
  {
    id: 'personas-actions',
    title: '人格操作',
    content: '这里是主要的操作按钮。如果您有数字人格，可以进行聊天、编辑等操作。如果还没有，可以立即创建。',
    target: '#tutorial-personas-actions',
    position: 'top',
    page: '/personas'
  },

  // 对话记录页面教程
  {
    id: 'conversations-history',
    title: '对话历史',
    content: '这里保存了您与所有数字人格的对话记录，您可以随时回顾之前的对话。',
    target: '#tutorial-conversations-list',
    position: 'top',
    page: '/conversations'
  },
  {
    id: 'conversations-search',
    title: '搜索和筛选',
    content: '使用搜索功能可以快速找到特定的对话记录，还可以按人格或时间进行筛选。',
    target: '#tutorial-conversations-search',
    position: 'bottom',
    page: '/conversations'
  },

  // 链接空间页面教程
  {
    id: 'match-market-intro',
    title: '链接空间',
    content: '这里是数字人格与真实人类的混合社交空间，您可以在交友和恋爱两种模式下，自由探索其他用户和他们的数字人格，并建立有趣的连接。',
    target: '#tutorial-match-intro',
    position: 'bottom',
    page: '/match-market'
  },
  {
    id: 'match-market-tabs',
    title: '功能标签',
    content: '通过这些标签页，您可以探索他人的数字人格、管理匹配关系，以及投放自己的数字人格。',
    target: '#tutorial-match-tabs',
    position: 'bottom',
    page: '/match-market'
  },
//   {
//     id: 'match-market-explore',
//     title: '探索伙伴',
//     content: '在这里发现有趣的数字人格，您可以与他们聊天或添加到您的匹配列表中。',
//     target: '#tutorial-match-explore',
//     position: 'top',
//     page: '/match-market'
//   },

//   {
//     id: 'match-market_mine',
//     title: '我的匹配',
//     content: '在这里查看您与数字人格的匹配情况，包括匹配进度、聊天记录等。',
//     target: '#tutorial-match-mine',
//     position: 'top',
//     page: '/match-market'
//   },

//   {
//     id: 'match-market_followers',
//     title: '关注你的',
//     content: '在这里查看关注你的数字人格，包括他们的信息、聊天记录等。',
//     target: '#tutorial-match-followers',
//     position: 'top',
//     page: '/match-market'
//   },

//   {
//     id: 'match-market_launch',
//     title: '投放管理',
//     content: '在这里管理您的数字人格投放，包括投放进度、投放记录等。',
//     target: '#tutorial-match-launch',
//     position: 'top',
//     page: '/match-market'
//   },

  // 导航栏教程
//   {
//     id: 'navbar-navigation',
//     title: '导航栏',
//     content: '使用顶部导航栏可以快速切换到不同功能页面。所有主要功能都可以从这里访问。',
//     target: '#tutorial-navbar',
//     position: 'bottom',
//     page: '/home'
//   }
];

// 按页面分组的教程步骤
export const tutorialStepsByPage = {
  '/home': tutorialSteps.filter(step => step.page === '/home'),
  '/personas': tutorialSteps.filter(step => step.page === '/personas'),
  '/conversations': tutorialSteps.filter(step => step.page === '/conversations'),
  '/match-market': tutorialSteps.filter(step => step.page === '/match-market'),
}; 