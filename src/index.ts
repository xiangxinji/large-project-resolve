import * as fs from 'fs';
import { SmartDependencyAnalyzer } from './analyzers/dependency-analyzer';

/**
 * 主程序入口
 * 初始化依赖分析器并执行分析
 */
(async () => {
  // ========== 使用 framework 参数的示例 ==========

  // 1. Vue 项目示例
  console.log('=== Vue 项目分析示例 ===');
  const vueAnalyzer = new SmartDependencyAnalyzer({
    scanOptions: {
      framework: 'vue',  // 指定框架为 Vue（包含 HTML 支持）
      verbose: true
    }
  });

  await vueAnalyzer.initialize();

  const vueProjectPath = './my-project';
  const vueResult = vueAnalyzer.scanDirectory(vueProjectPath);

  fs.writeFileSync('dependency-graph.json', JSON.stringify(vueResult, null, 2));

  console.log('🎉 Vue 项目分析完成');

  // 2. 测试 HTML 解析
  console.log('\n=== HTML 文件解析测试 ===');
  const htmlAnalyzer = new SmartDependencyAnalyzer({
    scanOptions: {
      framework: 'vue',
      verbose: true,
      extensions: ['html']  // 只测试 HTML 文件
    }
  });

  await htmlAnalyzer.initialize();

  const testProjectPath = './my-project';
  const htmlResult = htmlAnalyzer.scanDirectory(testProjectPath);

  console.log('📄 HTML 文件依赖:', JSON.stringify(htmlResult, null, 2));

  // 2. Node.js 项目示例
  // console.log('\n=== Node.js 项目分析示例 ===');
  // const nodeAnalyzer = new SmartDependencyAnalyzer(undefined, {
  //   framework: 'node',  // 指定框架为 Node.js
  //   verbose: true
  // });
  //
  // await nodeAnalyzer.initialize();
  //
  // const nodeProjectPath = './my-node-project';
  // const nodeResult = nodeAnalyzer.scanDirectory(nodeProjectPath);
  //
  // fs.writeFileSync('dependency-graph-node.json', JSON.stringify(nodeResult, null, 2));

  // 3. Java 项目示例
  // console.log('\n=== Java 项目分析示例 ===');
  // const javaAnalyzer = new SmartDependencyAnalyzer(undefined, {
  //   framework: 'java',  // 指定框架为 Java
  //   verbose: true
  // });
  //
  // await javaAnalyzer.initialize();
  //
  // const javaProjectPath = './my-java-project';
  // const javaResult = javaAnalyzer.scanDirectory(javaProjectPath);
  //
  // fs.writeFileSync('dependency-graph-java.json', JSON.stringify(javaResult, null, 2));

  // ========== 传统方式（向后兼容） ==========
  // 如果不指定 framework，会加载所有处理器
  // const analyzer = new SmartDependencyAnalyzer(undefined, {
  //   verbose: true,
  //   ignoreNodeModules: true,
  //   ignoreBuildDirs: true
  // });

  // ========== 获取统计信息 ==========
  const stats = vueAnalyzer.getStatistics();
  console.log(`\n📊 Final Statistics:`, stats);
})();
