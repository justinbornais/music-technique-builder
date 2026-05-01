const MIN_TRIMMABLE_IMAGE_HEIGHT = 120;
const MIN_TRIMMABLE_VIEWBOX_HEIGHT_MM = 42;
const SYSTEM_TRIM_MM = 3;

function base64ToString(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function stringToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function trimInnerSvg(svgMarkup, imageHeight) {
  const viewBoxMatch = svgMarkup.match(/viewBox="([0-9.+-]+) ([0-9.+-]+) ([0-9.+-]+) ([0-9.+-]+)"/);
  if (!viewBoxMatch) return null;

  const [, minX, minY, width, height] = viewBoxMatch;
  const viewBoxHeight = Number(height);
  if (!Number.isFinite(viewBoxHeight)) return null;
  if (viewBoxHeight < MIN_TRIMMABLE_VIEWBOX_HEIGHT_MM && imageHeight < MIN_TRIMMABLE_IMAGE_HEIGHT) {
    return null;
  }

  const trimMm = Math.min(SYSTEM_TRIM_MM, Math.max(0, viewBoxHeight / 2 - 1));
  if (trimMm <= 0) return null;

  const nextMinY = Number(minY) + trimMm;
  const nextHeight = viewBoxHeight - trimMm * 2;
  if (nextHeight <= 0) return null;

  let nextSvg = svgMarkup.replace(
    viewBoxMatch[0],
    `viewBox="${minX} ${nextMinY.toFixed(3)} ${width} ${nextHeight.toFixed(3)}"`,
  );
  nextSvg = nextSvg.replace(/height="([0-9.+-]+)mm"/, `height="${nextHeight.toFixed(3)}mm"`);

  return {
    svg: nextSvg,
    originalHeight: viewBoxHeight,
    trimmedHeight: nextHeight,
  };
}

function updateImageTag(tag, cumulativeHeight) {
  const hrefMatch = tag.match(/xlink:href="data:image\/svg\+xml;base64,([^"]+)"/);
  const heightMatch = tag.match(/height="([0-9.+-]+)"/);
  if (!hrefMatch || !heightMatch) {
    return { tag, changed: false, height: null };
  }

  const imageHeight = Number(heightMatch[1]);
  if (!Number.isFinite(imageHeight)) {
    return { tag, changed: false, height: null };
  }

  const decodedSvg = base64ToString(hrefMatch[1]);
  const trimmed = trimInnerSvg(decodedSvg, imageHeight);
  const nextHeight = trimmed
    ? imageHeight * (trimmed.trimmedHeight / trimmed.originalHeight)
    : imageHeight;

  let nextTag = tag;
  if (trimmed) {
    nextTag = nextTag.replace(hrefMatch[1], stringToBase64(trimmed.svg));
    nextTag = nextTag.replace(heightMatch[0], `height="${nextHeight}"`);
  }

  if (cumulativeHeight != null && /transform="matrix\(1 0 0 1 0 [0-9.+-]+\)"/.test(nextTag)) {
    nextTag = nextTag.replace(
      /transform="matrix\(1 0 0 1 0 [0-9.+-]+\)"/,
      `transform="matrix(1 0 0 1 0 ${cumulativeHeight})"`,
    );
  }

  return {
    tag: nextTag,
    changed: Boolean(trimmed),
    height: nextHeight,
  };
}

export function trimEmbeddedSystemSvg(svg) {
  const imageTagPattern = /<image\b[^>]*\/>/g;
  const imageTags = [...svg.matchAll(imageTagPattern)];
  if (imageTags.length < 2) {
    return svg;
  }

  let changed = false;
  let nextSvg = svg;
  let offset = 0;
  let cumulativeHeight = 0;
  let totalReduction = 0;

  imageTags.forEach((match, index) => {
    const result = updateImageTag(match[0], index === 0 ? null : cumulativeHeight);
    if (result.height != null) {
      const originalHeightMatch = match[0].match(/height="([0-9.+-]+)"/);
      const originalHeight = originalHeightMatch ? Number(originalHeightMatch[1]) : result.height;
      cumulativeHeight += result.height;
      totalReduction += Math.max(0, originalHeight - result.height);
    }

    if (result.tag === match[0]) {
      return;
    }

    changed = true;
    const start = match.index + offset;
    const end = start + match[0].length;
    nextSvg = `${nextSvg.slice(0, start)}${result.tag}${nextSvg.slice(end)}`;
    offset += result.tag.length - match[0].length;
  });

  if (!changed || totalReduction <= 0) {
    return nextSvg;
  }

  const rootMatch = nextSvg.match(/<svg class="typst-doc" viewBox="0 0 ([0-9.+-]+) ([0-9.+-]+)" width="([0-9.+-]+)pt" height="([0-9.+-]+)pt"/);
  if (rootMatch) {
    const [, rootWidth, , rootWidthPt, rootHeightPt] = rootMatch;
    const nextRootHeight = Number(rootHeightPt) - totalReduction;
    if (Number.isFinite(nextRootHeight) && nextRootHeight > 0) {
      nextSvg = nextSvg.replace(
        rootMatch[0],
        `<svg class="typst-doc" viewBox="0 0 ${rootWidth} ${nextRootHeight}" width="${rootWidthPt}pt" height="${nextRootHeight}pt"`,
      );
      nextSvg = nextSvg.replace(
        /<path class="typst-shape" fill="#ffffff" fill-rule="nonzero" d="M 0 0v [0-9.+-]+ h ([0-9.+-]+) v -[0-9.+-]+ Z "\/>/,
        `<path class="typst-shape" fill="#ffffff" fill-rule="nonzero" d="M 0 0v ${nextRootHeight} h $1 v -${nextRootHeight} Z "\/>`,
      );
    }
  }

  return nextSvg;
}
