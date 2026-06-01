import { useRef } from 'react';
import styles from './RulesPanel.module.css';

export default function RulesPanel({ rules, onRemove, onSave, onLoad, onClear }) {
  const fileInputRef = useRef(null);
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionLabel}>Active Rules ({rules.length})</span>
        <div className={styles.headActions}>
          <button className={styles.headBtn} onClick={onSave}>Save</button>
          <button className={styles.headBtn} onClick={() => fileInputRef.current.click()}>Load</button>
          <button className={`${styles.headBtn} ${styles.dangerBtn}`} onClick={onClear}>Clear</button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display:'none' }}
            onChange={(e) => { onLoad(e.target.files[0]); e.target.value=''; }} />
        </div>
      </div>
      <div className={styles.list}>
        {rules.length === 0
          ? <p className={styles.empty}>Click elements in the preview to add rules.</p>
          : rules.map((r, i) => (
            <div key={i} className={`${styles.rule} ${r.type === 'keeponly' ? styles.keeponly : styles.remove}`}>
              <span className={styles.badge}>{r.type === 'keeponly' ? 'KEEP' : 'DEL'}</span>
              <span className={styles.selector} title={r.selector}>{r.selector}</span>
              <button className={styles.del} onClick={() => onRemove(i)}>✕</button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
