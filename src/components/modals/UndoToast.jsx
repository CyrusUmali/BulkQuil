import styles from './UndoToast.module.css';
export default function UndoToast({ visible, message, onUndo }) {
  if (!visible) return null;
  return (
    <div className={styles.toast}>
      <span>{message}</span>
      <button onClick={onUndo}>↩ Undo</button>
    </div>
  );
}
