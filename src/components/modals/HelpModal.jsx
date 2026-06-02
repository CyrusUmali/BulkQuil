import { useState } from 'react';
import styles from './HelpModal.module.css';

const TABS = [
  { id: 'start',  label: 'Getting started', icon: 'ti-rocket' },
  { id: 'rules',  label: 'Rules',           icon: 'ti-adjustments-horizontal' },
  { id: 'action', label: 'Action bar',      icon: 'ti-cursor-text' },
  { id: 'css',    label: 'CSS editor',      icon: 'ti-brush' },
];

function InlineCode({ children }) {
  return <code className={styles.inlineCode}>{children}</code>;
}

function Callout({ icon = 'ti-info-circle', children }) {
  return (
    <div className={styles.callout}>
      <i className={`ti ${icon}`} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function GettingStarted() {
  return (
    <div>
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Workflow</div>
        <div className={styles.steps}>
          {[
            { n: 1, text: <><strong>Upload your EPUB</strong> — drag it onto the landing page or click Select file. The app parses all chapters and loads them into the preview.</> },
            { n: 2, text: <><strong>Browse chapters</strong> — click any chapter in the left sidebar. Use the exclude button to omit chapters from the output entirely.</> },
            { n: 3, text: <><strong>Click elements to clean</strong> — in Cleaned mode, clicking any element opens the Action Bar. Set a CSS selector and choose Remove or Keep only.</> },
            { n: 4, text: <><strong>Check the Tree panel</strong> — the right panel shows the DOM structure. Use it to find elements by tag, class, or ID.</> },
            { n: 5, text: <><strong>Style with CSS</strong> — switch to the CSS tab to apply custom styles. Use presets or write raw CSS, then preview live before downloading.</> },
            { n: 6, text: <><strong>Download</strong> — hit Download EPUB. All rules, exclusions, and CSS are applied to every chapter in one clean file.</> },
          ].map(({ n, text }) => (
            <div key={n} className={styles.step}>
              <span className={styles.stepNum}>{n}</span>
              <span className={styles.stepText}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Keyboard shortcuts</div>
        <div className={styles.kbdList}>
          {[
            ['Ctrl / ⌘ Z', 'Undo last rule change'],
            ['Enter',       'Trigger preview in Find & Replace'],
            ['Click element', 'Open Action Bar for that element'],
            ['Esc',         'Close any modal or action bar'],
          ].map(([key, desc]) => (
            <div key={key} className={styles.kbdRow}>
              <span className={styles.kbdKey}>{key}</span>
              <span className={styles.kbdDesc}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RulesGuide() {
  return (
    <div>
      <div className={styles.section}>
        <p className={styles.bodyText}>
          Rules are CSS selectors paired with an action — <strong>Remove</strong> or <strong>Keep only</strong>.
          They are applied to every chapter at download time, letting you strip unwanted elements or keep only
          the content you care about. Your original file is never modified until you download.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Rule types</div>
        <div className={styles.ruleGrid}>
          <div className={`${styles.ruleCard} ${styles.ruleCardDel}`}>
            <div className={`${styles.ruleBadge} ${styles.badgeDel}`}>
              <i className="ti ti-trash" aria-hidden="true" style={{ fontSize: 11 }} />
              Remove
            </div>
            <div className={styles.ruleHead}>Delete matching elements</div>
            <p className={styles.ruleBody}>
              Removes every element matching the selector from all chapters. Use to strip navigation,
              headers, footers, ads, and junk markup.
            </p>
            <p className={styles.ruleEx}>nav, header.site-nav, .ads, #cookie-banner</p>
          </div>
          <div className={`${styles.ruleCard} ${styles.ruleCardKeep}`}>
            <div className={`${styles.ruleBadge} ${styles.badgeKeep}`}>
              <i className="ti ti-circle-dot" aria-hidden="true" style={{ fontSize: 11 }} />
              Keep only
            </div>
            <div className={styles.ruleHead}>Discard everything else</div>
            <p className={styles.ruleBody}>
              Discards everything in the chapter body <em>except</em> elements matching this selector.
              Useful for extracting just the article body from a bloated page.
            </p>
            <p className={styles.ruleEx}>article.content, div#main, .chapter-body</p>
          </div>
        </div>
        <Callout>
          <strong>Order of operations:</strong> Keep only rules run first (filtering the body), then Remove
          rules strip elements from the result. You can mix both types freely.
        </Callout>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Saving &amp; loading</div>
        <p className={styles.bodyText}>
          Use <strong>Save rules</strong> to export your ruleset as a <InlineCode>epub-rules.json</InlineCode> file.
          Load it back on any EPUB with <strong>Load rules</strong> — duplicate rules are skipped automatically.
          This lets you build a reusable cleaning profile for a specific publisher or series.
        </p>
      </div>
    </div>
  );
}

function ActionBarGuide() {
  return (
    <div>
      <div className={styles.section}>
        <p className={styles.bodyText} style={{ marginBottom: 12 }}>
          In <strong>Cleaned</strong> mode, clicking any element in the preview opens a floating Action Bar
          near your cursor. It auto-generates a CSS selector, shows a live match count, and lets you create
          a rule in one click.
        </p>

        <div className={styles.actionMock}>
          <div className={styles.actionMockRow}>
            <span className={styles.actionMockLabel}>Auto-label</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              auto: &lt;div.chapter-header&gt;
            </span>
          </div>
          <div className={styles.actionMockRow}>
            <span className={styles.actionMockLabel}>Selector</span>
            <div className={styles.mockSelector}>div.chapter-header</div>
            <span className={styles.matchCount}>
              <i className="ti ti-check" aria-hidden="true" style={{ fontSize: 11 }} />
              1 match
            </span>
          </div>
          <div className={styles.actionMockRow}>
            <span className={styles.actionMockLabel}>Actions</span>
            <div className={styles.mockBtns}>
              <div className={`${styles.mockBtn} ${styles.mockBtnRed}`}>
                <i className="ti ti-trash" aria-hidden="true" style={{ fontSize: 12 }} />
                Remove
              </div>
              <div className={`${styles.mockBtn} ${styles.mockBtnBlue}`}>
                <i className="ti ti-circle-dot" aria-hidden="true" style={{ fontSize: 12 }} />
                Keep only
              </div>
              <div className={styles.mockBtn}>
                <i className="ti ti-binary-tree-2" aria-hidden="true" style={{ fontSize: 12 }} />
                Tree
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Match count states</div>
        <div className={styles.matchStates}>
          {[
            { color: '#059669', label: '1 match ✓',       desc: 'Targets exactly one element — safe and precise.' },
            { color: '#d97706', label: '3 matches ⚠',     desc: 'Multiple elements matched — verify this is intentional.' },
            { color: '#dc2626', label: '12 matches !!',   desc: 'Many matches — likely a broad selector like a tag name.' },
            { color: '#dc2626', label: 'invalid selector', desc: 'CSS syntax error — fix before applying.' },
          ].map(({ color, label, desc }) => (
            <div key={label} className={styles.matchRow}>
              <span className={styles.matchKey} style={{ color }}>{label}</span>
              <span className={styles.matchDesc}>{desc}</span>
            </div>
          ))}
        </div>
        <Callout icon="ti-binary-tree-2">
          Click <strong>Tree</strong> to jump to that element in the DOM Tree panel on the right — useful for
          understanding where an element sits in the page structure.
        </Callout>
      </div>
    </div>
  );
}

function CssGuide() {
  return (
    <div>
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Quick controls</div>
        <p className={styles.bodyText} style={{ marginBottom: 10 }}>
          The grid of inputs at the top of the CSS tab generates a <InlineCode>body {'{}'}</InlineCode> and{' '}
          <InlineCode>p {'{}'}</InlineCode> block automatically. Click <strong>↺ Sync</strong> to push
          quick control values into the raw editor.
        </p>
        <div className={styles.ctrlGrid}>
          {[
            ['Font size',    'Sets body font size. Use rem for scalable text (e.g. 1rem, 1.1rem).'],
            ['Line height',  'Controls reading comfort. 1.6–1.8 is ideal for long-form prose.'],
            ['Font family',  'Choose from common reader-friendly typefaces.'],
            ['Para spacing', 'Sets margin-bottom on <p> elements, e.g. 0.8em.'],
            ['Text align',   'Justify suits books; left is better for screens.'],
            ['Max width',    'Constrains the content column. 650–700px is a comfortable reading width.'],
          ].map(([name, desc]) => (
            <div key={name} className={styles.ctrlRow}>
              <span className={styles.ctrlName}>{name}</span>
              <span className={styles.ctrlDesc}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Presets</div>
        <div className={styles.presetGrid}>
          {[
            { name: 'Readable',      desc: 'Georgia serif, 1rem, 1.75 line height, 680px max width. Classic book feel.' },
            { name: 'Compact',       desc: 'Smaller text, tighter spacing. Good for reference or technical content.' },
            { name: 'Justify',       desc: 'Applies text-align: justify with hyphens. Traditional printed book style.' },
            { name: 'Clean margins', desc: 'Strips nav/header/footer, constrains images, resets margins.' },
            { name: 'Clear',         desc: 'Wipes all CSS from the editor. Start fresh.' },
          ].map(p => (
            <div key={p.name} className={styles.presetCard}>
              <div className={styles.presetName}>{p.name}</div>
              <div className={styles.presetDesc}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Raw editor</div>
        <p className={styles.bodyText} style={{ marginBottom: 8 }}>
          Write any valid CSS. It is injected into every chapter's <InlineCode>&lt;head&gt;</InlineCode> as
          a linked stylesheet on download. Click <strong>⊙ Preview</strong> to see it applied live in the
          current chapter without downloading.
        </p>
        <div className={styles.codeBlock}>
          <span className={styles.codeComment}>{'/* clean, readable body */'}</span>{'\n'}
          <span className={styles.codeProp}>body</span> {'{'}{'\n'}
          {'  font-family: Georgia, serif;'}{'\n'}
          {'  max-width: 680px;'}{'\n'}
          {'  margin: 0 auto;'}{'\n'}
          {'  line-height: 1.75;'}{'\n'}
          {'}'}{'\n'}
          <span className={styles.codeComment}>{'/* hide leftover navigation */'}</span>{'\n'}
          <span className={styles.codeProp}>nav, .site-header, footer</span> {'{'}{'\n'}
          {'  display: none !important;'}{'\n'}
          {'}'}
        </div>
        <Callout icon="ti-file-type-css">
          CSS is bundled into the EPUB as a separate <InlineCode>epub-editor-custom.css</InlineCode> file
          and linked from every chapter. It loads last and won't conflict with the book's original stylesheets.
        </Callout>
      </div>
    </div>
  );
}

const TAB_CONTENT = {
  start:  <GettingStarted />,
  rules:  <RulesGuide />,
  action: <ActionBarGuide />,
  css:    <CssGuide />,
};

export default function HelpModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState('start');

  if (!visible) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.box}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="ti ti-help" aria-hidden="true" />
            </div>
            <div className={styles.headerText}>
              <h2 className={styles.title}>Help &amp; guide</h2>
              <p className={styles.subtitle}>EPUB editor documentation</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <i className={`ti ${t.icon}`} aria-hidden="true" style={{ fontSize: 14 }} />
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {TAB_CONTENT[activeTab]}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerHint}>
            <i className="ti ti-keyboard" aria-hidden="true" style={{ fontSize: 13 }} />
            Press <kbd>Esc</kbd> to close
          </span>
          <button className={styles.closeFooterBtn} onClick={onClose}>Got it</button>
        </div>

      </div>
    </div>
  );
}