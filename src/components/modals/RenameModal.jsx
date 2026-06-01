import { useState, useEffect } from 'react';
import styles from './RenameModal.module.css';

export default function RenameModal({ visible, chapters, chapterRenames, onSave, onClose }) {
  const [drafts, setDrafts] = useState([]);
  const [find, setFind]     = useState('');
  const [replace, setReplace] = useState('');

  useEffect(() => {
    if (visible) {
      setDrafts(chapters.map((ch, i) => ({ idx: i, value: chapterRenames[i] ?? ch.title, original: ch.title })));
      setFind(''); setReplace('');
    }
  }, [visible, chapters, chapterRenames]);

  const applyAll = () => {
    if (!find) return;
    setDrafts(prev => prev.map(d => ({ ...d, value: d.value.split(find).join(replace) })));
  };
  const reset = () => setDrafts(prev => prev.map(d => ({ ...d, value: d.original })));
  const save = () => {
    const renames = {};
    drafts.forEach(d => { if (d.value.trim() && d.value.trim() !== d.original) renames[d.idx] = d.value.trim(); });
    onSave(renames);
  };

  const pendingCount = drafts.filter(d => d.value !== d.original).length;
  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <h3>Rename Chapters</h3>

        <div className={styles.controls}>
          <input className={styles.findInput} placeholder="Find…" value={find} onChange={e => setFind(e.target.value)} />
          <span className={styles.arrow}>→</span>
          <input className={styles.replaceInput} placeholder="Replace…" value={replace} onChange={e => setReplace(e.target.value)} />
          <button className={styles.ctrlBtn} onClick={applyAll}>Apply All</button>
        </div>

        <div className={styles.list}>
          {drafts.map((d, i) => (
            <div key={i} className={styles.row}>
              <span className={styles.num}>{String(d.idx+1).padStart(2,'0')}</span>
              <input
                type="text"
                className={`${styles.rowInput} ${d.value !== d.original ? styles.changed : ''}`}
                value={d.value}
                onChange={e => setDrafts(prev => prev.map((x,j) => j===i ? {...x, value: e.target.value} : x))}
              />
            </div>
          ))}
        </div>

        {pendingCount > 0 && (
          <div className={styles.pendingIndicator}>
            <span className={styles.pendingDot}>{pendingCount}</span>
            {pendingCount} chapter{pendingCount !== 1 ? 's' : ''} have pending changes
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
