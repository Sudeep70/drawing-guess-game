// src/components/Lobby/InviteLink.jsx
import { useState } from 'react';
import useGameStore from '../../store/useGameStore';
import styles from './Lobby.module.css';

export default function InviteLink() {
  const roomCode = useGameStore((s) => s.roomCode);
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}?room=${roomCode}`;

  const copy = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.inviteBox}>
      <div className={styles.inviteLabel}>Invite Code</div>
      <div className={styles.codeDisplay}>{roomCode}</div>
      <button className={styles.copyBtn} onClick={copy}>
        {copied ? '✓ Copied!' : '📋 Copy Link'}
      </button>
    </div>
  );
}
