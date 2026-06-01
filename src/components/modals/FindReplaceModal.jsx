import { useState } from 'react';
import styles from './FindReplaceModal.module.css';

export default function FindReplaceModal({ visible, chapters, currentIdx, onApply, onClose }) {
  const [findVal, setFindVal]   = useState('');
  const [replaceVal, setReplaceVal] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [scope, setScope]       = useState('all');
  const [summary, setSummary]   = useState('');
  const [matches, setMatches]   = useState([]);
  const [replacements, setReplacements] = useState([]);

  const buildRegex = () => {
    if (!findVal) return null;
    const flags = 'g' + (caseSensitive ? '' : 'i');
    try { return new RegExp(useRegex ? findVal : findVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags); }
    catch(e) { return null; }
  };

  const preview = () => {
    const regex = buildRegex();
    if (!findVal || !regex) { setSummary('Enter a search term first.'); setMatches([]); return; }
    const targets = scope === 'current'
      ? [{ ch: chapters[currentIdx], idx: currentIdx }]
      : chapters.map((ch, idx) => ({ ch, idx }));
    let total = 0, affected = 0;
    const rows = [], repls = [];
    targets.forEach(({ ch, idx }) => {
      const doc = new DOMParser().parseFromString(ch.originalHtml, 'text/html');
      const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) textNodes.push(node);
      let count = 0;
      textNodes.forEach(tn => { const m = tn.textContent.match(regex); if (m) count += m.length; regex.lastIndex = 0; });
      if (count === 0) return;
      affected++; total += count;
      repls.push({ chIdx: idx, replaced: ch.originalHtml.replace(regex, replaceVal) });
      regex.lastIndex = 0;
      const sample = textNodes.find(tn => { regex.lastIndex = 0; return regex.test(tn.textContent); });
      regex.lastIndex = 0;
      const sampleText = sample ? sample.textContent.slice(0, 120) : '';
      const highlighted = sampleText.replace(regex, m => `<mark>${m}</mark>`);
      regex.lastIndex = 0;
      const after = sampleText.replace(regex, `<span class="new-mark">${replaceVal}</span>`).slice(0, 120);
      regex.lastIndex = 0;
      rows.push({ idx, title: ch.title, count, highlighted, after });
    });
    if (total === 0) { setSummary('No matches found.'); setMatches([]); setReplacements([]); }
    else { setSummary(`${total} match${total!==1?'es':''} across ${affected} chapter${affected!==1?'s':''}`); setMatches(rows); setReplacements(repls); }
  };

  const apply = () => {
    if (!replacements.length) return;
    onApply(replacements);
    setReplacements([]); setMatches([]); setSummary('');
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <h3>Find &amp; Replace in Content</h3>
        <div className={styles.inputs}>
          <div>
            <label>Find</label>
            <input type="text" placeholder="Text to find…" value={findVal}
              onChange={e => setFindVal(e.target.value)} onKeyDown={e => e.key==='Enter' && preview()} />
          </div>
          <div>
            <label>Replace with</label>
            <input type="text" placeholder="Replacement (blank to delete)…" value={replaceVal}
              onChange={e => setReplaceVal(e.target.value)} />
          </div>
        </div>
        <div className={styles.options}>
          <label><input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} /> Case sensitive</label>
          <label><input type="checkbox" checked={useRegex} onChange={e => setUseRegex(e.target.checked)} /> Regex</label>
          <label>Scope <select value={scope} onChange={e => setScope(e.target.value)}>
            <option value="all">Entire Manuscript</option>
            <option value="current">Current chapter</option>
          </select></label>
          <button className={styles.previewBtn} onClick={preview}>Refresh</button>
        </div>

        {summary && <div className={styles.summary}>{summary}</div>}

        <div className={styles.matchList}>
          {matches.map((m, i) => (
            <div key={i} className={styles.matchRow}>
              <div className={styles.chLabel}>
                {m.title}
                <span className={styles.lineBadge}>{m.count} match{m.count!==1?'es':''}</span>
              </div>
              <div className={styles.before}><span className={styles.diffLabel}>OLD:</span><span dangerouslySetInnerHTML={{ __html: `…${m.highlighted}…` }} /></div>
              <div className={styles.after}><span className={styles.diffLabel}>NEW:</span><span dangerouslySetInnerHTML={{ __html: `…${m.after}…` }} /></div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.applyBtn} onClick={apply} disabled={!replacements.length}>
            Apply to {replacements.length || '…'} chapter{replacements.length !== 1 ? 's' : ''} ↗
          </button>
        </div>
      </div>
    </div>
  );
}
