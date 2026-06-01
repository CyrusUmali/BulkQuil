import { useState, useCallback, useRef } from 'react';

export function useRules() {
  const [rules, setRules]         = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [toastMsg, setToastMsg]   = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

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
  }, [pushUndo]);

  const removeRule = useCallback((idx, currentRules) => {
    pushUndo(`Rule removed: ${currentRules[idx].selector}`, currentRules);
    setRules(prev => prev.filter((_, i) => i !== idx));
  }, [pushUndo]);

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (!prev.length) return prev;
      const snap = prev[prev.length - 1];
      setRules(snap.rules);
      setToastVisible(false);
      return prev.slice(0, -1);
    });
  }, []);

  const clearRules = useCallback(() => {
    setRules([]);
  }, []);

  const loadRules = useCallback((loaded) => {
    setRules(prev => {
      let added = 0, skipped = 0;
      const next = [...prev];
      loaded.forEach(r => {
        if (!r.selector) return;
        if (next.some(x => x.selector === r.selector)) { skipped++; return; }
        next.push({ selector: r.selector, label: r.label || r.selector, type: r.type || 'remove' });
        added++;
      });
      return next;
    });
  }, []);

  return {
    rules, setRules,
    addRule, removeRule, clearRules, loadRules,
    undo,
    undoStack,
    toastMsg, toastVisible,
  };
}
