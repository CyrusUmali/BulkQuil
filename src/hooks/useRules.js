import { useState, useCallback, useRef, useEffect } from 'react';

const STORAGE_PREFIX = 'bulkquil_rules_';
const RECENT_KEY     = 'bulkquil_recent_books';
const MAX_RECENT     = 10;

function storageKey(title) {
  return STORAGE_PREFIX + title.trim().toLowerCase().replace(/\s+/g, '_');
}

function saveRulesForBook(title, rules) {
  if (!title) return;
  try {
    localStorage.setItem(storageKey(title), JSON.stringify(rules));

    // Keep a list of recently cached book titles
    const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const filtered = recent.filter(t => t !== title);
    const next = [title, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('Could not save rules to localStorage:', e);
  }
}

export function loadRulesForBook(title) {
  if (!title) return null;
  try {
    const raw = localStorage.getItem(storageKey(title));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function getRecentBooks() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearCacheForBook(title) {
  if (!title) return;
  try {
    localStorage.removeItem(storageKey(title));
    const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.filter(t => t !== title)));
  } catch (e) {
    console.warn('Could not clear rules cache:', e);
  }
}

// ─────────────────────────────────────────────────────────────

export function useRules() {
  const [rules, setRulesRaw]      = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [toastMsg, setToastMsg]   = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer  = useRef(null);
  // Track which book title the current rules belong to
  const activeTitleRef = useRef('');

  // Wrapped setter that also persists to localStorage
  const setRules = useCallback((updater) => {
    setRulesRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRulesForBook(activeTitleRef.current, next);
      return next;
    });
  }, []);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 4000);
  }, []);

  const pushUndo = useCallback((msg, currentRules) => {
    setUndoStack(prev => {
      const next = [...prev, { rules: JSON.parse(JSON.stringify(currentRules)), msg }];
      return next.length > 50 ? next.slice(1) : next;
    });
    showToast(msg);
  }, [showToast]);

  const addRule = useCallback((selector, label, type = 'remove', currentRules) => {
    if (currentRules.some(r => r.selector === selector && r.type === type)) {
      return { error: `Rule already exists: ${selector}` };
    }
    const msg = `${type === 'keeponly' ? 'Keep-only' : 'Remove'} rule added: ${selector}`;
    pushUndo(msg, currentRules);
    setRules(prev => [...prev, { selector, label: label || selector, type }]);
    return { ok: true, msg: `Rule added: ${type} "${selector}"` };
  }, [pushUndo, setRules]);

  const removeRule = useCallback((idx, currentRules) => {
    pushUndo(`Rule removed: ${currentRules[idx].selector}`, currentRules);
    setRules(prev => prev.filter((_, i) => i !== idx));
  }, [pushUndo, setRules]);

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (!prev.length) return prev;
      const snap = prev[prev.length - 1];
      // Use setRules so the restored snapshot is also persisted
      setRules(snap.rules);
      setToastVisible(false);
      return prev.slice(0, -1);
    });
  }, [setRules]);

  const clearRules = useCallback(() => {
    setRules([]);
  }, [setRules]);

  const loadRules = useCallback((loaded) => {
    setRules(prev => {
      const next = [...prev];
      loaded.forEach(r => {
        if (!r.selector) return;
        if (next.some(x => x.selector === r.selector)) return;
        next.push({ selector: r.selector, label: r.label || r.selector, type: r.type || 'remove' });
      });
      return next;
    });
  }, [setRules]);

  /**
   * Call this when a new EPUB is opened.
   * Restores any previously cached rules for that book title and
   * wires up subsequent changes to persist under that key.
   */
  const initForBook = useCallback((title) => {
    activeTitleRef.current = title;
    setUndoStack([]);
    setToastVisible(false);

    const cached = loadRulesForBook(title);
    if (cached && cached.length > 0) {
      setRulesRaw(cached); // bypass the persistence wrapper — already on disk
      return { restored: cached.length };
    } else {
      setRulesRaw([]);
      return { restored: 0 };
    }
  }, []);

  /**
   * Call this on reset / close so the active title is cleared and
   * no stale writes happen after the book is unloaded.
   */
  const resetForBook = useCallback(() => {
    activeTitleRef.current = '';
    setRulesRaw([]);
    setUndoStack([]);
    setToastVisible(false);
  }, []);

  return {
    rules,
    setRules,
    addRule,
    removeRule,
    clearRules,
    loadRules,
    undo,
    undoStack,
    toastMsg,
    toastVisible,
    initForBook,
    resetForBook,
  };
}