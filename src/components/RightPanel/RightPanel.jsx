import { useState, useRef ,useEffect, useImperativeHandle, forwardRef } from 'react';
import TreePane from './TreePane';
import CssPane from './CssPane';
import styles from './RightPanel.module.css';

const RightPanel = forwardRef(function RightPanel(
  { chapter, rules, onAddRule, onHighlightPreview,
    cssValue, onCssChange, onCssPreview, onCssClearPreview },
  ref
) {
  const [activeTab, setActiveTab] = useState('tree');
  const treePaneRef = useRef(null);

  useImperativeHandle(ref, () => ({
    highlightInTree(selector) {
      console.log('[RightPanel] highlightInTree called, selector:', selector);
      setActiveTab('tree');
      treePaneRef.current?.highlightInTree(selector);
    },
  }));

  useEffect(() => {
    console.log('[RightPanel] chapter prop changed:', chapter?.title, '| ref:', ref, '| treePaneRef:', treePaneRef.current);
  }, [chapter]);

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'tree' ? styles.active : ''}`}
          onClick={() => setActiveTab('tree')}
        >Tree</button>
        <button
          className={`${styles.tab} ${activeTab === 'css' ? styles.active : ''}`}
          onClick={() => setActiveTab('css')}
        >CSS</button>
      </div>

      <div className={styles.paneWrapper}>
        {/* Both panes stay mounted so treePaneRef is never null */}
        <div style={{ display: activeTab === 'tree' ? 'flex' : 'none', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <TreePane
            ref={treePaneRef}
            chapter={chapter}
            rules={rules}
            onAddRule={onAddRule}
            onHighlightPreview={onHighlightPreview}
          />
        </div>
        <div style={{ display: activeTab === 'css' ? 'flex' : 'none', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <CssPane
            cssValue={cssValue}
            onCssChange={onCssChange}
            onPreview={onCssPreview}
            onClearPreview={onCssClearPreview}
          />
        </div>
      </div>
    </div>
  );
});

export default RightPanel;
