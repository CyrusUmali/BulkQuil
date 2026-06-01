import styles from './ChapterList.module.css';

export default function ChapterList({ chapters, currentIdx, chapterRenames, excludedChapters, onSelect, onToggleExclude }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionLabel}>
          Chapters
          {excludedChapters.size > 0 && <span className={styles.exclCount}> · {excludedChapters.size} excluded</span>}
        </span>
      </div>
      <div className={styles.list}>
        {chapters.map((ch, i) => {
          const title = chapterRenames[i] !== undefined ? chapterRenames[i] : ch.title;
          const isActive = i === currentIdx;
          const isExcluded = excludedChapters.has(i);
          return (
            <div
              key={i}
              className={[styles.item, isActive && styles.active, isExcluded && styles.excluded].filter(Boolean).join(' ')}
              onClick={() => onSelect(i)}
            >
              <span className={styles.dragIcon}>⠿</span>
              <span className={styles.label} title={title}
                style={chapterRenames[i] ? { fontStyle:'italic' } : {}}>
                {String(i+1).padStart(2,'0')}. {title}
              </span>
              <button className={styles.exclBtn}
                title={isExcluded ? 'Include chapter' : 'Exclude chapter'}
                onClick={(e) => { e.stopPropagation(); onToggleExclude(i); }}>
                {isExcluded ? '✕' : '⊘'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
