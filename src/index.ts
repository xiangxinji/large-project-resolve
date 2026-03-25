import { Parser , Query , Language} from 'web-tree-sitter';
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';
import { parse as parseVue } from '@vue/compiler-sfc';

// 核心查询：匹配 import/export 以及动态 import()
const QUERIES = {
  js_ts: `
    (import_statement source: (string) @dep)
    (export_statement source: (string) @dep)
    (call_expression 
      function: (import) 
      arguments: (arguments (string) @dep))
  `,
  java: `
    (import_declaration (scoped_identifier) @dep)
    (import_declaration (identifier) @dep)
  `
};

class SmartAnalyzer {
  // 存储解析器实例和预编译的查询
  private parsers: Record<string, { parser: Parser; query: Query }> = {};

  /**
   * 初始化 WASM 环境并加载语言包
   */
  async init() {
    // 1. 初始化底层 WASM 运行时
    await Parser.init(); 
    
    const loadLang = async (name: string, wasmFile: string, queryStr: string) => {
      const wasmPath = path.join(__dirname, 'parsers', wasmFile);
      
      if (!fs.existsSync(wasmPath)) {
        throw new Error(`❌ 找不到 WASM 文件: ${wasmPath}。请确保文件已放入 parsers 目录。`);
      }

      const lang = await Language.load(wasmPath);
      const parser = new Parser();
      parser.setLanguage(lang);

      this.parsers[name] = { 
        parser, 
        query: new Query(lang, queryStr) 
      };
    };

    try {
      await loadLang('js', 'tree-sitter-javascript.wasm', QUERIES.js_ts);
      await loadLang('ts', 'tree-sitter-typescript.wasm', QUERIES.js_ts);
      await loadLang('java', 'tree-sitter-java.wasm', QUERIES.java);
      console.log('✅ JS/TS/Java 解析器已就绪');
    } catch (error: any) {
      console.error('❌ 初始化失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 分析单个文件
   */
  public analyzeFile(filePath: string): string[] {
    const ext = path.extname(filePath).slice(1);
    const deps = new Set<string>();

    try {
      if (ext === 'vue') {
        this.handleVue(filePath, deps);
      } else if (this.parsers[ext]) {
        this.parseCode(fs.readFileSync(filePath, 'utf8'), ext, deps);
      }
    } catch (err) {
      console.warn(`⚠️ [Skip] 无法分析文件: ${filePath}`);
    }
    
    return Array.from(deps);
  }

  /**
   * Vue 专用逻辑：利用官方编译器提取 Script 块
   */
  private handleVue(filePath: string, deps: Set<string>) {
    const content = fs.readFileSync(filePath, 'utf8');
    const { descriptor } = parseVue(content);
    
    // 同时考虑 <script> 和 <script setup>
    const script = descriptor.scriptSetup || descriptor.script;
    if (script) {
      const lang = (script.lang === 'ts' || script.lang === 'typescript') ? 'ts' : 'js';
      this.parseCode(script.content, lang, deps);
    }
  }

  /**
   * 执行 Tree-sitter 查询并提取依赖路径
   */
  private parseCode(code: string, lang: string, deps: Set<string>) {
    const config = this.parsers[lang];
    if (!config) return;

    const tree = config.parser.parse(code);
    if (!tree?.rootNode) return;

    // 执行 WASM 版 Captures 查询
    const captures = config.query.captures(tree.rootNode);
    
    captures.forEach((capture) => {
      // 提取字符串内容并去除引号
      const depPath = capture.node.text.replace(/^["']|["']$/g, '');
      if (depPath && depPath.length < 500) { 
        deps.add(depPath);
      }
    });
  }

  /**
   * 批量扫描目录
   */
  public scan(dir: string) {
    // 处理 Windows 路径兼容性
    const absPath = path.resolve(dir).replace(/\\/g, '/');
    const files = globSync(`${absPath}/**/*.{js,ts,vue,java}`, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    console.log(`📁 扫描目录: ${absPath}`);
    console.log(`📄 待处理文件: ${files.length} 个`);
    
    const result: Record<string, string[]> = {};
    files.forEach((f: string) => {
      const relPath = path.relative(absPath, f);
      console.log(`🔍 正在分析: ${relPath}`);
      result[relPath] = this.analyzeFile(f);
    });
    return result;
  }
}

// --- 执行入口 ---
(async () => {
  const analyzer = new SmartAnalyzer();
  await analyzer.init();

  // 1. 设置你要分析的项目路径
  const projectPath = './my-project'; 
  
  if (!fs.existsSync(projectPath)) {
    console.error('❌ 目标路径不存在，请检查代码中的 projectPath 变量');
    return;
  }

  const res = analyzer.scan(projectPath);

  // 2. 输出结果到 JSON
  fs.writeFileSync('dependency-graph.json', JSON.stringify(res, null, 2));
  console.log('\n🚀 分析完成！结果已存入 dependency-graph.json');
})();