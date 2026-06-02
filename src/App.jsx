import { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { IconEraser, IconCode, IconEye } from '@tabler/icons-react';
import UploadZone from './components/UploadZone';
import Sidebar from './components/Sidebar/Sidebar';
import PreviewPanel from './components/PreviewPanel';
import RightPanel from './components/RightPanel/RightPanel';
import ActionBar from './components/modals/ActionBar';
import RenameModal from './components/modals/RenameModal';
import FindReplaceModal from './components/modals/FindReplaceModal';
import UndoToast from './components/modals/UndoToast';
import HelpModal from './components/modals/HelpModal';
import { useEpub } from './hooks/useEpub';
import { useRules } from './hooks/useRules';
import { buildDownloadZip } from './utils/epub';
import styles from './App.module.css';

export default function App() {
  const epub = useEpub();
  const rulesApi = useRules();

  const [viewMode, setViewMode] = useState('cleaned');
  const [chapterRenames, setChapterRenames] = useState({});
  const [excludedChapters, setExcludedChapters] = useState(new Set());
  const [currentTitle, setCurrentTitle] = useState('');
  const [coverChanged, setCoverChanged] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [fnrOpen, setFnrOpen] = useState(false);
  const [customCss, setCustomCss] = useState('');  // ← single source of truth for CSS
  const [actionBar, setActionBar] = useState({ visible: false, x: 0, y: 0, origLabel: '', selector: '' });

  const previewRef = useRef(null);
  const rightPanelRef = useRef(null);
  const previewFrameRef = { current: typeof document !== 'undefined' ? document.getElementById('__preview-frame') : null };

  useEffect(() => { setCurrentTitle(epub.epubTitle); }, [epub.epubTitle]);

  const handleCoverChange = async (file) => { await epub.applyCoverFile(file); setCoverChanged(true); };
  const handleSelectChapter = (idx) => { epub.setCurrentIdx(idx); setActionBar(p => ({ ...p, visible: false })); };
  const handleToggleExclude = (idx) => setExcludedChapters(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  const handleSelectElement = ({ selector, label, x, y }) => setActionBar({ visible: true, x, y, origLabel: label, selector });
  const handleRemoveRule = (sel) => { if (!sel) return; const r = rulesApi.addRule(sel, sel, 'remove', rulesApi.rules); epub.setStatus(r?.error || r?.msg || ''); setActionBar(p => ({ ...p, visible: false })); };
  const handleKeepOnly = (sel) => { if (!sel) return; const r = rulesApi.addRule(sel, sel, 'keeponly', rulesApi.rules); epub.setStatus(r?.error || r?.msg || ''); setActionBar(p => ({ ...p, visible: false })); };

  const handleHighlightTree = (sel) => {
    console.log("[App] handleHighlightTree called with:", sel);
    console.log("[App] rightPanelRef.current:", rightPanelRef.current);
    setActionBar(p => ({ ...p, visible: false }));
    rightPanelRef.current?.highlightInTree(sel);
    epub.setStatus(`Tree: ${sel}`);
  };

  const handleHighlightPreview = (sel) => { previewRef.current?.highlightSelector(sel); epub.setStatus(`Highlighting: ${sel}`); };
  const handleAddRuleFromTree = (sel, label, type) => { const r = rulesApi.addRule(sel, label, type, rulesApi.rules); epub.setStatus(r?.error || r?.msg || ''); };

  const handleSaveRules = () => {
    if (!rulesApi.rules.length) { epub.setStatus('No rules to save.'); return; }
    const blob = new Blob([JSON.stringify({ version: 1, rules: rulesApi.rules }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'epub-rules.json'; a.click();
    epub.setStatus(`Saved ${rulesApi.rules.length} rules.`);
  };

  const handleLoadRules = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const loaded = Array.isArray(data) ? data : (data.rules || []);
        rulesApi.loadRules(loaded);
        epub.setStatus('Rules loaded.');
      } catch (e) { epub.setStatus('Failed to parse rules file.'); }
    };
    reader.readAsText(file);
  };

  const handleClearRules = () => {
    if (!rulesApi.rules.length) { epub.setStatus('No rules to clear.'); return; }
    if (!confirm(`Remove all ${rulesApi.rules.length} rule(s)?`)) return;
    rulesApi.clearRules(); epub.setStatus('Rules cleared.');
  };

  const handleSaveRenames = (renames) => { setChapterRenames(renames); setRenameOpen(false); epub.setStatus(`${Object.keys(renames).length} chapter(s) renamed.`); };
  const handleFnrApply = (repls) => { repls.forEach(({ chIdx, replaced }) => epub.applyChapterContent(chIdx, replaced)); setFnrOpen(false); epub.setStatus(`Applied to ${repls.length} chapter(s).`); };

  // CHANGE 1: preview only injects into the frame — customCss is already live via onCssChange
  const handleCssPreview = (css) => { previewRef.current?.injectCss(css); };
  const handleCssClearPreview = () => { previewRef.current?.clearCss(); };

  const handleDownload = async () => {
    if (!epub.zip) return;
    epub.setStatus('Building EPUB…');
    try {
      const newTitle = currentTitle.trim() || epub.epubTitle;
      const newZip = await buildDownloadZip(JSZip, { zip: epub.zip, chapters: epub.chapters, rules: rulesApi.rules, chapterRenames, excludedChapters, opfPath: epub.opfPath, opfBase: epub.opfBase, newTitle, epubTitle: epub.epubTitle, newCoverData: epub.newCoverData, coverPath: epub.coverPath, finalCss: customCss });
      const blob = await newZip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
      const safeName = newTitle.replace(/[^a-z0-9 _-]/gi, '').trim() || 'cleaned';
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${safeName}.epub`; a.click();
      epub.setStatus(`Downloaded: ${safeName}.epub`);
    } catch (e) { epub.setStatus('Error: ' + e.message); }
  };

  const handleLogoClick = () => {
    if (epub.loaded) {
      epub.reset();
      setChapterRenames({});
      setExcludedChapters(new Set());
      setCurrentTitle('');
      setCoverChanged(false);
      setCustomCss('');
      setActionBar({ visible: false, x: 0, y: 0, origLabel: '', selector: '' });
      epub.setStatus('');
    }
  };

  useEffect(() => {
    const handler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) rulesApi.undo(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [rulesApi.undo]);

  const outputFilename = ((currentTitle || epub.epubTitle || 'cleaned').replace(/[^a-z0-9 _-]/gi, '').trim() || 'cleaned') + '.epub';
  const currentChapter = epub.chapters[epub.currentIdx];

  return (
    <div className={styles.app}>
      {/* Ambient blobs */}
      <div className="blob-layer">
        <div className="blob blob-1" /><div className="blob blob-2" />
        <div className="blob blob-3" /><div className="blob blob-4" />
      </div>

      {/* AppBar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <img
            className={styles.logo}
            src="/BulkQuil.png"
            alt="BulkQuil Logo"
            onClick={handleLogoClick}
            style={{ cursor: epub.loaded ? 'pointer' : 'default' }}
          />
        </div>
        <div className={styles.headerRight}>
          <button className={styles.iconBtn} title="Help" onClick={() => setHelpOpen(true)}>?</button>
        </div>
      </header>

      {/* Upload landing */}
      {!epub.loaded && (
        <main className={styles.landing}>
          <div className={styles.heroSection}>
            <h1 className={styles.heroTitle}>
              The Intelligent EPUB Editor
            </h1>
            <p className={styles.heroSubtitle}>
              Craft, clean, and control your manuscripts with precision.<br />A modern canvas designed for authors and publishers.
            </p>
          </div>

          <UploadZone onFile={epub.loadFile} />

          <div className={styles.featuresHeader}>
            <h4 className={styles.featuresTitle}>Intelligent Capabilities</h4>
            <p className={styles.featuresSubtitle}>Tools designed to stay out your way</p>
          </div>
          <div className={styles.featuresGrid}>
            {[
              {
                icon: <IconEraser stroke={2} />,
                title: 'Smart Cleaning',
                desc: 'Strip redundant styles, fix malformed HTML, standardize structure with CSS selector rules.',
                iconBg: 'rgba(59, 130, 246, 0.1)'
              },
              {
                icon: <IconCode stroke={2} />,
                title: 'CSS Control',
                desc: 'Manage global styles. Inject custom CSS that travels with your EPUB on download.',
                iconBg: 'rgba(16, 185, 129, 0.1)'
              },
              {
                icon: <IconEye stroke={2} />,
                title: 'Live Preview',
                desc: 'Click any element to inspect, remove, or keep it. See changes instantly.',
                iconBg: 'rgba(245, 158, 11, 0.1)'
              },
            ].map(c => (
              <div key={c.title} className={styles.featureCard}>
                <div className={styles.featureIcon} style={{ background: c.iconBg }}>
                  {c.icon}
                </div>
                <h3 className={styles.featureCardTitle}>{c.title}</h3>
                <p className={styles.featureCardDesc}>{c.desc}</p>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Editor workspace */}
      {epub.loaded && (
        <div className={styles.workspace}>
          <Sidebar
            coverUrl={epub.coverUrl} epubTitle={epub.epubTitle} currentTitle={currentTitle}
            coverChanged={coverChanged} onCoverChange={handleCoverChange} onTitleChange={setCurrentTitle}
            chapters={epub.chapters} currentIdx={epub.currentIdx} chapterRenames={chapterRenames}
            excludedChapters={excludedChapters} onSelectChapter={handleSelectChapter} onToggleExclude={handleToggleExclude}
            onRenameChapters={() => setRenameOpen(true)} onFindReplace={() => setFnrOpen(true)}
            onDownload={handleDownload} outputFilename={outputFilename}
            rules={rulesApi.rules} onRemoveRule={(i) => rulesApi.removeRule(i, rulesApi.rules)}
            onSaveRules={handleSaveRules} onLoadRules={handleLoadRules} onClearRules={handleClearRules}
          />
          <PreviewPanel
            ref={previewRef} chapter={currentChapter} rules={rulesApi.rules}
            viewMode={viewMode} onViewModeChange={setViewMode}
            onSelectElement={handleSelectElement} status={epub.status}
          />
          {/* CHANGE 2 + 3: pass cssValue and onCssChange so CssPane always syncs to App state */}
          <RightPanel
            ref={rightPanelRef}
            chapter={currentChapter} rules={rulesApi.rules}
            onAddRule={handleAddRuleFromTree} onHighlightPreview={handleHighlightPreview}
            cssValue={customCss} onCssChange={setCustomCss}
            onCssPreview={handleCssPreview} onCssClearPreview={handleCssClearPreview}
          />
        </div>
      )}

      <ActionBar
        visible={actionBar.visible} x={actionBar.x} y={actionBar.y}
        origLabel={actionBar.origLabel} initialSelector={actionBar.selector}
        previewFrameRef={previewFrameRef}
        onRemove={handleRemoveRule} onKeepOnly={handleKeepOnly}
        onHighlightTree={handleHighlightTree} onClose={() => setActionBar(p => ({ ...p, visible: false }))}
      />
      <RenameModal visible={renameOpen} chapters={epub.chapters} chapterRenames={chapterRenames} onSave={handleSaveRenames} onClose={() => setRenameOpen(false)} />
      <FindReplaceModal visible={fnrOpen} chapters={epub.chapters} currentIdx={epub.currentIdx} onApply={handleFnrApply} onClose={() => setFnrOpen(false)} />
      <UndoToast visible={rulesApi.toastVisible} message={rulesApi.toastMsg} onUndo={rulesApi.undo} />
      <HelpModal visible={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}