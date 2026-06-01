import { useState } from 'react';
import { CSS_PRESETS } from '../../utils/epub';
import styles from './CssPane.module.css';

export default function CssPane({ onPreview, onClearPreview }) {
  const [cssValue, setCssValue] = useState('');
  const [status, setStatus]     = useState('');
  const [fontSize, setFontSize]   = useState('');
  const [lineHeight, setLineH]    = useState('');
  const [fontFamily, setFontFam]  = useState('');
  const [paraSpacing, setParaSp]  = useState('');
  const [textAlign, setTextAl]    = useState('');
  const [maxWidth, setMaxW]       = useState('');

  const buildQuick = (fs,lh,ff,ps,ta,mw) => {
    const b = []; const p = [];
    if(fs) b.push(`  font-size: ${fs};`);
    if(lh) b.push(`  line-height: ${lh};`);
    if(ff) b.push(`  font-family: ${ff};`);
    if(ta) b.push(`  text-align: ${ta};`);
    if(mw) b.push(`  max-width: ${mw};\n  margin: 0 auto;`);
    if(ps) p.push(`  margin-bottom: ${ps};`);
    return (b.length?`body {\n${b.join('\n')}\n}\n`:'') + (p.length?`p {\n${p.join('\n')}\n}\n`:'');
  };

  const syncQuick = (ov={}) => {
    const q = buildQuick(ov.fontSize??fontSize, ov.lineHeight??lineHeight, ov.fontFamily??fontFamily, ov.paraSpacing??paraSpacing, ov.textAlign??textAlign, ov.maxWidth??maxWidth);
    setCssValue(prev => prev.includes('/* quick-start */')
      ? prev.replace(/\/\* quick-start \*\/[\s\S]*?\/\* quick-end \*\//, `/* quick-start */\n${q}/* quick-end */`)
      : `/* quick-start */\n${q}/* quick-end */\n${prev}`);
  };

  const onPreset = (p) => {
    if(p==='clear'){ setCssValue(''); setStatus('Cleared.'); return; }
    setCssValue(CSS_PRESETS[p]||''); setStatus(`Preset "${p}" loaded.`);
  };

  return (
    <div className={styles.pane}>
      <div className={styles.presets}>
        {['readable','compact','justify','clean','clear'].map(p => (
          <button key={p} className={styles.presetBtn} onClick={() => onPreset(p)}>{p.charAt(0).toUpperCase()+p.slice(1)}</button>
        ))}
      </div>
      <div className={styles.quick}>
        {[
          ['Font size','text',fontSize,v=>{setFontSize(v);syncQuick({fontSize:v});},'e.g. 1rem'],
          ['Line height','text',lineHeight,v=>{setLineH(v);syncQuick({lineHeight:v});},'e.g. 1.7'],
          ['Para spacing','text',paraSpacing,v=>{setParaSp(v);syncQuick({paraSpacing:v});},'e.g. 0.8em'],
          ['Max width','text',maxWidth,v=>{setMaxW(v);syncQuick({maxWidth:v});},'e.g. 680px'],
        ].map(([label,,value,onChange,placeholder]) => (
          <div key={label} className={styles.quickField}>
            <label>{label}</label>
            <input className={styles.quickInput} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} />
          </div>
        ))}
        <div className={styles.quickField}>
          <label>Font family</label>
          <select className={styles.quickSelect} value={fontFamily} onChange={e=>{setFontFam(e.target.value);syncQuick({fontFamily:e.target.value});}}>
            <option value="">— unchanged —</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="Palatino, serif">Palatino</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Verdana, sans-serif">Verdana</option>
          </select>
        </div>
        <div className={styles.quickField}>
          <label>Text align</label>
          <select className={styles.quickSelect} value={textAlign} onChange={e=>{setTextAl(e.target.value);syncQuick({textAlign:e.target.value});}}>
            <option value="">— unchanged —</option>
            <option value="left">Left</option>
            <option value="justify">Justify</option>
            <option value="center">Center</option>
          </select>
        </div>
      </div>
      <div className={styles.editorLabel}>
        <span>Raw CSS</span>
        <button className={styles.syncBtn} onClick={() => syncQuick()}>↺ Sync</button>
      </div>
      <textarea className={styles.editor} value={cssValue} onChange={e=>setCssValue(e.target.value)} spellCheck={false} placeholder="/* your custom CSS here */" />
      <div className={styles.cssActions}>
        <button className={`${styles.cssBtn} ${styles.previewCssBtn}`} onClick={()=>{if(!cssValue.trim()){setStatus('Write some CSS first.');return;}onPreview(cssValue);setStatus('Preview updated.');}}>⊙ Preview</button>
        <button className={styles.cssBtn} onClick={()=>{onClearPreview();setStatus('Preview cleared.');}}>✕ Clear</button>
      </div>
      {status && <p className={styles.cssStatus}>{status}</p>}
    </div>
  );
}
