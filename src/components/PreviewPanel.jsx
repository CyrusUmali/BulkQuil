import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { buildSelector, buildLabel, applyRulesToHtml } from '../utils/epub';
import styles from './PreviewPanel.module.css';

import { IconArrowUp, IconArrowDown } from '@tabler/icons-react';

const PreviewPanel = forwardRef(function PreviewPanel(
  { chapter, rules, viewMode, onViewModeChange, onSelectElement, status },
  ref
) {
  const frameRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const [atBottom, setAtBottom] = useState(false);

  useImperativeHandle(ref, () => ({
    highlightSelector(selector) {
      const frame = frameRef.current;
      if (!frame) return;
      frame.querySelectorAll('.pv-selected').forEach(el => el.classList.remove('pv-selected'));
      try {
        const matches = frame.querySelectorAll(selector);
        matches.forEach(el => el.classList.add('pv-selected'));
        if (matches.length) matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {}
    },
    clearHighlights() {
      const frame = frameRef.current;
      if (!frame) return;
      frame.querySelectorAll('.pv-selected, .pv-live').forEach(el => el.classList.remove('pv-selected', 'pv-live'));
    },
    injectCss(css) {
      const frame = frameRef.current;
      if (!frame) return;
      let styleEl = frame.querySelector('#epub-editor-preview-style');
      if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'epub-editor-preview-style'; frame.prepend(styleEl); }
      styleEl.textContent = css;
    },
    clearCss() {
      const frame = frameRef.current;
      const styleEl = frame?.querySelector('#epub-editor-preview-style');
      if (styleEl) styleEl.remove();
    },
  }));

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      if (!atBottom) {
        // Scroll to bottom
        scrollAreaRef.current.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        // Scroll to top
        scrollAreaRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
  };

  const checkScrollPosition = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setAtBottom(isAtBottom);
    }
  };

  useEffect(() => {
    if (!chapter) return;
    const frame = frameRef.current;
    if (!frame) return;
    const src = viewMode === 'original' ? chapter.originalHtml : applyRulesToHtml(chapter.originalHtml, rules);
    const parser = new DOMParser();
    const doc = parser.parseFromString(src, 'text/html');
    doc.body.querySelectorAll('script,style,link').forEach(el => el.remove());
    if (viewMode === 'cleaned') {
      rules.forEach(r => { try { doc.body.querySelectorAll(r.selector).forEach(el => el.classList.add('pv-ruled')); } catch(e){} });
    }
    frame.innerHTML = doc.body.innerHTML;
    if (viewMode === 'original') return;
    frame.querySelectorAll('*').forEach(el => {
      el.addEventListener('mouseover', (e) => { e.stopPropagation(); frame.querySelectorAll('.pv-hover').forEach(x => x.classList.remove('pv-hover')); el.classList.add('pv-hover'); });
      el.addEventListener('mouseout', () => el.classList.remove('pv-hover'));
      el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onSelectElement({ selector: buildSelector(el), label: buildLabel(el), x: e.clientX, y: e.clientY }); });
    });
    
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
      setAtBottom(false);
    }
    
    setTimeout(() => {
      checkScrollPosition();
    }, 100);
  }, [chapter, rules, viewMode]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener('scroll', checkScrollPosition);
      return () => scrollArea.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {/* <span className={styles.previewLabel}>Preview —</span> */}
          {chapter && <h2 className={styles.chapterTitle}>{chapter.title}</h2>}
        </div>
        <div className={styles.pillToggle}>
          <button className={`${styles.pillBtn} ${viewMode === 'cleaned' ? styles.pillActive : ''}`} onClick={() => onViewModeChange('cleaned')}>Cleaned</button>
          <button className={`${styles.pillBtn} ${viewMode === 'original' ? styles.pillActive : ''}`} onClick={() => onViewModeChange('original')}>Original</button>
          <div className={`${styles.pillIndicator} ${viewMode === 'original' ? styles.right : ''}`} />
        </div>
      </div>

      {viewMode === 'cleaned' && <p className={styles.hint}>Click any element to select it → action bar appears</p>}

      <div className={styles.scrollArea} ref={scrollAreaRef}>
        <div className={styles.articleWrap}>
          <div className={styles.glassArticle} ref={frameRef} id="__preview-frame" />
        </div>
      </div>

      <button className={styles.floatingScrollBtn} onClick={handleScroll}>
  {atBottom ? <IconArrowUp size={24} stroke={1.5} /> : <IconArrowDown size={24} stroke={1.5} />}
</button>

      <div className={styles.statusBar}>
        {status && <><div className={styles.statusDot} /><span className={styles.statusText}>{status}</span></>}
      </div>
    </div>
  );
});

export default PreviewPanel;