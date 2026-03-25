import * as path from 'path';

/**
 * 扫描选项配置接口
 */
export interface ScanOptions {
  /**
   * 要忽略的目录模式列表
   */
  ignorePatterns?: string[];

  /**
   * 要忽略的文件名列表（精确匹配）
   */
  ignoreFiles?: string[];

  /**
   * 是否忽略 node_modules 目录
   */
  ignoreNodeModules?: boolean;

  /**
   * 是否忽略构建输出目录（dist、build 等）
   */
  ignoreBuildDirs?: boolean;

  /**
   * 是否显示详细的扫描信息
   */
  verbose?: boolean;

  /**
   * 要分析的文件扩展名
   */
  extensions?: string[];
}

/**
 * 默认扫描选项
 */
export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  ignorePatterns: [],
  ignoreFiles: [],
  ignoreNodeModules: true,
  ignoreBuildDirs: true,
  verbose: false,
  extensions: ['js', 'ts', 'vue', 'java', 'css', 'scss', 'less', 'jsx', 'tsx']
};

/**
 * 构建完整的忽略模式列表
 */
export function buildIgnorePatterns(options: ScanOptions): string[] {
  const patterns: string[] = [];

  // 添加用户自定义的忽略模式
  if (options.ignorePatterns) {
    patterns.push(...options.ignorePatterns);
  }

  // 添加 node_modules 忽略
  if (options.ignoreNodeModules !== false) {
    patterns.push('**/node_modules/**');
    patterns.push('**/node_modules');
  }

  // 添加构建目录忽略
  if (options.ignoreBuildDirs !== false) {
    patterns.push(
      '**/dist/**',
      '**/dist',
      '**/build/**',
      '**/build',
      '**/out/**',
      '**/out',
      '**/.next/**',
      '**/.next',
      '**/.nuxt/**',
      '**/.nuxt',
      '**/coverage/**',
      '**/coverage'
    );
  }

  // 添加其他常见忽略目录
  patterns.push(
    '**/.git/**',
    '**/.svn/**',
    '**/.hg/**',
    '**/vendor/**',  // PHP/Composer 依赖
    '**/venv/**',    // Python 虚拟环境
    '**/__pycache__/**',  // Python 缓存
    '**/*.min.js',   // 压缩文件
    '**/*.min.css',
    '**/*.bundle.js' // 打包文件
  );

  return patterns;
}

/**
 * 检查文件路径是否应该被忽略
 */
export function shouldIgnorePath(filePath: string, options: ScanOptions): boolean {
  const fileName = path.basename(filePath);
  const normalizedPath = filePath.replace(/\\/g, '/');

  // 检查精确文件名匹配
  if (options.ignoreFiles && options.ignoreFiles.includes(fileName)) {
    return true;
  }

  // 检查是否在 node_modules 中
  if (options.ignoreNodeModules !== false) {
    if (normalizedPath.includes('/node_modules/') || normalizedPath.startsWith('node_modules/')) {
      return true;
    }
  }

  // 检查是否在构建目录中
  if (options.ignoreBuildDirs !== false) {
    const buildDirPatterns = ['/dist/', '/build/', '/out/', '/.next/', '/.nuxt/', '/coverage/'];
    if (buildDirPatterns.some(pattern => normalizedPath.includes(pattern))) {
      return true;
    }
  }

  return false;
}
