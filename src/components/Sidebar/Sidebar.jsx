import MetaPanel from './MetaPanel';
import ChapterList from './ChapterList';
import RulesPanel from './RulesPanel';
import styles from './Sidebar.module.css';

export default function Sidebar({
  coverUrl, epubTitle, currentTitle, coverChanged, onCoverChange, onTitleChange,
  chapters, currentIdx, chapterRenames, excludedChapters, onSelectChapter, onToggleExclude,
  onRenameChapters, onFindReplace, onDownload, outputFilename,
  rules, onRemoveRule, onSaveRules, onLoadRules, onClearRules,
}) {
  return (
    <aside className={styles.sidebar}>

      {/* ── Scrollable content ── */}
      <div className={styles.scrollArea}>
        <MetaPanel
          coverUrl={coverUrl} epubTitle={epubTitle} currentTitle={currentTitle}
          coverChanged={coverChanged} onCoverChange={onCoverChange} onTitleChange={onTitleChange}
        />

        <ChapterList
          chapters={chapters} currentIdx={currentIdx} chapterRenames={chapterRenames}
          excludedChapters={excludedChapters} onSelect={onSelectChapter} onToggleExclude={onToggleExclude}
        />

        <div className={styles.actionsRow}>
          <button className={styles.actionBtn} onClick={onRenameChapters}>✏ Rename</button>
          <button className={styles.actionBtn} onClick={onFindReplace}>⌕ Find &amp; Replace</button>
        </div>

        <RulesPanel
          rules={rules} onRemove={onRemoveRule} onSave={onSaveRules}
          onLoad={onLoadRules} onClear={onClearRules}
        />
      </div>

      {/* ── Sticky footer — always visible ── */}
      <div className={styles.footer}>
        <button className={styles.downloadBtn} onClick={onDownload}>
          <span className={styles.downloadIcon}>↓</span>
          Download EPUB
        </button>
        <p className={styles.filename}>
          Output: <span>{outputFilename}</span>
        </p>
      </div>

    </aside>
  );
}