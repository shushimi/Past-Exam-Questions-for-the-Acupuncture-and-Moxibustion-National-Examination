// ==========================================================================
// 1. 各科目のファイルパスと各大項目（カテゴリ）の定義
// ==========================================================================
const SUBJECT_FILES = {
  introduction: "data/basic/introduction.json",
  hygiene: "data/basic/hygiene.json",
  laws: "data/basic/laws.json",
  anatomy: "data/basic/anatomy.json",
  physiology: "data/basic/physiology.json",
  pathology: "data/basic/pathology.json",
  clinical_general: "data/basic/clinical_general.json",
  clinical_special: "data/basic/clinical_special.json",
  rehab: "data/basic/rehab.json",
  oriental_intro: "data/specialized/oriental_intro.json",
  meridian: "data/specialized/meridian.json",
  oriental_clinical: "data/specialized/oriental_clinical.json",
  acupuncture: "data/specialized/acupuncture.json",
  moxibustion: "data/specialized/moxibustion.json"
};

const CATEGORIES = {
  introduction: ["現代の医療と社会", "社会保障制度", "医療倫理"],
  hygiene: ["衛生学・公衆衛生学の概念", "健康の保持増進と疾病予防", "ライフスタイルと健康", "環境と健康", "産業保健", "精神保健", "母子保健", "学校保健", "成人・高齢者保健", "感染症", "消毒法", "疫学", "保健統計", "国際保健"],
  laws: [
    "あん摩マッサージ指圧師、はり師、きゅう師等に関する法律（あはき法）における免許",
    "あん摩マッサージ指圧師、はり師、きゅう師等に関する法律（あはき法）における業務",
    "罰則",
    "関係法規"
  ],
  anatomy: ["人体の構成", "骨格系", "筋系", "循環器系", "呼吸器系", "消化器系", "泌尿器系", "生殖器系", "内分泌系", "神経系", "感覚器系"],
  physiology: [
    "生理学の基礎", "血液", "循環", "呼吸", "消化と吸収", "代謝", "体温", "排泄", 
    "内分泌", "生殖と成長", "神経", "筋肉", "身体の運動", "感覚", "生体の防御機構", "ホメオスタシスと生体リズム"
  ],
  pathology: ["病理学の基礎", "病因", "細胞傷害と修復", "循環障害", "炎症", "免疫異常", "腫瘍"],
  clinical_general: ["症候", "診察法", "臨床検査法", "治療法", "精神療法"],
  clinical_special: [
    "感染症", "神経・筋疾患", "呼吸器・胸壁疾患", "循環器疾患", "消化器疾患", "腎泌尿生殖器疾患", 
    "血液・造血器疾患", "代謝・栄養疾患", "内分泌疾患", "アレルギー・自己免疫疾患", "運動器疾患", 
    "皮膚・頭頸部・乳房疾患", "精神・心身医学的疾患", "小児疾患"
  ],
  rehab: [
    "リハビリテーションの概要", "医学的リハビリテーションの概要", "障害の評価", "リハビリテーション治療", 
    "運動学", "脳卒中のリハビリテーション", "脊髄損傷のリハビリテーション", "切断のリハビリテーション", 
    "小児のリハビリテーション", "呼吸器・循環器疾患のリハビリテーション", "運動器疾患のリハビリテーション", 
    "神経疾患のリハビリテーション"
  ],
  oriental_intro: [
    "東洋医学の基礎", "精、気、血、水（津液）と神の生理", "蔵象論", "経絡論", 
    "病因論", "病理・病証", "東洋医学的診察法と証の立て方", "治療法"
  ],
  meridian: ["経絡の意義", "経穴の意義と概要", "所属経穴を持つ奇経", "正経十二経脈", "経穴の応用", "経絡・経穴の現代医学的研究"],
  oriental_clinical: [
    "診断の意義と治療計画", "診察法と記録法", "治療の基礎", "症候に対する鍼灸診療", 
    "疾患に対する鍼灸診療", "高齢者に対する鍼灸施術", "スポーツ領域における鍼灸治療", 
    "産業衛生における鍼灸治療", "健康と鍼灸治療"
  ],
  acupuncture: ["鍼の基礎知識", "基本的な刺鍼方法", "特殊鍼法", "鍼の臨床応用", "リスク管理", "鍼治効の基礎", "鍼療法の治効理論", "関連学説"],
  moxibustion: ["灸の基礎知識", "灸術の種類", "灸の臨床応用", "リスク管理", "灸治効の基礎", "灸療法の治効理論", "関連学説"]
};

const TOTAL_QUESTIONS_COUNT = 1680; // 全問題数

// ==========================================================================
// 2. アプリ全体の変数管理（状態）
// ==========================================================================
let currentQuestions = [];      // 今回のセッションで解く問題リスト
let currentQuestionIndex = 0;   // 現在何問目を解いているか
let score = 0;                  // 今回の正解数
let isAnswered = false;         // 現在表示中の問題にすでに解答したか

// localStorage から読み込むユーザーデータ
let solvedIds = [];             // 解いたことがある問題のID配列
let incorrectIds = [];          // 現在間違えている問題のID配列

// ==========================================================================
// 3. DOM要素の取得
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
// 4. 初期化処理・イベント設定
// ==========================================================================
window.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  updateProgressUI();
  setupEventListeners();
});

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
  // 科目選択時の連動処理
  selectSubject.addEventListener("change", handleSubjectChange);

  // 開始、中断、終了ボタン
  btnStart.addEventListener("click", startQuiz);
  btnQuit.addEventListener("click", quitQuiz);
  btnToMenu.addEventListener("click", backToMenu);

  // 次の問題へ
  btnNext.addEventListener("click", nextQuestion);
}

// ==========================================================================
// 5. メニュー画面の動的制御
// ==========================================================================
function handleSubjectChange() {
  const subject = selectSubject.value;

  if (!subject) {
    // 未選択時は大項目を隠してスタートボタンを無効化
    categoryWrapper.style.display = "none";
    btnStart.disabled = true;
    return;
  }

  btnStart.disabled = false;

  if (subject === "incorrect") {
    // 復習モードの時は大項目選択を隠す
    categoryWrapper.style.display = "none";
  } else {
    // 科目に応じた大項目を動的に再生成して表示
    categoryWrapper.style.display = "block";
    
    // 選択肢のリセット
    selectCategory.innerHTML = '<option value="all">すべてのカテゴリ</option>';
    
    const categories = CATEGORIES[subject] || [];
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      selectCategory.appendChild(option);
    });
  }
}

// ==========================================================================
// 6. クイズ開始・問題データのフェッチ
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
      
      // 間違えた問題IDから必要な科目のJSONファイルを割り出す
      const neededSubjects = new Set();
      incorrectIds.forEach(id => {
        // ID形式（例: anatomy_23_001）から科目キーを正規表現で切り出し
        const match = id.match(/^(.+)_\d+_\d+$/);
        if (match && SUBJECT_FILES[match[1]]) {
          neededSubjects.add(match[1]);
        }
      });

      // 必要な科目のファイルを並列で一括ロード
      const fetchPromises = Array.from(neededSubjects).map(sub => 
        fetch(SUBJECT_FILES[sub]).then(res => res.json())
      );
      const results = await Promise.all(fetchPromises);
      
      // 結合して間違えた問題のみに絞り込む
      const allLoaded = results.flat();
      rawQuestions = allLoaded.filter(q => incorrectIds.includes(q.id));

    } else {
      // --- 通常モードの場合 ---
      const response = await fetch(SUBJECT_FILES[subject]);
      rawQuestions = await response.json();
    }

    // フィルタリング処理（大項目、試験回）
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

    // 問題のランダムシャッフル（フィッシャー–イェーツのシャッフル）
    shuffleArray(filtered);

    // 出題数の切り出し
    if (countLimit !== "all") {
      const limit = parseInt(countLimit, 10);
      currentQuestions = filtered.slice(0, limit);
    } else {
      currentQuestions = filtered;
    }

    // アプリの状態をクイズ開始へ移行
    currentQuestionIndex = 0;
    score = 0;
    
    showScreen(quizScreen);
    displayQuestion();

  } catch (error) {
    console.error(error);
    alert("データの読み込みに失敗しました。ファイルが存在するか、パスが正しいか確認してください。");
    backToMenu();
  }
}

// 画面切り替えの補助関数
function showScreen(targetScreen) {
  menuScreen.style.display = "none";
  quizScreen.style.display = "none";
  resultScreen.style.display = "none";
  targetScreen.style.display = "block";
}

// 配列をランダムシャッフルするアルゴリズム
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ==========================================================================
// 7. クイズ進行（表示と解答処理）
// ==========================================================================
function displayQuestion() {
  isAnswered = false;
  quizFeedback.style.display = "none";

  const question = currentQuestions[currentQuestionIndex];

  // ヘッダー情報（タグなど）の更新
  quizProgressText.textContent = `${currentQuestionIndex + 1} / ${currentQuestions.length} 問目`;
  
  // 日本語の科目名を取得
  const subjectName = selectSubject.querySelector(`option[value="${question.subject}"]`)?.textContent || question.subject;
  quizTagSubject.textContent = subjectName;
  quizTagCategory.textContent = question.category;
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

  // 解答判定
  const isCorrect = (selectedIndex === correctIndex);

  if (isCorrect) {
    score++;
    feedbackStatus.className = "feedback-correct";
    feedbackStatus.textContent = "正解！";
  } else {
    feedbackStatus.className = "feedback-incorrect";
    feedbackStatus.textContent = `不正解（正解: ${correctIndex + 1}）`;
  }

  // 選択肢ボタンの装飾変化
  optionButtons.forEach((btn, index) => {
    btn.classList.add("disabled"); // 解答後は押せなくする
    if (index === correctIndex) {
      btn.classList.add("correct"); // 正解は緑色
    } else if (index === selectedIndex) {
      btn.classList.add("incorrect"); // 自身が選んで間違えたボタンは赤色
    } else {
      btn.classList.add("fade"); // 選ばれなかったボタンは半透明に
    }
  });

  // 進捗状況と間違えた問題の管理（localStorageへの反映）
  updateHistory(question.id, isCorrect);

  // 解説の表示
  quizExplanation.textContent = question.explanation;
  quizFeedback.style.display = "block";
  
  // 次の問題へスクロールしやすくする補助
  quizFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 学習履歴の更新処理
function updateHistory(questionId, isCorrect) {
  // 一度でも解答した問題IDをsolved_idsに記録
  if (!solvedIds.includes(questionId)) {
    solvedIds.push(questionId);
  }

  if (isCorrect) {
    // 正解した場合：もし間違えたリスト(incorrectIds)に含まれていれば、克服したため削除
    const index = incorrectIds.indexOf(questionId);
    if (index > -1) {
      incorrectIds.splice(index, 1);
    }
  } else {
    // 間違えた場合：間違えたリスト(incorrectIds)に追加
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
// 8. クイズ終了・中断・結果表示
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

// クイズの中断
function quitQuiz() {
  if (confirm("これまでの解答結果は保存されますが、現在のセッションを中断してメニューに戻りますか？")) {
    backToMenu();
  }
}

// メニューに戻る際の処理
function backToMenu() {
  // メニューのボタン類を初期状態に戻す
  btnStart.disabled = selectSubject.value === "";
  btnStart.textContent = "学習スタート";
  
  // UI進捗情報の再反映
  loadUserData();
  updateProgressUI();
  showScreen(menuScreen);
}
