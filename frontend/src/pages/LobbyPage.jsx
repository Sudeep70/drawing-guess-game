// src/pages/LobbyPage.jsx
import { useState, useEffect } from 'react';
import socket from '../socket/socket';
import useGameStore from '../store/useGameStore';
import styles from './LobbyPage.module.css';

export default function LobbyPage() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [difficulty, setDifficulty] = useState('medium'); // ⭐ NEW
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const error = useGameStore((s) => s.error);
  const clearError = useGameStore((s) => s.clearError);

  // Pre-fill room code from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) { 
      setRoomCode(room.toUpperCase()); 
      setTab('join'); 
    }
  }, []);

  const connect = (callback) => {
    if (!name.trim()) return;
    clearError();
    if (!socket.connected) {
      socket.connect();
      socket.once('connect', callback);
    } else {
      callback();
    }
  };

  const createRoom = () => {
    connect(() =>
      socket.emit('room:create', {
        playerName: name.trim(),
        difficulty // ⭐ SEND DIFFICULTY
      })
    );
  };

  const joinRoom = () => {
    if (!roomCode.trim()) return;
    connect(() =>
      socket.emit('room:join', {
        roomCode: roomCode.toUpperCase().trim(),
        playerName: name.trim()
      })
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎨</span>
          <h1 className={styles.logoText}>DrawGuess</h1>
        </div>
        <p className={styles.tagline}>Draw. Guess. Win.</p>

        <div className={styles.card}>
          <input
            className={styles.input}
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'create' ? styles.activeTab : ''}`}
              onClick={() => setTab('create')}
            >
              Create Room
            </button>
            <button
              className={`${styles.tab} ${tab === 'join' ? styles.activeTab : ''}`}
              onClick={() => setTab('join')}
            >
              Join Room
            </button>
          </div>

          {tab === 'create' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>
                Select Difficulty:
              </label>
              <select
                className={styles.input}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>
          )}

          {tab === 'join' && (
            <input
              className={styles.input}
              type="text"
              placeholder="Room code (e.g. AB3X9K)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
          )}

          {error && <div className={styles.error}>{error}</div>}

          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={tab === 'create' ? createRoom : joinRoom}
            disabled={!name.trim() || (tab === 'join' && !roomCode.trim())}
          >
            {tab === 'create' ? '+ Create Room' : '→ Join Room'}
          </button>
        </div>

        <p className={styles.hint}>
          Invite-only · Up to 6 players · 10 rounds
        </p>
      </div>
    </div>
  );
}