import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import TreePane from './TreePane';
import CssPane from './CssPane';
import styles from './RightPanel.module.css';

const RightPanel = forwardRef(function RightPanel(
  { chapter, rules, onAddRule, onHighlightPreview, onCssPreview, onCssClearPreview },
  ref
) {
  const [activeTab, setActiveTab] = useState('tree');
  const treePaneRef = useRef(null);

  // Expose highlightInTree to App — also switches to tree tab
  useImperativeHandle(ref, () => ({
    highlightInTree(selector) {
      console.log('[RightPanel] highlightInTree called, switching to tree tab, selector:', selector);
      setActiveTab('tree');
      // Wait one tick for the tab switch to render TreePane before calling into it
      setTimeout(() => {
        console.log('[RightPanel] calling treePaneRef.current.highlightInTree, ref:', treePaneRef.current);
        treePaneRef.current?.highlightInTree(selector);
      }, 0);
    },
  }));

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
        {activeTab === 'tree'
          ? <TreePane
              ref={treePaneRef}
              chapter={chapter}
              rules={rules}
              onAddRule={onAddRule}
              onHighlightPreview={onHighlightPreview}
            />
          : <CssPane onPreview={onCssPreview} onClearPreview={onCssClearPreview} />
        }
      </div>
    </div>
  );
});

export default RightPanel;
