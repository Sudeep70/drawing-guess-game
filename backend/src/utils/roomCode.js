// src/utils/roomCode.js

const { getRooms } = require('../state/rooms');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

function generateRoomCode(length = 6) {
  let attempts = 0;
  while (attempts < 100) {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    if (!getRooms()[code]) return code;
    attempts++;
  }
  throw new Error('Failed to generate unique room code');
}

module.exports = { generateRoomCode };
