import { useRef } from 'react';
import styles from './MetaPanel.module.css';

export default function MetaPanel({ coverUrl, epubTitle, currentTitle, onCoverChange, onTitleChange, coverChanged }) {
  const coverInputRef = useRef(null);

  return (
    <div className={styles.panel}>
      <div className={styles.coverWrap} onClick={() => coverInputRef.current.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = [...e.dataTransfer.files].find(f => f.type.startsWith('image/')); if (f) onCoverChange(f); }}>
        {coverUrl
          ? <img className={styles.cover} src={coverUrl} alt="Cover" />
          : <div className={styles.cover} style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'var(--outline)', fontSize:12 }}>No cover</div>
        }
        <div className={styles.coverOverlay}>
          <span className={styles.coverHint}>CHANGE COVER</span>
        </div>
        {coverChanged && <span className={styles.badge}>cover changed</span>}
      </div>
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={(e) => { if (e.target.files[0]) onCoverChange(e.target.files[0]); e.target.value=''; }} />

      <label className={styles.label} htmlFor="meta-title">Book Title</label>
      <input
        id="meta-title"
        className={`${styles.titleInput} ${currentTitle !== epubTitle ? styles.changed : ''}`}
        type="text"
        value={currentTitle}
        placeholder="Book title…"
        onChange={(e) => onTitleChange(e.target.value)}
      />
    </div>
  );
}
