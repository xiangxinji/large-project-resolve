import { Parser, Query, Language } from 'web-tree-sitter';
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

// -------------------- 查询 --------------------
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
  private parsers: Record<string, { parser: Parser; query: Query; lang: Language }> = {};

  async init() {
    await Parser.init();

    const loadLang = async (name: string, wasmFile: string, queryStr: string) => {
      const wasmPath = path.join(__dirname, 'parsers', wasmFile);

      if (!fs.existsSync(wasmPath)) {
        throw new Error(`❌ 找不到 WASM 文件: ${wasmPath}`);
      }

      // ✅ Node 正确加载方式
      const wasmBuffer = fs.readFileSync(wasmPath);
      const lang = await Language.load(wasmBuffer);

      const parser = new Parser();
      parser.setLanguage(lang);

      this.parsers[name] = {
        parser,
        query: new Query(lang, queryStr),
        lang
      };

      console.log(`✅ ${name} 加载成功`);
    };

    try {
      await loadLang('js', 'tree-sitter-javascript.wasm', QUERIES.js_ts);

      // ⚠️ TS 必须用这个文件名
      await loadLang('ts', 'tree-sitter-typescript-typescript.wasm', QUERIES.js_ts);

      await loadLang('java', 'tree-sitter-java.wasm', QUERIES.java);

      console.log('🚀 所有解析器已就绪（Vue 使用 SFC 拆分方案）');
    } catch (error: any) {
      console.error('❌ 初始化失败:', error.message);
      process.exit(1);
    }
  }

  // -------------------- 对外入口 --------------------
  public analyzeFile(filePath: string): string[] {
    const ext = path.extname(filePath).slice(1);
    const deps = new Set<string>();
    const content = fs.readFileSync(filePath, 'utf8');

    try {
      if (ext === 'vue') {
        this.parseVue(content, deps);
      } else if (this.parsers[ext]) {
        this.extractDeps(content, ext, deps);
      }
    } catch (err) {
      console.warn(`⚠️ [Skip] 无法分析文件: ${filePath}`);
    }

    return Array.from(deps);
  }

  /**
   * ✅ 工业级 Vue 处理（替代 tree-sitter-vue）
   * - 支持多个 <script>
   * - 支持 <script setup>
   * - 自动识别 TS
   */
  private parseVue(code: string, deps: Set<string>) {
    // 匹配所有 script（包含 setup）
    const scriptBlocks = code.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi);

    if (!scriptBlocks) return;

    scriptBlocks.forEach(block => {
      // 提取 script 内容
      const contentMatch = block.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
      if (!contentMatch) return;

      const scriptCode = contentMatch[1];

      // 判断 TS
      const isTS =
        /lang\s*=\s*["']ts["']/.test(block) ||
        /lang\s*=\s*["']tsx["']/.test(block);

      this.extractDeps(scriptCode, isTS ? 'ts' : 'js', deps);
    });
  }

  /**
   * 通用依赖提取
   */
  private extractDeps(code: string, langName: string, deps: Set<string>) {
    const config = this.parsers[langName];
    if (!config) return;

    const tree = config.parser.parse(code);
    if (!tree) return;

    // ✅ Query（快）
    const captures = config.query.captures(tree.rootNode);

    captures.forEach((capture) => {
      const depPath = capture.node.text.replace(/^["']|["']$/g, '');
      if (depPath && depPath.length < 500) {
        deps.add(depPath);
      }
    });

    // ✅ AST fallback（更稳）
    this.walk(tree.rootNode, deps);
  }

  /**
   * AST 遍历（兜底）
   */
  private walk(node: any, deps: Set<string>) {
    // import xxx from 'xxx'
    if (node.type === 'import_statement') {
      const strNode = node.childForFieldName('source');
      if (strNode) {
        const dep = strNode.text.replace(/^["']|["']$/g, '');
        deps.add(dep);
      }
    }

    // require('xxx')
    if (
      node.type === 'call_expression' &&
      node.firstChild?.text === 'require'
    ) {
      const arg = node.lastChild?.firstChild;
      if (arg) {
        const dep = arg.text.replace(/^["']|["']$/g, '');
        deps.add(dep);
      }
    }

    node.children?.forEach((child: any) => this.walk(child, deps));
  }

  // -------------------- 扫描 --------------------
  public scan(dir: string) {
    const absPath = path.resolve(dir).replace(/\\/g, '/');

    const files = globSync(`${absPath}/**/*.{js,ts,vue,java}`, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    const result: Record<string, string[]> = {};

    files.forEach((f: string) => {
      const relPath = path.relative(absPath, f);
      result[relPath] = this.analyzeFile(f);
    });

    return result;
  }
}

// -------------------- 执行 --------------------
(async () => {
  const analyzer = new SmartAnalyzer();
  await analyzer.init();

  const projectPath = './my-project';

  const res = analyzer.scan(projectPath);

  fs.writeFileSync('dependency-graph.json', JSON.stringify(res, null, 2));

  console.log('🎉 统一解析完成（Vue 已稳定支持）');
})();
