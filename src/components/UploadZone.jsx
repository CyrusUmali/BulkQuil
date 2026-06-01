import { useRef } from 'react';
import styles from './UploadZone.module.css';

import { DocumentArrowUpIcon } from '@heroicons/react/24/solid'


export default function UploadZone({ onFile }) {
  const inputRef = useRef(null);

  return (
    <div
      className={styles.zone}
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
    >
      <div className={styles.iconWrap}>


      <DocumentArrowUpIcon  />
      {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-2">
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
</svg> */}

      </div>
      <h2 className={styles.heading}>Upload or Drop EPUB</h2>
      <p className={styles.sub}>Supports EPUB 2 &amp; EPUB 3 · up to 50MB</p>
      <button className={styles.selectBtn} onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}>
        ↑ Select File
      </button>
      <input ref={inputRef} type="file" accept=".epub" style={{ display: 'none' }}
        onChange={(e) => onFile(e.target.files[0])} />
    </div>
  );
}
