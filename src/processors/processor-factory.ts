import * as path from 'path';
import { BaseFileProcessor } from './base-processor';
import { VueFileProcessor } from './vue-processor';
import { JavaScriptFileProcessor } from './js-processor';
import { TypeScriptFileProcessor } from './ts-processor';
import { JavaFileProcessor } from './java-processor';
import { CssFileProcessor } from './css-processor';
import { ScssFileProcessor } from './scss-processor';
import { LessFileProcessor } from './less-processor';

/**
 * 文件处理器工厂
 * 负责创建和管理文件处理器实例
 */
export class FileProcessorFactory {
  private processors: Map<string, BaseFileProcessor> = new Map();

  constructor() {
    this.registerDefaultProcessors();
  }

  /**
   * 注册默认的文件处理器
   */
  private registerDefaultProcessors(): void {
    this.register(new VueFileProcessor());
    this.register(new JavaScriptFileProcessor());
    this.register(new TypeScriptFileProcessor());
    this.register(new JavaFileProcessor());
    this.register(new CssFileProcessor());
    this.register(new ScssFileProcessor());
    this.register(new LessFileProcessor());
  }

  /**
   * 注册新的文件处理器
   */
  register(processor: BaseFileProcessor): void {
    this.processors.set(processor.getExtension(), processor);
  }

  /**
   * 根据文件扩展名获取对应的处理器
   */
  getProcessor(extension: string): BaseFileProcessor | undefined {
    return this.processors.get(extension);
  }

  /**
   * 根据文件路径获取对应的处理器
   */
  getProcessorForFile(filePath: string): BaseFileProcessor | undefined {
    const ext = path.extname(filePath).slice(1);
    return this.getProcessor(ext);
  }

  /**
   * 获取所有已注册的处理器
   */
  getAllProcessors(): BaseFileProcessor[] {
    return Array.from(this.processors.values());
  }
}
