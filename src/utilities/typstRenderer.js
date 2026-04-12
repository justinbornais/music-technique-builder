import { $typst } from '@myriaddreamin/typst.ts';
import { TypstSnippet } from '@myriaddreamin/typst.ts/contrib/snippet';
import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url';
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url';
import bravuraFontUrl from '../typst/scorify/fonts/Bravura.otf?url';
import TypstRenderWorker from './typstRenderWorker.js?worker';

const scorifySources = import.meta.glob('../typst/scorify/**/*.{typ,json}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

let typstReady;
let renderCount = 0;
const svgCache = new Map();
const renderWorkers = [];

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

export async function renderTypstSvg(source, options = {}) {
  const { cache = true } = options;
  if (cache && svgCache.has(source)) {
    return svgCache.get(source);
  }

  await initializeTypst();

  const mainFilePath = `/technique-${renderCount}.typ`;
  renderCount += 1;
  await $typst.addSource(mainFilePath, source);

  const svg = await $typst.svg({
    mainFilePath,
    root: '/',
  });

  if (!svg) {
    throw new Error('Typst did not return SVG output.');
  }

  if (cache) {
    svgCache.set(source, svg);
  }

  return svg;
}

function preferredWorkerCount(taskCount) {
  if (typeof Worker === 'undefined') return 1;

  const cores = typeof navigator === 'undefined'
    ? 4
    : navigator.hardwareConcurrency || 4;
  const desired = cores >= 8 ? 4 : 2;
  return Math.max(1, Math.min(taskCount, desired));
}

function createAbortError() {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Rendering cancelled.', 'AbortError');
  }

  const error = new Error('Rendering cancelled.');
  error.name = 'AbortError';
  return error;
}

function getRenderWorker(index) {
  if (!renderWorkers[index]) {
    renderWorkers[index] = new TypstRenderWorker();
  }

  return renderWorkers[index];
}

function releaseRenderWorkers(workers) {
  workers.forEach((worker) => {
    worker.onmessage = null;
    worker.onerror = null;
    worker.currentRequestId = null;
  });
}

function terminateRenderWorkers(workers = renderWorkers) {
  workers.forEach((worker) => worker?.terminate());
  if (workers === renderWorkers) {
    renderWorkers.length = 0;
  }
}

export async function renderTypstSvgBatch(tasks, options = {}) {
  const {
    concurrency = preferredWorkerCount(tasks.length),
    onResult,
    signal,
  } = options;

  if (!tasks.length) return [];
  if (typeof Worker === 'undefined' || concurrency <= 1) {
    const results = [];
    for (const [index, task] of tasks.entries()) {
      if (signal?.aborted) throw createAbortError();

      try {
        const svg = await renderTypstSvg(task.source);
        const result = { ...task, svg, error: '', status: 'complete' };
        results[index] = result;
        onResult?.(index, result);
      } catch (error) {
        if (signal?.aborted) throw createAbortError();

        const result = {
          ...task,
          svg: '',
          error: error instanceof Error ? error.message : String(error),
          status: 'error',
        };
        results[index] = result;
        onResult?.(index, result);
      }

      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }

    return results;
  }

  return new Promise((resolve, reject) => {
    const results = new Array(tasks.length);
    const queue = [];
    let completed = 0;
    let requestCount = 0;
    let settled = false;
    const workers = [];
    const activeJobs = new Map();

    function cleanup({ terminate = false } = {}) {
      if (terminate) {
        terminateRenderWorkers();
      } else {
        releaseRenderWorkers(workers);
      }
      signal?.removeEventListener('abort', abort);
    }

    function abort() {
      if (settled) return;
      settled = true;
      cleanup({ terminate: true });
      reject(createAbortError());
    }

    function complete(index, result) {
      if (settled) return;

      results[index] = result;
      completed += 1;
      onResult?.(index, result);

      if (completed === tasks.length) {
        settled = true;
        cleanup();
        resolve(results);
      }
    }

    function assign(worker) {
      if (settled || signal?.aborted) return;

      const job = queue.shift();
      if (!job) return;

      const requestId = `${requestCount}`;
      requestCount += 1;
      activeJobs.set(requestId, job);
      worker.currentRequestId = requestId;
      worker.postMessage({ requestId, source: job.task.source });
    }

    if (signal?.aborted) {
      abort();
      return;
    }

    signal?.addEventListener('abort', abort, { once: true });

    tasks.forEach((task, index) => {
      const cached = svgCache.get(task.source);
      if (cached) {
        queueMicrotask(() => complete(index, {
          ...task,
          svg: cached,
          error: '',
          status: 'complete',
        }));
      } else {
        queue.push({ index, task });
      }
    });

    if (queue.length === 0) return;

    const workerCount = Math.max(1, Math.min(queue.length, concurrency));
    for (let index = 0; index < workerCount; index += 1) {
      const worker = getRenderWorker(index);
      workers.push(worker);

      worker.onmessage = (event) => {
        const { requestId, svg, error } = event.data;
        const job = activeJobs.get(requestId);
        if (!job) return;

        activeJobs.delete(requestId);
        worker.currentRequestId = null;

        if (svg) {
          svgCache.set(job.task.source, svg);
        }

        complete(job.index, {
          ...job.task,
          svg: svg || '',
          error: error || '',
          status: error ? 'error' : 'complete',
        });
        assign(worker);
      };

      worker.onerror = (event) => {
        event.preventDefault();
        const requestId = worker.currentRequestId;
        const job = requestId ? activeJobs.get(requestId) : null;
        if (requestId) activeJobs.delete(requestId);
        worker.currentRequestId = null;
        if (job) {
          complete(job.index, {
            ...job.task,
            svg: '',
            error: event.message || 'Typst worker failed.',
            status: 'error',
          });
        }
        assign(worker);
      };

      assign(worker);
    }
  });
}
