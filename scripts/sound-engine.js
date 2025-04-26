// sound-engine.js
const MODULE_NAME = "dungeons-and-degenerates-pf2e";

const BASE_AUDIO_PATH = "modules/dungeons-and-degenerates-pf2e/Audio";

/**
 * Plays a random selection of orgasm wet sounds from a folder.
 * @param {string} folder - Relative path inside /Audio (e.g., "cumming", "ejaculating")
 * @param {number} minClips - Minimum clips to play
 * @param {number} maxClips - Maximum clips to play
 */
async function playWetSounds(folder, minClips = 3, maxClips = 5) {
  try {
    const files = await getAudioFiles(`${BASE_AUDIO_PATH}/${folder}`);
    if (!files.length) return;

    const clipCount = minClips + Math.floor(Math.random() * (maxClips - minClips + 1));
    const selected = getRandom(files, clipCount);

    let delay = 0;
    for (const file of selected) {
      setTimeout(() => {
        playSound(file);
      }, delay);

      delay += 300 + Math.random() * 200; // minor overlap
    }
  } catch (err) {
    console.error(`[D&Degenerates] ❌ Error playing wet sounds:`, err);
  }
}

/**
 * Plays heartbeat background sound once.
 */
async function playHeartbeat() {
  try {
    const files = await getAudioFiles(`${BASE_AUDIO_PATH}/heartbeat`);
    if (!files.length) return;

    const heartbeat = getRandom(files, 1)[0];
    playSound(heartbeat, { volume: 0.3 });
  } catch (err) {
    console.error(`[D&Degenerates] ❌ Error playing heartbeat sound:`, err);
  }
}

/**
 * Plays cumming audio sequence (female orgasms).
 */
export async function playCummingAudio() {
  console.log(`[D&Degenerates] 🎧 Playing cumming audio`);
  playHeartbeat();
  await playWetSounds("cumming", 3, 5);
}

/**
 * Plays ejaculating audio sequence (male orgasms).
 */
export async function playEjaculatingAudio(actor) {
  console.log(`[D&Degenerates] 🎧 Playing ejaculating audio`);

  // (Later we can scale based on load size using actor load stats)
  playHeartbeat();
  await playWetSounds("ejaculating", 4, 7);
}

/**
 * Play a single sound file.
 * @param {string} path - Full audio file path
 * @param {Object} options - { volume, ... }
 */
function playSound(path, options = {}) {
  try {
    const sound = new Audio(path);
    if (options.volume !== undefined) sound.volume = options.volume;
    sound.play();
  } catch (err) {
    console.error(`[D&Degenerates] ❌ Error playing sound:`, err);
  }
}

/**
 * Gets all audio file paths in a directory.
 * @param {string} directoryPath 
 * @returns {Promise<string[]>}
 */
async function getAudioFiles(directoryPath) {
  try {
    const files = await FilePicker.browse("data", directoryPath);
    return files.files || [];
  } catch (err) {
    console.error(`[D&Degenerates] ❌ Error browsing audio directory:`, err);
    return [];
  }
}

/**
 * Returns random elements from an array.
 * @param {Array} arr 
 * @param {number} count 
 * @returns {Array}
 */
function getRandom(arr, count) {
  const shuffled = arr.slice(0);
  let i = arr.length;
  let min = i - count;
  let temp, index;

  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}
