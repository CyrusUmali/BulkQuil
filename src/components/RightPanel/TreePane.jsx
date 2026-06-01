import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { buildSelector, buildLabel } from '../../utils/epub';
import styles from './TreePane.module.css';

const TreePane = forwardRef(function TreePane({ chapter, rules, onAddRule, onHighlightPreview }, ref) {
  const [filter, setFilter] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    renderTree();
  }, [chapter, rules, filter]);

  useImperativeHandle(ref, () => ({
    highlightInTree(selector) {
      const container = containerRef.current;
      if (!container) return;
      container.querySelectorAll(`.${styles.active}`).forEach(r => r.classList.remove(styles.active));
      const target = container.querySelector(`[data-sel="${CSS.escape(selector)}"]`);
      if (target) {
        let p = target.parentElement;
        while (p && p !== container) {
          if (p.classList.contains(styles.children)) p.classList.add(styles.open);
          p = p.parentElement;
        }
        target.classList.add(styles.active);
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }));

  function renderTree() {
    const container = containerRef.current;
    if (!container || !chapter) return;
    container.innerHTML = '';

    const parser = new DOMParser();
    const doc    = parser.parseFromString(chapter.originalHtml, 'text/html');
    doc.body.querySelectorAll('script,style').forEach(el => el.remove());

    function makeNode(el) {
      if (el.nodeType !== 1) return null;
      const tag    = el.tagName.toLowerCase();
      const sel    = buildSelector(el);
      const isRuled = rules.some(r => r.selector === sel);
      const idStr  = el.id ? `#${el.id}` : '';
      const clsArr = [...el.classList].filter(c =>
        !c.startsWith('sm:') && !c.startsWith('&') && !c.startsWith('<')
      ).slice(0, 3);
      const clsStr = clsArr.join(' .');
      const textPreview = [...el.childNodes]
        .filter(n => n.nodeType === 3)
        .map(n => n.textContent.trim())
        .join(' ')
        .slice(0, 40);

      if (filter) {
        const hay = (tag + idStr + clsStr).toLowerCase();
        if (!hay.includes(filter.toLowerCase())) return null;
      }

      const hasChildren = el.children.length > 0;

      const node = document.createElement('div');
      node.className = styles.node;
      node.dataset.sel = sel;

      const row = document.createElement('div');
      row.className = [styles.row, isRuled ? styles.ruled : ''].filter(Boolean).join(' ');
      row.dataset.sel = sel;

      const toggle = document.createElement('span');
      toggle.className = styles.toggle;
      toggle.textContent = hasChildren ? '▶' : ' ';

      const tagSpan = document.createElement('span');
      tagSpan.className = styles.tag;
      tagSpan.textContent = tag;

      const idSpan = document.createElement('span');
      idSpan.className = styles.id;
      idSpan.textContent = idStr;

      const clsSpan = document.createElement('span');
      clsSpan.className = styles.cls;
      clsSpan.textContent = clsStr ? '.' + clsStr : '';
      clsSpan.title = sel;

      const prevSpan = document.createElement('span');
      prevSpan.className = styles.preview;
      prevSpan.textContent = textPreview;

      const actions = document.createElement('div');
      actions.className = styles.actions;

      const btnHL = document.createElement('button');
      btnHL.textContent = '⊙';
      btnHL.title = 'Highlight in preview';
      btnHL.addEventListener('click', e => {
        e.stopPropagation();
        onHighlightPreview(sel);
        container.querySelectorAll(`.${styles.active}`).forEach(r => r.classList.remove(styles.active));
        row.classList.add(styles.active);
      });

      const btnRM = document.createElement('button');
      btnRM.textContent = '✕';
      btnRM.className = styles.danger;
      btnRM.title = 'Add remove rule';
      btnRM.addEventListener('click', e => {
        e.stopPropagation();
        onAddRule(sel, buildLabel(el), 'remove');
      });

      actions.appendChild(btnHL);
      actions.appendChild(btnRM);
      row.appendChild(toggle);
      row.appendChild(tagSpan);
      row.appendChild(idSpan);
      row.appendChild(clsSpan);
      row.appendChild(prevSpan);
      row.appendChild(actions);

      const children = document.createElement('div');
      children.className = styles.children;

      row.addEventListener('click', () => {
        if (hasChildren) {
          const open = children.classList.toggle(styles.open);
          toggle.textContent = open ? '▼' : '▶';
        }
        onHighlightPreview(sel);
        container.querySelectorAll(`.${styles.active}`).forEach(r => r.classList.remove(styles.active));
        row.classList.add(styles.active);
      });

      node.appendChild(row);

      if (hasChildren) {
        [...el.children].forEach(child => {
          const childNode = makeNode(child);
          if (childNode) children.appendChild(childNode);
        });
        node.appendChild(children);
      }

      return node;
    }

    [...doc.body.children].forEach(child => {
      const node = makeNode(child);
      if (node) container.appendChild(node);
    });
  }

  return (
    <div className={styles.pane}>
      <input
        type="text"
        className={styles.search}
        placeholder="filter by tag / class / id…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className={styles.tree} ref={containerRef} />
    </div>
  );
});

export default TreePane;