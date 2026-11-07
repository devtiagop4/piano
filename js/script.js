// Gera três oitavas cromáticas a partir das 36 amostras em notes/1.wav–36.wav.
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEY_CODES = [
  "KeyA", "KeyW", "KeyS", "KeyE", "KeyD", "KeyF", "KeyT", "KeyG", "KeyY", "KeyH", "KeyU", "KeyJ",
  "KeyK", "KeyO", "KeyL", "KeyP", "Semicolon", "Quote", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN",
  "KeyM", "Comma", "Period", "Slash", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8"
];

const keyboardKey = document.querySelector("#piano-keys");
const volumeSlider = document.querySelector("#volume");
const volumeValue = document.querySelector("#volume-value");
const activeAudios = new Map();
const activeTimers = new WeakMap();
const notes = Array.from({ length: 3 }, (_, octaveIndex) =>
  NOTE_NAMES.map((name, noteIndex) => ({
    name: `${name}${octaveIndex + 3}`,
    isBlack: name.includes("#"),
    file: noteIndex + octaveIndex * NOTE_NAMES.length + 1,
    code: KEY_CODES[noteIndex + octaveIndex * NOTE_NAMES.length]
  }))
).flat();

// Constrói cada tecla branca e posiciona sua tecla sustenida sobre o intervalo seguinte.
function createKeyboard() {
  const whiteNotes = notes.filter((note) => !note.isBlack);

  whiteNotes.forEach((note) => {
    const keyGroup = document.createElement("div");
    keyGroup.className = "white-key-group";

    const whiteKey = createKey(note, "white");
    keyGroup.append(whiteKey);

    const nextNote = notes[note.file];
    if (nextNote?.isBlack) {
      keyGroup.append(createKey(nextNote, "black"));
    }

    keyboardKey.append(keyGroup);
  });
}

// Usa botões nativos para manter as teclas acessíveis por mouse e tecnologias assistivas.
function createKey(note, color) {
  const key = document.createElement("button");
  key.type = "button";
  key.className = `key ${color}`;
  key.dataset.keyCode = note.code;
  key.dataset.audioFile = note.file;
  key.setAttribute("aria-label", `Nota ${note.name}, atalho ${getKeyLabel(note.code)}`);
  key.innerHTML = `<span class="note-label">${note.name}</span><kbd>${getKeyLabel(note.code)}</kbd>`;
  key.addEventListener("click", () => playNote(key));
  return key;
}

// Traduz códigos físicos do teclado em atalhos legíveis nas teclas do piano.
function getKeyLabel(code) {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);

  const labels = {
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/"
  };
  return labels[code] || code;
}

// Carrega cada arquivo somente quando sua nota é tocada e permite sobrepor notas diferentes.
function playNote(key) {
  const file = key.dataset.audioFile;
  let audio = activeAudios.get(file);

  if (!audio) {
    audio = new Audio(`notes/${file}.wav`);
    audio.preload = "none";
    activeAudios.set(file, audio);
  }

  audio.volume = Number(volumeSlider.value);
  audio.currentTime = 0;
  audio.play().catch((error) => {
    console.error(`Não foi possível reproduzir a amostra notes/${file}.wav.`, error);
  });

  key.classList.add("active");
  window.clearTimeout(activeTimers.get(key));
  activeTimers.set(key, window.setTimeout(() => key.classList.remove("active"), 180));
}

// Dispara as notas pelo código físico da tecla e ignora teclas repetidas ao segurar.
document.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable='true']")) return;

  const key = keyboardKey.querySelector(`[data-key-code="${event.code}"]`);
  if (key) {
    event.preventDefault();
    playNote(key);
  }
});

// Atualiza o volume das amostras já carregadas e informa o nível atual na interface.
volumeSlider.addEventListener("input", () => {
  const volume = Number(volumeSlider.value);
  activeAudios.forEach((audio) => {
    audio.volume = volume;
  });
  volumeValue.value = `${Math.round(volume * 100)}%`;
});

createKeyboard();
