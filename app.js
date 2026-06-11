// ==========================================================================
// 1. グローバル変数と状態管理
// ==========================================================================
let metadata = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let isAnswered = false;

// UIの選択状態を保持する変数
let selectedSubjects = []; // 複数選択に対応するため配列に変更
let selectedCategory = "all";

// localStorageデータ
let solvedIds = [];
let incorrectIds = [];
const TOTAL_QUESTIONS_COUNT = 1680;

// ==========================================================================
// 2. DOM要素の取得
// ==========================================================================
const menuScreen = document.getElementById("menu-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const subjectButtonsContainer = document.getElementById("subject-buttons");
const categoryWrapper = document.getElementById("category-wrapper");
const categoryButtonsContainer = document.getElementById("category-buttons");
const selectRound = document.getElementById("select-round");
const selectCount = document.getElementById("select-count");
const btnStart = document.getElementById("btn-start");

const progressCount = document.getElementById("progress-count");
const progressPercentage = document.getElementById("progress-percentage");
const progressBarFill = document.getElementById("progress-bar-fill");
const incorrectCount = document.getElementById("incorrect-count");

const quizProgressText = document.getElementById("quiz-progress-text");
const quizTagSubject = document.getElementById("quiz-tag-subject");
const quizTagCategory = document.getElementById("quiz-tag-category");
const quizTagRound = document.getElementById("quiz-tag-round");
const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const quizFeedback = document.getElementById("quiz-feedback");
const feedbackStatus = document.getElementById("feedback-status");
const quizExplanation = document.getElementById("quiz-explanation");

const btnNext = document.getElementById("btn-next");
const btnQuit = document.getElementById("btn-quit");
const btnToMenu = document.getElementById("btn-to-menu");
const resultScore = document.getElementById("result-score");

// ==========================================================================
// 3. 初期化処理・イベント設定
// ==========================================================================
window.addEventListener("DOMContentLoaded", async () => {
  loadUserData();
  updateProgressUI();
  setupEventListeners();
  await loadMetadata();
});

async function loadMetadata() {
  try {
    const response = await fetch("data/metadata.json");
    metadata = await response.json();
  } catch (error) {
    console.error(error);
    alert("初期設定ファイルのロードに失敗しました。");
  }
}

function loadUserData() {
  solvedIds = JSON.parse(localStorage.getItem("solved_ids")) || [];
  incorrectIds = JSON.parse(localStorage.getItem("incorrect_ids")) || [];
}

function saveUserData() {
  localStorage.setItem("solved_ids", JSON.stringify(solvedIds));
  localStorage.setItem("incorrect_ids", JSON.stringify(incorrectIds));
}

function updateProgressUI() {
  progressCount.textContent = solvedIds.length;
  incorrectCount.textContent = incorrectIds.length;
  const rate = Math.min(100, Math.round((solvedIds.length / TOTAL_QUESTIONS_COUNT) * 100));
  progressPercentage.textContent = `${rate}%`;
  progressBarFill.style.width = `${rate}%`;
}

function setupEventListeners() {
  // 科目ボタンのクリック処理（複数選択・排他制御）
  subjectButtonsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("toggle-btn")) {
      const val = e.target.dataset.value;

      if (val === "incorrect" || val === "all_subjects") {
        // 特殊モードの場合：他の選択をクリアし、これだけにする
        selectedSubjects = [val];
      } else {
        // 通常の科目の場合：特殊モードが選ばれていたらクリアする
        if (selectedSubjects.includes("incorrect") || selectedSubjects.includes("all_subjects")) {
          selectedSubjects = [];
        }
        
        // すでに選ばれていれば外し、選ばれていなければ追加する（トグル）
        if (selectedSubjects.includes(val)) {
          selectedSubjects = selectedSubjects.filter(s => s !== val);
        } else {
          selectedSubjects.push(val);
        }
      }

      // UIの見た目を更新
      subjectButtonsContainer.querySelectorAll(".toggle-btn").forEach(btn => {
        if (selectedSubjects.includes(btn.dataset.value)) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });

      handleSubjectChange();
    }
  });

  // カテゴリボタンのクリック処理
  categoryButtonsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("toggle-btn")) {
      categoryButtonsContainer.querySelectorAll(".toggle-btn").forEach(btn => btn.classList.remove("active"));
      e.target.classList.add("active");
      selectedCategory = e.target.dataset.value;
    }
  });

  btnStart.addEventListener("click", startQuiz);
  btnQuit.addEventListener("click", quitQuiz);
  btnToMenu.addEventListener("click", backToMenu);
  btnNext.addEventListener("click", nextQuestion);
}

// ==========================================================================
// 4. メニュー画面の動的制御
// ==========================================================================
function handleSubjectChange() {
  if (selectedSubjects.length === 0) {
    categoryWrapper.style.display = "none";
    btnStart.disabled = true;
    return;
  }

  btnStart.disabled = false;

  // 科目が「1つだけ」選ばれている時のみ、大項目（カテゴリ）の絞り込みを表示する
  if (selectedSubjects.length === 1 && selectedSubjects[0] !== "incorrect" && selectedSubjects[0] !== "all_subjects" && metadata) {
    categoryWrapper.style.display = "block";
    categoryButtonsContainer.innerHTML = '<button type="button" class="toggle-btn active" data-value="all">すべてのカテゴリ</button>';
    selectedCategory = "all";
    
    const targetSubject = metadata.subjects.find(s => s.id === selectedSubjects[0]);
    if (targetSubject && targetSubject.categories) {
      targetSubject.categories.forEach(cat => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "toggle-btn";
        btn.dataset.value = cat.id;
        btn.textContent = cat.name;
        categoryButtonsContainer.appendChild(btn);
      });
    }
  } else {
    // 複数選択、または特殊モードの時は大項目選択は隠す
    categoryWrapper.style.display = "none";
    selectedCategory = "all";
  }
}

// ==========================================================================
// 5. クイズ開始・問題データのフェッチ
// ==========================================================================
async function startQuiz() {
  const round = selectRound.value;
  const countLimit = selectCount.value;

  btnStart.disabled = true;
  btnStart.textContent = "データを読み込み中...";

  try {
    let rawQuestions = [];

    if (selectedSubjects.includes("incorrect")) {
      if (incorrectIds.length === 0) {
        alert("現在、間違えた問題（復習用）はありません。");
        backToMenu();
        return;
      }
      const neededSubjects = new Set();
      incorrectIds.forEach(id => {
        const match = id.match(/^(.+)_\d+_\d+$/);
        if (match) neededSubjects.add(match[1]);
      });
      const fetchPromises = Array.from(neededSubjects).map(subId => {
        const subMeta = metadata.subjects.find(s => s.id === subId);
        return subMeta ? fetch(subMeta.path).then(res => res.json()) : Promise.resolve([]);
      });
      const results = await Promise.all(fetchPromises);
      rawQuestions = results.flat().filter(q => incorrectIds.includes(q.id));

    } else if (selectedSubjects.includes("all_subjects")) {
      // 全科目の一括フェッチ
      const fetchPromises = metadata.subjects.map(s => fetch(s.path).then(res => res.json()));
      const results = await Promise.all(fetchPromises);
      rawQuestions = results.flat();

    } else {
      // 選択された複数科目の一括フェッチ
      const fetchPromises = selectedSubjects.map(subId => {
        const targetSubject = metadata.subjects.find(s => s.id === subId);
        return targetSubject ? fetch(targetSubject.path).then(res => res.json()) : Promise.resolve([]);
      });
      const results = await Promise.all(fetchPromises);
      rawQuestions = results.flat();
    }

    // フィルタリング処理（カテゴリID、試験回）
    let filtered = rawQuestions;
    
    // カテゴリでの絞り込みは「単一の科目」を選んでいる時だけ適用
    if (selectedSubjects.length === 1 && selectedSubjects[0] !== "incorrect" && selectedSubjects[0] !== "all_subjects" && selectedCategory !== "all") {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }

    if (round !== "all") {
      filtered = filtered.filter(q => q.round === parseInt(round, 10));
    }

    if (filtered.length === 0) {
      alert("条件に合致する問題が見つかりませんでした。別の条件をお試しください。");
      backToMenu();
      return;
    }

    // ランダムシャッフル
    shuffleArray(filtered);

    if (countLimit !== "all") {
      currentQuestions = filtered.slice(0, parseInt(countLimit, 10));
    } else {
      currentQuestions = filtered;
    }

    currentQuestionIndex = 0;
    score = 0;
    showScreen(quizScreen);
    displayQuestion();

  } catch (error) {
    console.error(error);
    alert("データの読み込みに失敗しました。ファイル構成を確認してください。");
    backToMenu();
  }
}

function showScreen(targetScreen) {
  menuScreen.style.display = "none";
  quizScreen.style.display = "none";
  resultScreen.style.display = "none";
  targetScreen.style.display = "block";
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ==========================================================================
// 6. クイズ進行（表示と解答処理）
// ==========================================================================
function displayQuestion() {
  isAnswered = false;
  quizFeedback.style.display = "none";
  const question = currentQuestions[currentQuestionIndex];

  quizProgressText.textContent = `${currentQuestionIndex + 1} / ${currentQuestions.length} 問目`;
  
  const subjectMeta = metadata.subjects.find(s => s.id === question.subject);
  const categoryMeta = subjectMeta?.categories.find(c => c.id === question.category);
  
  quizTagSubject.textContent = subjectMeta ? subjectMeta.name : question.subject;
  quizTagCategory.textContent = categoryMeta ? categoryMeta.name : question.category;
  quizTagRound.textContent = `第${question.round}回 問${question.round_question_number}`;

  quizQuestion.textContent = question.question;

  quizOptions.innerHTML = "";
  question.options.forEach((optText, index) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.textContent = optText;
    button.addEventListener("click", () => handleAnswerSelect(index));
    quizOptions.appendChild(button);
  });
}

function handleAnswerSelect(selectedIndex) {
  if (isAnswered) return;
  isAnswered = true;

  const question = currentQuestions[currentQuestionIndex];
  const correctIndex = question.answer;
  const optionButtons = quizOptions.querySelectorAll(".option-btn");
  const isCorrect = (selectedIndex === correctIndex);

  if (isCorrect) {
    score++;
    feedbackStatus.className = "feedback-correct";
    feedbackStatus.textContent = "正解！";
  } else {
    feedbackStatus.className = "feedback-incorrect";
    feedbackStatus.textContent = `不正解（正解: ${correctIndex + 1}）`;
  }

  optionButtons.forEach((btn, index) => {
    btn.classList.add("disabled");
    if (index === correctIndex) btn.classList.add("correct");
    else if (index === selectedIndex) btn.classList.add("incorrect");
    else btn.classList.add("fade");
  });

  updateHistory(question.id, isCorrect);
  quizExplanation.textContent = question.explanation;
  quizFeedback.style.display = "block";
  quizFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateHistory(questionId, isCorrect) {
  if (!solvedIds.includes(questionId)) solvedIds.push(questionId);
  if (isCorrect) {
    const index = incorrectIds.indexOf(questionId);
    if (index > -1) incorrectIds.splice(index, 1);
  } else {
    if (!incorrectIds.includes(questionId)) incorrectIds.push(questionId);
  }
  saveUserData();
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < currentQuestions.length) {
    displayQuestion();
  } else {
    showResult();
  }
}

// ==========================================================================
// 7. クイズ終了・中断・結果表示
// ==========================================================================
function showResult() {
  resultScore.textContent = `${score} / ${currentQuestions.length}`;
  const percentage = Math.round((score / currentQuestions.length) * 100);
  const resultMessage = document.getElementById("result-message");

  if (percentage === 100) resultMessage.textContent = "素晴らしい！全問正解です！";
  else if (percentage >= 80) resultMessage.textContent = "高得点です！この調子で頑張りましょう！";
  else resultMessage.textContent = "解説をよく読んで、間違えた問題を復習しましょう！";

  showScreen(resultScreen);
}

function quitQuiz() {
  if (confirm("これまでの解答結果は保存されますが、中断してメニューに戻りますか？")) {
    backToMenu();
  }
}

function backToMenu() {
  // 状態のクリア
  selectedSubjects = [];
  selectedCategory = "all";
  subjectButtonsContainer.querySelectorAll(".toggle-btn").forEach(btn => btn.classList.remove("active"));
  categoryWrapper.style.display = "none";
  
  btnStart.disabled = true;
  btnStart.textContent = "学習スタート";
  
  loadUserData();
  updateProgressUI();
  showScreen(menuScreen);
}
