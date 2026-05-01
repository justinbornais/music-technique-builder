import { $typst } from '@myriaddreamin/typst.ts';
import { TypstSnippet } from '@myriaddreamin/typst.ts/contrib/snippet';
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url';
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url';
import scorifyWasmUrl from '../typst/scorify/scorify_wasm.wasm?url';
import { trimEmbeddedSystemSvg } from './trimEmbeddedSystemSvg.js';

const scorifySources = import.meta.glob('../typst/scorify/**/*.{typ,json}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

let typstReady;
let scorifyWasmBytes;

const MAIN_FILE_PATH = '/worker-technique.typ';
const SCORIFY_WASM_PATH = '/scorify/scorify_wasm.wasm';
const SVG_DATA_SELECTION = {
  body: true,
  defs: true,
  css: true,
  js: false,
};

function scorifyVirtualPath(path) {
  return path.replace(/^\.\.\/typst\/scorify\//, '/scorify/');
}

async function fetchBinary(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function loadScorifyWasmBytes() {
  if (!scorifyWasmBytes) {
    scorifyWasmBytes = fetchBinary(scorifyWasmUrl);
  }

  return scorifyWasmBytes;
}

function addScorifySources(compiler) {
  for (const [path, content] of Object.entries(scorifySources)) {
    compiler.addSource(scorifyVirtualPath(path), content);
  }
}

async function initializeTypst() {
  if (!typstReady) {
    typstReady = (async () => {
      $typst.setCompilerInitOptions({
        getModule: () => compilerWasmUrl,
      });
      $typst.setRendererInitOptions({
        getModule: () => rendererWasmUrl,
      });
      $typst.use(
        TypstSnippet.fetchPackageRegistry(),
      );

      await $typst.mapShadow(SCORIFY_WASM_PATH, await loadScorifyWasmBytes());
      addScorifySources(await $typst.getCompiler());
    })();
  }

  return typstReady;
}

async function prepareCompilerForRender(source) {
  await initializeTypst();

  const compiler = await $typst.getCompiler();
  await compiler.reset();
  await compiler.mapShadow(SCORIFY_WASM_PATH, await loadScorifyWasmBytes());
  addScorifySources(compiler);
  compiler.addSource(MAIN_FILE_PATH, source);
}

async function renderTypstSvg(source) {
  await prepareCompilerForRender(source);

  const svg = await $typst.svg({
    mainFilePath: MAIN_FILE_PATH,
    root: '/',
    inputs: {},
    data_selection: SVG_DATA_SELECTION,
  });

  if (!svg) {
    throw new Error('Typst did not return SVG output.');
  }

  return trimEmbeddedSystemSvg(svg);
}

self.onmessage = async (event) => {
  const { requestId, source, type } = event.data;

  try {
    if (type === 'warmup') {
      await initializeTypst();
      self.postMessage({ requestId, ready: true });
      return;
    }

    const svg = await renderTypstSvg(source);
    self.postMessage({ requestId, svg });
  } catch (error) {
    self.postMessage({
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
