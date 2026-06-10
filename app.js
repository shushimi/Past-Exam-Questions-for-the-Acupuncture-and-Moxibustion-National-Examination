// ==========================================================================
// 1. グローバル変数と状態管理
// ==========================================================================
let metadata = null;            // metadata.json の内容を保持する変数
let currentQuestions = [];      // 今回のセッションで解く問題リスト
let currentQuestionIndex = 0;   // 現在何問目を解いているか
let score = 0;                  // 今回の正解数
let isAnswered = false;         // 現在表示中の問題にすでに解答したか

// localStorage から読み込むユーザーデータ
let solvedIds = [];             // 解いたことがある問題のID配列
let incorrectIds = [];          // 現在間違えている問題のID配列

const TOTAL_QUESTIONS_COUNT = 1680; // 全問題数

// ==========================================================================
// 2. DOM要素の取得
// ==========================================================================
// 画面セクション
const menuScreen = document.getElementById("menu-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

// メニュー入力コントロール
const selectSubject = document.getElementById("select-subject");
const categoryWrapper = document.getElementById("category-wrapper");
const selectCategory = document.getElementById("select-category");
const selectRound = document.getElementById("select-round");
const selectCount = document.getElementById("select-count");
const btnStart = document.getElementById("btn-start");

// メニュー進捗インジケーター
const progressCount = document.getElementById("progress-count");
const progressPercentage = document.getElementById("progress-percentage");
const progressBarFill = document.getElementById("progress-bar-fill");
const incorrectCount = document.getElementById("incorrect-count");

// クイズ画面表示項目
const quizProgressText = document.getElementById("quiz-progress-text");
const quizTagSubject = document.getElementById("quiz-tag-subject");
const quizTagCategory = document.getElementById("quiz-tag-category");
const quizTagRound = document.getElementById("quiz-tag-round");
const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const quizFeedback = document.getElementById("quiz-feedback");
const feedbackStatus = document.getElementById("feedback-status");
const quizExplanation = document.getElementById("quiz-explanation");

// アクションボタン
const btnNext = document.getElementById("btn-next");
const btnQuit = document.getElementById("btn-quit");
const btnToMenu = document.getElementById("btn-to-menu");

// 結果画面
const resultScore = document.getElementById("result-score");

// ==========================================================================
// 3. 初期化処理・イベント設定
// ==========================================================================
window.addEventListener("DOMContentLoaded", async () => {
  loadUserData();
  updateProgressUI();
  setupEventListeners();
  
  // アプリ起動時にまずmetadata.jsonをロード
  await loadMetadata();
});

// metadata.jsonの読み込み
async function loadMetadata() {
  try {
    const response = await fetch("data/metadata.json");
    metadata = await response.json();
  } catch (error) {
    console.error("メタデータのロードに失敗しました:", error);
    alert("初期設定ファイルのロードに失敗しました。ファイル配置を確認してください。");
  }
}

// ユーザーデータの読み込み
function loadUserData() {
  solvedIds = JSON.parse(localStorage.getItem("solved_ids")) || [];
  incorrectIds = JSON.parse(localStorage.getItem("incorrect_ids")) || [];
}

// ユーザーデータの保存
function saveUserData() {
  localStorage.setItem("solved_ids", JSON.stringify(solvedIds));
  localStorage.setItem("incorrect_ids", JSON.stringify(incorrectIds));
}

// 進捗表示の更新
function updateProgressUI() {
  progressCount.textContent = solvedIds.length;
  incorrectCount.textContent = incorrectIds.length;

  const rate = Math.min(100, Math.round((solvedIds.length / TOTAL_QUESTIONS_COUNT) * 100));
  progressPercentage.textContent = `${rate}%`;
  progressBarFill.style.width = `${rate}%`;
}

// 各種イベントリスナーの設定
function setupEventListeners() {
  selectSubject.addEventListener("change", handleSubjectChange);
  btnStart.addEventListener("click", startQuiz);
  btnQuit.addEventListener("click", quitQuiz);
  btnToMenu.addEventListener("click", backToMenu);
  btnNext.addEventListener("click", nextQuestion);
}

// ==========================================================================
// 4. メニュー画面の動的制御
// ==========================================================================
function handleSubjectChange() {
  const subjectId = selectSubject.value;

  if (!subjectId) {
    categoryWrapper.style.display = "none";
    btnStart.disabled = true;
    return;
  }

  btnStart.disabled = false;

  if (subjectId === "incorrect") {
    categoryWrapper.style.display = "none";
  } else if (metadata) {
    categoryWrapper.style.display = "block";
    selectCategory.innerHTML = '<option value="all">すべてのカテゴリ</option>';
    
    // metadata.json から該当する科目のカテゴリリストを抽出してプルダウンに反映
    const targetSubject = metadata.subjects.find(s => s.id === subjectId);
    if (targetSubject && targetSubject.categories) {
      targetSubject.categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;          // 値はID（例: social_security）
        option.textContent = cat.name;  // 表示名は日本語（例: 社会保障制度）
        selectCategory.appendChild(option);
      });
    }
  }
}

// ==========================================================================
// 5. クイズ開始・問題データのフェッチ
// ==========================================================================
async function startQuiz() {
  const subject = selectSubject.value;
  const category = selectCategory.value;
  const round = selectRound.value;
  const countLimit = selectCount.value;

  btnStart.disabled = true;
  btnStart.textContent = "データを読み込み中...";

  try {
    let rawQuestions = [];

    if (subject === "incorrect") {
      // --- 復習モードの場合 ---
      if (incorrectIds.length === 0) {
        alert("現在、間違えた問題（復習用）はありません。");
        backToMenu();
        return;
      }
      
      const neededSubjects = new Set();
      incorrectIds.forEach(id => {
        const match = id.match(/^(.+)_\d+_\d+$/);
        if (match) {
          neededSubjects.add(match[1]);
        }
      });

      // metadata.json から必要ファイルの実際のパスを取得してフェッチ
      const fetchPromises = Array.from(neededSubjects).map(subId => {
        const subMeta = metadata.subjects.find(s => s.id === subId);
        return subMeta ? fetch(subMeta.path).then(res => res.json()) : Promise.resolve([]);
      });
      
      const results = await Promise.all(fetchPromises);
      const allLoaded = results.flat();
      rawQuestions = allLoaded.filter(q => incorrectIds.includes(q.id));

    } else {
      // --- 通常モードの場合 ---
      const targetSubject = metadata.subjects.find(s => s.id === subject);
      if (!targetSubject) throw new Error("対象の科目が見つかりません。");
      
      const response = await fetch(targetSubject.path);
      rawQuestions = await response.json();
    }

    // フィルタリング処理（カテゴリID、試験回）
    let filtered = rawQuestions;

    if (subject !== "incorrect" && category !== "all") {
      filtered = filtered.filter(q => q.category === category);
    }
    if (round !== "all") {
      filtered = filtered.filter(q => q.round === parseInt(round, 10));
    }

    if (filtered.length === 0) {
      alert("条件に合致する問題が見つかりませんでした。別の条件をお試しください。");
      backToMenu();
      return;
    }

    // 問題のランダムシャッフル
    shuffleArray(filtered);

    if (countLimit !== "all") {
      const limit = parseInt(countLimit, 10);
      currentQuestions = filtered.slice(0, limit);
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

  // ヘッダー情報の更新
  quizProgressText.textContent = `${currentQuestionIndex + 1} / ${currentQuestions.length} 問目`;
  
  // metadata.json を使用して、IDから綺麗な日本語名を逆引き
  const subjectMeta = metadata.subjects.find(s => s.id === question.subject);
  const categoryMeta = subjectMeta?.categories.find(c => c.id === question.category);
  
  quizTagSubject.textContent = subjectMeta ? subjectMeta.name : question.subject;
  quizTagCategory.textContent = categoryMeta ? categoryMeta.name : question.category;
  quizTagRound.textContent = `第${question.round}回 問${question.round_question_number}`;

  // 問題文の表示
  quizQuestion.textContent = question.question;

  // 選択肢ボタンの生成
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
    if (index === correctIndex) {
      btn.classList.add("correct");
    } else if (index === selectedIndex) {
      btn.classList.add("incorrect");
    } else {
      btn.classList.add("fade");
    }
  });

  updateHistory(question.id, isCorrect);

  quizExplanation.textContent = question.explanation;
  quizFeedback.style.display = "block";
  quizFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateHistory(questionId, isCorrect) {
  if (!solvedIds.includes(questionId)) {
    solvedIds.push(questionId);
  }

  if (isCorrect) {
    const index = incorrectIds.indexOf(questionId);
    if (index > -1) {
      incorrectIds.splice(index, 1);
    }
  } else {
    if (!incorrectIds.includes(questionId)) {
      incorrectIds.push(questionId);
    }
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

  if (percentage === 100) {
    resultMessage.textContent = "素晴らしい！全問正解です！";
  } else if (percentage >= 80) {
    resultMessage.textContent = "高得点です！この調子で頑張りましょう！";
  } else {
    resultMessage.textContent = "解説をよく読んで、間違えた問題を復習しましょう！";
  }

  showScreen(resultScreen);
}

function quitQuiz() {
  if (confirm("これまでの解答結果は保存されますが、現在のセッションを中断してメニューに戻りますか？")) {
    backToMenu();
  }
}

function backToMenu() {
  btnStart.disabled = selectSubject.value === "";
  btnStart.textContent = "学習スタート";
  loadUserData();
  updateProgressUI();
  showScreen(menuScreen);
}
