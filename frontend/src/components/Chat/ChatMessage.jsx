// src/components/Chat/ChatMessage.jsx
import styles from './Chat.module.css';

export default function ChatMessage({ msg }) {
  if (msg.isSystem) {
    return <div className={styles.system}>{msg.message}</div>;
  }
  return (
    <div className={styles.message}>
      <span className={`${styles.name} ${msg.isDrawer ? styles.drawerName : ''}`}>
        {msg.name}:
      </span>
      <span className={styles.text}>{msg.message}</span>
    </div>
  );
}
