import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { parseEpub, loadCoverUrl } from '../utils/epub';

export function useEpub() {
  const [zip, setZip]               = useState(null);
  const [chapters, setChapters]     = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [opfPath, setOpfPath]       = useState('');
  const [opfBase, setOpfBase]       = useState('');
  const [epubTitle, setEpubTitle]   = useState('');
  const [coverPath, setCoverPath]   = useState('');
  const [coverUrl, setCoverUrl]     = useState(null);
  const [newCoverData, setNewCoverData] = useState(null);
  const [newCoverUrl, setNewCoverUrl]   = useState(null);
  const [status, setStatus]         = useState('');
  const [loaded, setLoaded]         = useState(false);

  const loadFile = useCallback(async (file) => {
    if (!file || !file.name.endsWith('.epub')) {
      alert('Please select a valid .epub file.');
      return;
    }
    setStatus('Loading…');
    try {
      const z = await JSZip.loadAsync(file);
      const parsed = await parseEpub(z);
      setZip(z);
      setOpfPath(parsed.opfPath);
      setOpfBase(parsed.opfBase);
      setEpubTitle(parsed.epubTitle);
      setCoverPath(parsed.coverPath);
      setChapters(parsed.chapters);
      setCurrentIdx(0);
      setLoaded(true);

      const url = await loadCoverUrl(z, parsed.coverPath);
      setCoverUrl(url);
      setStatus(`Loaded ${parsed.chapters.length} chapters.`);
    } catch (err) {
      setStatus('Error loading EPUB: ' + err.message);
    }
  }, []);

  const applyChapterContent = useCallback((chIdx, newHtml) => {
    setChapters(prev => prev.map((ch, i) =>
      i === chIdx ? { ...ch, originalHtml: newHtml } : ch
    ));
  }, []);

  const applyCoverFile = useCallback(async (file) => {
    const ab = await file.arrayBuffer();
    if (newCoverUrl) URL.revokeObjectURL(newCoverUrl);
    const url = URL.createObjectURL(new Blob([ab], { type: file.type }));
    setNewCoverData({ arrayBuffer: ab, mimeType: file.type });
    setNewCoverUrl(url);
    setStatus('Cover updated — will be saved on download.');
  }, [newCoverUrl]);

  // Reset method to clear all state and return to landing page
  const reset = useCallback(() => {
    // Revoke object URLs to prevent memory leaks
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    if (newCoverUrl) URL.revokeObjectURL(newCoverUrl);
    
    setZip(null);
    setChapters([]);
    setCurrentIdx(0);
    setOpfPath('');
    setOpfBase('');
    setEpubTitle('');
    setCoverPath('');
    setCoverUrl(null);
    setNewCoverData(null);
    setNewCoverUrl(null);
    setStatus('');
    setLoaded(false);
  }, [coverUrl, newCoverUrl]);

  return {
    zip, chapters, setChapters,
    currentIdx, setCurrentIdx,
    opfPath, opfBase,
    epubTitle, setEpubTitle,
    coverPath,
    coverUrl: newCoverUrl || coverUrl,
    newCoverData,
    status, setStatus,
    loaded,
    loadFile,
    applyChapterContent,
    applyCoverFile,
    reset, // Export the reset method
  };
}