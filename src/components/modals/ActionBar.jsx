import { useEffect, useState } from 'react';
import styles from './ActionBar.module.css';

import { IconRowRemove , IconListTree , IconArchive } from '@tabler/icons-react';
export default function ActionBar({ visible, x, y, origLabel, initialSelector, previewFrameRef, onRemove, onKeepOnly, onHighlightTree, onClose }) {

  

  const [selector, setSelector] = useState(initialSelector || '');

useEffect(() => {
  if (visible) setSelector(initialSelector || '');
}, [visible, initialSelector]);


  // State for match info (updated in effect, not during render)
  const [matchInfo, setMatchInfo] = useState({ count: 0, state: '' });

  // Effect handles BOTH DOM manipulation AND match info calculation
  useEffect(() => {
    const frame = previewFrameRef?.current;
    if (!frame) {
      setMatchInfo({ count: 0, state: '' });
      return;
    }
    
    // Clean up previous highlights
    frame.querySelectorAll('.pv-live').forEach(el => el.classList.remove('pv-live'));
    
    // Handle empty selector
    if (!selector) {
      setMatchInfo({ count: 0, state: '' });
      return;
    }
    
    // Calculate matches and update both DOM and state
    try {
      const matches = frame.querySelectorAll(selector);
      const n = matches.length;
      
      // Update match info state
      if (n === 0) setMatchInfo({ count: 0, state: 'error' });
      else if (n === 1) setMatchInfo({ count: 1, state: 'safe' });
      else if (n <= 3) setMatchInfo({ count: n, state: 'warn' });
      else setMatchInfo({ count: n, state: 'danger' });
      
      // Update DOM highlights
      matches.forEach(el => el.classList.add('pv-live'));
    } catch(e) {
      // Invalid selector
      setMatchInfo({ count: 0, state: 'invalid' });
      console.warn('Invalid selector:', selector, e);
    }
  }, [selector, previewFrameRef]);

  const bw = 340, bh = 160;
  const padding = 10;
  let left = x + 14, top = y + 14;
  
  if (typeof window !== 'undefined') {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
  
    // Try left of tap if it would overflow right
    if (left + bw > vw - padding) left = x - bw - 14;
    // If still off-screen on the left, clamp to edge
    if (left < padding) left = padding;
  
    // Try above tap if it would overflow bottom
    if (top + bh > vh - padding) top = y - bh - 14;
    // If still off-screen on top, clamp to edge
    if (top < padding) top = padding;
  
    // On narrow screens (mobile), override and center horizontally
    if (vw < 480) {
      left = Math.max(padding, (vw - bw) / 2);
    }
  }
  
  if (!visible) return null;

  const matchLabel = () => {
    if (matchInfo.state === 'invalid') return 'invalid selector';
    if (matchInfo.state === 'error') return '0 matches';
    if (matchInfo.state === 'safe') return '1 match ✓';
    if (matchInfo.state === 'warn') return `${matchInfo.count} matches ⚠`;
    if (matchInfo.state === 'danger') return `${matchInfo.count} matches`;
    return '';
  };

  return (
    <div className={styles.bar} style={{ left, top }}>
      <div className={styles.top}>
        <span className={styles.orig}>{origLabel}</span>
        <button className={styles.close} onClick={onClose}>✕</button>
      </div>
      <div className={styles.middle}>
        <label className={styles.selLabel}>Selector</label>
        <input
          className={`${styles.selectorInput} ${matchInfo.state === 'invalid' ? styles.invalid : ''}`}
          value={selector}
          onChange={(e) => setSelector(e.target.value)}
          spellCheck={false}
        />
        <span className={`${styles.count} ${styles[matchInfo.state] || ''}`}>{matchLabel()}</span>
      </div>
      <div className={styles.bottom}> 
        <button onClick={() => onRemove(selector)}><IconRowRemove stroke={1} size={13} /> Remove</button>
        <button className={styles.safeBtn} onClick={() => onKeepOnly(selector)}><IconArchive  stroke={1} size={13} /> Keep only</button>
        <button className={styles.safeBtn} onClick={() => onHighlightTree(selector)}> <IconListTree  stroke={1} size={13} />  Tree</button>
      </div>
    </div>
  );
}