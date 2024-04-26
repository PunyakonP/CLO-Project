/**
 * This module generates unique 20-character string identifiers.
 */

const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
const ID_LENGTH = 20;
const TIMESTAMP_LENGTH = 8;
const RANDOM_SEGMENT_LENGTH = 12;
const BASE = 64;
const MAX_RANDOM_VALUE = 63;

let lastPushTime = 0;
let lastRandChars = [];

function generateTimestamp(now) {
  let timeStampChars = new Array(TIMESTAMP_LENGTH);
  for (let i = TIMESTAMP_LENGTH - 1; i >= 0; i--) {
    timeStampChars[i] = PUSH_CHARS.charAt(now % BASE);
    now = Math.floor(now / BASE);
  }
  if (now !== 0) throw new Error('Timestamp conversion error.');
  return timeStampChars.join('');
}

function generateRandomSegment(duplicateTime) {
  if (!duplicateTime) {
    for (let i = 0; i < RANDOM_SEGMENT_LENGTH; i++) {
      lastRandChars[i] = Math.floor(Math.random() * BASE);
    }
  } else {
    for (let i = RANDOM_SEGMENT_LENGTH - 1; i >= 0 && lastRandChars[i] === MAX_RANDOM_VALUE; i--) {
      lastRandChars[i] = 0;
    }
    lastRandChars[i]++;
  }
  return lastRandChars.map(index => PUSH_CHARS.charAt(index)).join('');
}

function generateRequestID() {
  let now = new Date().getTime();
  let duplicateTime = (now === lastPushTime);
  lastPushTime = now;

  let timestampSegment = generateTimestamp(now);
  let randomSegment = generateRandomSegment(duplicateTime);

  let id = timestampSegment + randomSegment;
  if (id.length !== ID_LENGTH) throw new Error('ID length mismatch.');

  return id;
}

module.exports = generateRequestID;
