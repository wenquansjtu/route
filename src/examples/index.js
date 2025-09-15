#!/usr/bin/env node

/**
 * Cosmic Agent Network 示例运行器
 * 用于演示系统的各种功能
 */

import { runAllExamples } from './demonstrations.js';

async function main() {
  console.log('🚀 Cosmic Agent Network 示例程序启动\n');
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  console.log('📖 这个示例程序将演示以下功能:');
  console.log('  1. 基础Agent协作');
  console.log('  2. 语义扰动映射 (SPM)');
  console.log('  3. 张量协作力场 (TCF)');
  console.log('  4. 拓扑动态重构');
  console.log('  5. 复杂任务链管理');
  console.log('\n按 Ctrl+C 可随时终止运行\n');
  
  try {
    await runAllExamples();
  } catch (error) {
    console.error('\n❌ 程序执行失败:', error.message);
    process.exit(1);
  }
  
  console.log('\n✅ 示例程序执行完毕');
  console.log('💡 提示: 运行 `npm start` 启动Web界面体验完整功能');
}

function showHelp() {
  console.log(`
🌌 Cosmic Agent Network 示例程序

用法:
  node examples.js [选项]

选项:
  -h, --help     显示此帮助信息

功能演示:
  • 多Agent协作机制
  • 语义扰动传播
  • 张量力场计算
  • 网络拓扑重构
  • 任务链自动调度

更多信息请访问项目文档。
`);
}

// 优雅处理中断信号
process.on('SIGINT', () => {
  console.log('\n\n👋 程序被用户中断，正在清理...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 程序收到终止信号，正在退出...');
  process.exit(0);
});

// 捕获未处理的错误
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 未捕获的异常:', error);
  process.exit(1);
});

// 启动主程序
main();