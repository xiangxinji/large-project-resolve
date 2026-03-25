import * as fs from 'fs';
import { SmartDependencyAnalyzer } from './analyzers/dependency-analyzer';

/**
 * 主程序入口
 * 初始化依赖分析器并执行分析
 */
(async () => {
  // 创建分析器，启用详细模式
  const analyzer = new SmartDependencyAnalyzer(undefined, {
    verbose: true,  // 启用详细输出，可以看到过滤信息
    ignoreNodeModules: true,  // 忽略 node_modules
    ignoreBuildDirs: true     // 忽略构建目录
  });

  await analyzer.initialize();

  const projectPath = './my-project';

  // 可以动态更新扫描选项
  analyzer.setScanOptions({
    verbose: true,
    extensions: ['js', 'ts', 'vue', 'jsx', 'tsx', 'css', 'scss', 'less'],  // 添加更多扩展名
    ignorePatterns: [
      '**/test/**',      // 自定义忽略模式
      '**/*.spec.ts',
      '**/*.test.ts'
    ]
  });

  const result = analyzer.scanDirectory(projectPath);

  fs.writeFileSync('dependency-graph.json', JSON.stringify(result, null, 2));

  console.log('🎉 Dependency analysis complete (Vue support stable)');

  // 获取统计信息
  const stats = analyzer.getStatistics();
  console.log(`\n📊 Final Statistics:`, stats);
})();
