import { $typst } from '@myriaddreamin/typst.ts';
import { TypstSnippet } from '@myriaddreamin/typst.ts/contrib/snippet';
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url';
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url';
import bravuraFontUrl from '../typst/scorify/fonts/Bravura.otf?url';

const scorifySources = import.meta.glob('../typst/scorify/**/*.{typ,json}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

let typstReady;

function scorifyVirtualPath(path) {
  return path.replace(/^\.\.\/typst\/scorify\//, '/scorify/');
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
        TypstSnippet.preloadFontFromUrl(bravuraFontUrl),
      );

      for (const [path, content] of Object.entries(scorifySources)) {
        await $typst.addSource(scorifyVirtualPath(path), content);
      }
    })();
  }

  return typstReady;
}

export async function renderTypstSvg(source) {
  await initializeTypst();
  await $typst.addSource('/technique.typ', source);

  const svg = await $typst.svg({
    mainFilePath: '/technique.typ',
    root: '/',
  });

  if (!svg) {
    throw new Error('Typst did not return SVG output.');
  }

  return svg;
}
