// src/components/Chat/ChatBox.jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import socket from '../../socket/socket';
import useGameStore from '../../store/useGameStore';
import ChatMessage from './ChatMessage';
import styles from './Chat.module.css';

export default function ChatBox() {
  const chat = useGameStore((s) => s.chat);
  const status = useGameStore((s) => s.status);
  const isDrawer = useGameStore((s) => s.isDrawer());
  const mySocketId = useGameStore((s) => s.mySocketId);
  const players = useGameStore((s) => s.players);
  const me = players.find((p) => p.socketId === mySocketId);
  const hasGuessed = me?.hasGuessedCorrectly;

  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const canGuess = status === 'drawing' && !isDrawer && !hasGuessed;

  const send = useCallback(() => {
    const msg = input.trim();
    if (!msg) return;
    socket.emit('chat:guess', { message: msg });
    setInput('');
  }, [input]);

  const onKey = (e) => {
    if (e.key === 'Enter') send();
  };

  let placeholder = 'Chat...';
  if (status === 'drawing') {
    if (isDrawer) placeholder = "You're drawing!";
    else if (hasGuessed) placeholder = '✓ You guessed it!';
    else placeholder = 'Type your guess...';
  }

  return (
    <div className={styles.chatBox}>
      <div className={styles.messages}>
        {chat.map((msg) => <ChatMessage key={msg.id} msg={msg} />)}
        <div ref={bottomRef} />
      </div>
      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          disabled={!canGuess && status !== 'waiting'}
          maxLength={100}
          autoComplete="off"
        />
        <button
          className={styles.sendBtn}
          onClick={send}
          disabled={!input.trim() || (!canGuess && status !== 'waiting')}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
