// ── Selector helpers ───────────────────────────────────────────────────────
export function buildSelector(el) {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const tag = el.tagName.toLowerCase();
  if (['nav','header','footer','main','aside','article','h1','h2','h3'].includes(tag)) return tag;
  if (el.classList.length) {
    const meaningful = [...el.classList].filter(
      c => c.length > 2 && !c.startsWith('sm:') && !c.startsWith('&') && !c.startsWith('<')
    );
    if (meaningful.length) {
      return tag + '.' + meaningful.slice(0, 2).map(c => CSS.escape(c)).join('.');
    }
  }
  return tag;
}

export function buildLabel(el) {
  const tag = el.tagName.toLowerCase();
  const id  = el.id ? `#${el.id}` : '';
  const cls = el.classList.length ? `.${[...el.classList][0]}` : '';
  return `<${tag}${id}${cls}>`;
}

export function applyRulesToHtml(html, rules) {
  if (!rules.length) return html;

  const xmlDeclMatch = html.match(/^(<\?xml[^?]*\?>)/);
  // ── FIX: strip ALL DOCTYPE occurrences from the source first,
  // then use only the first one we captured.
  const doctypeMatch  = html.match(/(<!DOCTYPE[^>]*>)/i);
  const xmlDecl       = xmlDeclMatch ? xmlDeclMatch[1] + '\n' : '';
  const doctype       = doctypeMatch ? doctypeMatch[1] + '\n' : '';

  // ── FIX: remove ALL doctype declarations from html before parsing
  // so XMLSerializer doesn't see/duplicate them
  const cleanedHtml = html
    .replace(/^<\?xml[^?]*\?>\s*/i, '')   // strip xml decl
    .replace(/<!DOCTYPE[^>]*>\s*/gi, ''); // strip ALL doctypes (handles duplicates in source)

  const parser = new DOMParser();
  let doc      = parser.parseFromString(cleanedHtml, 'application/xhtml+xml');
  let useXml   = true;

  if (doc.documentElement.nodeName === 'parsererror' || doc.querySelector('parsererror')) {
    doc    = parser.parseFromString(cleanedHtml, 'text/html');
    useXml = false;
  }

  // Apply keep-only rules
  const keepRules = rules.filter(r => r.type === 'keeponly');
  if (keepRules.length) {
    const toKeep = [];
    keepRules.forEach(r => {
      try { doc.body.querySelectorAll(r.selector).forEach(el => toKeep.push(el)); } catch (e) {}
    });
    const kept = toKeep.map(el => el.cloneNode(true));
    doc.body.innerHTML = '';
    kept.forEach(el => doc.body.appendChild(el));
  }

  // Apply remove rules
  rules.filter(r => r.type === 'remove').forEach(r => {
    try { doc.body.querySelectorAll(r.selector).forEach(el => el.remove()); } catch (e) {}
  });

  if (useXml) {
    let serialised = new XMLSerializer().serializeToString(doc);
    serialised = serialised.replace(/^<\?xml[^?]*\?>\s*/i, '');
    serialised = serialised.replace(/ xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, '');
    serialised = serialised.replace(
      /(<html\b)([^>]*?)(>)/,
      (_, open, attrs, close) => {
        const cleanAttrs = attrs.replace(/\s*xmlns="[^"]*"/g, '');
        return `${open} xmlns="http://www.w3.org/1999/xhtml"${cleanAttrs}${close}`;
      }
    );
    // ── prepend exactly one xml decl + one doctype
    return xmlDecl + doctype + serialised;
  }

  return doc.documentElement.outerHTML;
}



// ── Extract title from HTML ────────────────────────────────────────────────
export function extractTitle(html, fallback) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
         || html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);
  return m ? m[1].trim() : fallback;
}

// ── Parse EPUB zip ─────────────────────────────────────────────────────────
export async function parseEpub(zip) {
  const containerXml = await zip.file('META-INF/container.xml').async('string');
  const opfPath = containerXml.match(/full-path="([^"]+\.opf)"/)?.[1];
  if (!opfPath) throw new Error('Could not find OPF file.');

  const opfXml  = await zip.file(opfPath).async('string');
  const opfBase = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const parser  = new DOMParser();
  const opfDoc  = parser.parseFromString(opfXml, 'application/xml');

  // Title
  const titleEl = opfDoc.querySelector('metadata title') || opfDoc.querySelector('dc\\:title, title');
  const epubTitle = titleEl ? titleEl.textContent.trim() : '';

  // Manifest
  const manifest = {};
  opfDoc.querySelectorAll('manifest item').forEach(item => {
    manifest[item.getAttribute('id')] = {
      href: item.getAttribute('href'),
      type: item.getAttribute('media-type') || '',
    };
  });

  // Cover
  let coverPath = '';
  const coverMeta = opfDoc.querySelector('meta[name="cover"]');
  if (coverMeta) {
    const coverId = coverMeta.getAttribute('content');
    if (manifest[coverId]) coverPath = opfBase + manifest[coverId].href;
  }
  if (!coverPath) {
    opfDoc.querySelectorAll('manifest item').forEach(item => {
      if ((item.getAttribute('properties') || '').includes('cover-image')) {
        coverPath = opfBase + item.getAttribute('href');
      }
    });
  }
  if (!coverPath) {
    for (const [, m] of Object.entries(manifest)) {
      if (m.type.startsWith('image/')) { coverPath = opfBase + m.href; break; }
    }
  }

  // Chapters
  const chapters = [];
  for (const ref of opfDoc.querySelectorAll('spine itemref')) {
    const idref = ref.getAttribute('idref');
    const href  = manifest[idref]?.href;
    if (!href) continue;
    const fullPath = opfBase + href;
    const f = zip.file(fullPath) || zip.file(decodeURIComponent(fullPath));
    if (!f) continue;
    const html = await f.async('string');
    chapters.push({ id: idref, title: extractTitle(html, href), path: fullPath, originalHtml: html });
  }

  return { opfPath, opfBase, epubTitle, coverPath, chapters };
}

// ── Load cover image as object URL ────────────────────────────────────────
export async function loadCoverUrl(zip, coverPath) {
  if (!coverPath) return null;
  const f = zip.file(coverPath) || zip.file(decodeURIComponent(coverPath));
  if (!f) return null;
  const ab   = await f.async('arraybuffer');
  const mime = coverPath.match(/\.png$/i) ? 'image/png'
             : coverPath.match(/\.webp$/i) ? 'image/webp'
             : 'image/jpeg';
  return URL.createObjectURL(new Blob([ab], { type: mime }));
}

// ── Build download zip ─────────────────────────────────────────────────────
export async function buildDownloadZip(JSZip, {
  zip, chapters, rules, chapterRenames, excludedChapters,
  opfPath, opfBase, newTitle, epubTitle, newCoverData, coverPath, finalCss,
}) {
  const newZip = new JSZip();
  const cssFilename = 'epub-editor-custom.css';
  const cssPath = opfBase + cssFilename;
  const excludedPaths = new Set([...excludedChapters].map(i => chapters[i].path));

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) { newZip.folder(path); continue; }
    if (excludedPaths.has(path)) continue;

    const chIdx = chapters.findIndex(c => c.path === path);
    if (chIdx !== -1) {
      let cleaned = applyRulesToHtml(chapters[chIdx].originalHtml, rules);
      if (chapterRenames[chIdx]) {
        const t = chapterRenames[chIdx];
        cleaned = cleaned.replace(/(<title[^>]*>)[^<]*(<\/title>)/i, `$1${t}$2`);
        cleaned = cleaned.replace(/(<h[1-3][^>]*>)[^<]*(<\/h[1-3]>)/i, `$1${t}$2`);
      }
      if (finalCss && !cleaned.includes('epub-editor-custom.css')) {
        // Self-closing link tag — required for valid XHTML in EPUB readers
        const linkTag = `<link rel="stylesheet" type="text/css" href="../${cssFilename}"/>`;
        // const linkTag = `<link rel="stylesheet" type="text/css" href="../epub-editor-custom.css"/>`;
        if (cleaned.includes('</head>')) {
          cleaned = cleaned.replace(/(<\/head>)/i, `  ${linkTag}\n$1`);
        } else if (cleaned.includes('</Head>')) {
          cleaned = cleaned.replace('</Head>', `  ${linkTag}\n</Head>`);
        }
        // If no </head> found, do nothing — broken source, don't make it worse
      }
      newZip.file(path, cleaned);
      continue;
    }

    if (path === opfPath) {
      let opfXml = await file.async('string');
      opfXml = opfXml.replace(/(<dc:title[^>]*>)[^<]*(<\/dc:title>)/i, `$1${newTitle}$2`);
      opfXml = opfXml.replace(/(<title[^>]*>)[^<]*(<\/title>)/i, `$1${newTitle}$2`);
      if (excludedChapters.size) {
        const excludedIds = new Set([...excludedChapters].map(i => chapters[i].id));
        excludedIds.forEach(id => {
          opfXml = opfXml.replace(
            new RegExp(`<itemref[^>]*idref=["']${id}["'][^>]*/?>`, 'g'), ''
          );
        });
      }
      if (finalCss && !opfXml.includes('epub-editor-custom.css')) {
        opfXml = opfXml.replace(/(<\/manifest>)/i,
          `  <item id="epub-editor-css" href="${cssFilename}" media-type="text/css"/>\n$1`);
      }
      newZip.file(path, opfXml);
      continue;
    }

    if (newCoverData && coverPath && path === coverPath) {
      newZip.file(path, newCoverData.arrayBuffer);
      continue;
    }

    newZip.file(path, await file.async('arraybuffer'));
  }

  if (finalCss) newZip.file(cssPath, finalCss);
  return newZip;
}

// ── CSS Presets ───────────────────────────────────────────────────────────
export const CSS_PRESETS = {
  readable: `body {
  font-family: Georgia, serif;
  font-size: 1rem;
  line-height: 1.75;
  max-width: 680px;
  margin: 0 auto;
  padding: 1em 1.5em;
  color: #1a1a1a;
}
p {
  margin-bottom: 0.9em;
  text-indent: 0;
}
h1, h2, h3 {
  font-family: Georgia, serif;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}`,
  compact: `body {
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
  padding: 0.5em 1em;
}
p { margin-bottom: 0.4em; }`,
  justify: `body { text-align: justify; }
p { text-align: justify; hyphens: auto; }`,
  clean: `body { margin: 0; padding: 1em 2em; }
nav, header, footer, .nav-btn-group, .download-app { display: none !important; }
img { max-width: 100%; height: auto; }`,
};