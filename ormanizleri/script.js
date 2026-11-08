const MODEL_BASE = 'https://teachablemachine.withgoogle.com/models/ICluOGWOa/';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

const fileInput = document.querySelector('#fileInput');
const dropZone = document.querySelector('#dropZone');
const uploadArt = document.querySelector('#uploadArt');
const dropTitle = document.querySelector('#dropTitle');
const dropHint = document.querySelector('#dropHint');
const previewWrap = document.querySelector('#previewWrap');
const previewImage = document.querySelector('#previewImage');
const changeButton = document.querySelector('#changeButton');
const analyzeButton = document.querySelector('#analyzeButton');
const buttonLabel = document.querySelector('#buttonLabel');
const errorMessage = document.querySelector('#errorMessage');
const resultEmpty = document.querySelector('#resultEmpty');
const loadingState = document.querySelector('#loadingState');
const loadingTitle = document.querySelector('#loadingTitle');
const loadingText = document.querySelector('#loadingText');
const resultContent = document.querySelector('#resultContent');
const animalEmoji = document.querySelector('#animalEmoji');
const animalName = document.querySelector('#animalName');
const animalNameSmall = document.querySelector('#animalNameSmall');
const confidenceValue = document.querySelector('#confidenceValue');
const confidenceBar = document.querySelector('#confidenceBar');
const tryAgainButton = document.querySelector('#tryAgainButton');

let selectedFile = null;
let imageUrl = null;
let model = null;

const emojiForAnimal = (label) => {
  const normalized = label.toLocaleLowerCase('tr-TR');
  const matches = [
    [['kedi', 'cat'], '🐱'], [['köpek', 'kopek', 'dog'], '🐶'], [['tilki', 'fox'], '🦊'],
    [['ayı', 'ayi', 'bear'], '🐻'], [['tavşan', 'tavsan', 'rabbit'], '🐰'], [['kuş', 'kus', 'bird'], '🐦'],
    [['baykuş', 'baykus', 'owl'], '🦉'], [['sincap', 'squirrel'], '🐿️'], [['geyik', 'deer'], '🦌'],
    [['aslan', 'lion'], '🦁'], [['kaplan', 'tiger'], '🐯'], [['fil', 'elephant'], '🐘'],
    [['zürafa', 'zurafa', 'giraffe'], '🦒'], [['penguen', 'penguin'], '🐧'], [['kurbağa', 'kurbaga', 'frog'], '🐸'],
    [['yılan', 'yilan', 'snake'], '🐍'], [['kelebek', 'butterfly'], '🦋'], [['at', 'horse'], '🐴'],
  ];
  return matches.find(([words]) => words.some((word) => normalized.includes(word)))?.[1] || '🐾';
};

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}
function clearError() { errorMessage.hidden = true; errorMessage.textContent = ''; }
function setLoading(isLoading, title = 'Orman taranıyor', text = 'Model hazırlanıyor...') {
  loadingState.hidden = !isLoading;
  loadingTitle.textContent = title;
  loadingText.textContent = text;
  resultEmpty.hidden = isLoading;
  resultContent.hidden = true;
}
function resetResult() {
  loadingState.hidden = true;
  resultContent.hidden = true;
  resultEmpty.hidden = false;
  confidenceBar.style.width = '0%';
}

function handleFile(file) {
  clearError();
  if (!file) return;
  if (!allowedTypes.includes(file.type)) { showError('Lütfen JPG, PNG veya WEBP formatında bir görsel seç.'); return; }
  if (file.size > MAX_FILE_SIZE) { showError('Bu fotoğraf biraz büyük. Lütfen 10 MB’tan küçük bir görsel seç.'); return; }
  selectedFile = file;
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = URL.createObjectURL(file);
  previewImage.src = imageUrl;
  previewImage.onload = () => { analyzeButton.disabled = false; };
  previewImage.onerror = () => { startOver(); showError('Bu görsel tarayıcıda açılamadı. Lütfen başka bir fotoğraf seç.'); };
  dropZone.hidden = true;
  previewWrap.hidden = false;
  buttonLabel.textContent = 'Tahmin et';
  resetResult();
}

fileInput.addEventListener('change', (event) => handleFile(event.target.files[0]));
changeButton.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove('dragging'); }));
dropZone.addEventListener('drop', (event) => handleFile(event.dataTransfer.files[0]));

async function loadModel() {
  if (!model) model = await tmPose.load(`${MODEL_BASE}model.json`, `${MODEL_BASE}metadata.json`);
  return model;
}

async function analyzeImage() {
  if (!selectedFile || !previewImage.src) return;
  clearError();
  analyzeButton.disabled = true;
  buttonLabel.textContent = 'Taranıyor...';
  setLoading(true, 'Orman taranıyor', 'Kendi eğittiğin model hazırlanıyor...');
  try {
    await loadModel();
    loadingText.textContent = 'İzler karşılaştırılıyor...';
    const { posenetOutput } = await model.estimatePose(previewImage);
    const predictions = await model.predict(posenetOutput);
    const best = predictions.reduce((winner, current) => current.probability > winner.probability ? current : winner, predictions[0]);
    const percent = Math.round(best.probability * 100);
    const label = best.className.trim() || 'Bilinmeyen hayvan';
    resultEmpty.hidden = true;
    loadingState.hidden = true;
    resultContent.hidden = false;
    animalEmoji.textContent = emojiForAnimal(label);
    animalName.textContent = label;
    animalNameSmall.textContent = label;
    confidenceValue.textContent = `${percent}%`;
    requestAnimationFrame(() => { confidenceBar.style.width = `${percent}%`; });
  } catch (error) {
    console.error(error);
    resetResult();
    showError('Model yüklenirken bir sorun oluştu. İnternet bağlantını kontrol edip tekrar dene.');
  } finally {
    analyzeButton.disabled = false;
    buttonLabel.textContent = 'Tahmin et';
  }
}

function startOver() {
  selectedFile = null;
  fileInput.value = '';
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = null;
  previewWrap.hidden = true;
  dropZone.hidden = false;
  clearError();
  resetResult();
  analyzeButton.disabled = true;
  buttonLabel.textContent = 'Tahmin et';
}

analyzeButton.addEventListener('click', analyzeImage);
tryAgainButton.addEventListener('click', startOver);
