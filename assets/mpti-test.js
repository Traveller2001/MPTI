(function () {
  const data = window.MPTI_DATA;
  const root = document.getElementById("mptiApp");
  if (!data || !root) return;

  const {
    dimensionMeta,
    questions,
    specialQuestions,
    typeLibrary,
    normalTypes,
    dimExplanations,
    dimensionOrder,
    specialLogic
  } = data;

  const ANALYTICS_ENDPOINT = "/.netlify/functions/mpti-analytics-track";

  const app = {
    shuffledQuestions: [],
    answers: {},
    currentIndex: 0,
    navigating: false,
    resultLogged: false,
    visitLogged: false,
    resultRecordKey: null,
    feedbackVerdict: null,
    feedbackSaving: false
  };

  const screens = {
    intro: document.getElementById("intro"),
    test: document.getElementById("test"),
    result: document.getElementById("result")
  };

  const questionList = document.getElementById("questionList");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const submitBtn = document.getElementById("submitBtn");
  const testHint = document.getElementById("testHint");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const introStatsLine = document.getElementById("introStatsLine");

  const catalogStats = {
    totalTypeCount: Object.keys(typeLibrary).length,
    dimensionCount: Object.keys(dimensionMeta).length,
    majorModelCount: new Set(Object.keys(dimensionMeta).map((key) => key.replace(/\d+$/, ""))).size,
    baseQuestionCount: questions.length + 1
  };

  if (introStatsLine) {
    introStatsLine.textContent = `${catalogStats.majorModelCount} 大模型 · ${catalogStats.dimensionCount} 个维度 · ${catalogStats.totalTypeCount} 种导师人格`;
  }

  progressText.textContent = `0 / ${catalogStats.baseQuestionCount}`;

  const insertQuestion = specialQuestions.find((question) => question.id === specialLogic.insertQuestionId);
  const questionMetaById = Object.create(null);

  questions.forEach((question, index) => {
    questionMetaById[question.id] = {
      questionNumber: index + 1,
      questionKind: "regular",
      dimension: question.dim || null
    };
  });

  specialQuestions.forEach((question, index) => {
    questionMetaById[question.id] = {
      questionNumber: questions.length + index + 1,
      questionKind: question.kind || "special",
      dimension: question.dim || null
    };
  });

  function canUseAnalytics() {
    return typeof fetch === "function" && /^https?:$/.test(window.location.protocol);
  }

  async function trackAnalytics(payload) {
    if (!canUseAnalytics()) return null;
    try {
      const response = await fetch(ANALYTICS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (response.ok) return response.json();
    } catch (_) {
      // 埋点失败不影响页面主流程
    }
    return null;
  }

  function recordVisit() {
    if (app.visitLogged) return;
    app.visitLogged = true;
    void trackAnalytics({
      kind: "visit",
      path: window.location.pathname
    });
  }

  function recordResult(result) {
    if (app.resultLogged) return;
    app.resultLogged = true;
    trackAnalytics({
      kind: "result",
      personaCode: result.finalType.code,
      personaName: result.finalType.cn,
      special: result.special,
      similarity: result.bestNormal ? result.bestNormal.similarity : null,
      answers: buildResultAnswers()
    }).then((data) => {
      if (data && data.resultKey) {
        app.resultRecordKey = data.resultKey;
        app.feedbackVerdict = "accurate";
        updateFeedbackUI("accurate");
      }
    });
  }

  function buildResultAnswers() {
    return getVisibleQuestions()
      .filter((question) => app.answers[question.id] !== undefined)
      .map((question, displayIndex) => {
        const selectedValue = Number(app.answers[question.id]);
        const selectedOptionIndex = question.options.findIndex((option) => option.value === selectedValue);
        const selectedOption = selectedOptionIndex === -1 ? null : question.options[selectedOptionIndex];
        const questionMeta = questionMetaById[question.id] || {};

        return {
          questionId: question.id,
          questionNumber: questionMeta.questionNumber ?? null,
          questionKind: questionMeta.questionKind || (question.kind || "regular"),
          dimension: questionMeta.dimension ?? null,
          displayOrder: displayIndex + 1,
          selectedValue,
          selectedOptionIndex: selectedOptionIndex === -1 ? null : selectedOptionIndex + 1,
          selectedOptionCode:
            selectedOptionIndex === -1 ? null : (["A", "B", "C", "D"][selectedOptionIndex] || String(selectedOptionIndex + 1)),
          selectedOptionLabel: selectedOption ? selectedOption.label : ""
        };
      })
      .sort((left, right) => {
        if (left.questionNumber !== right.questionNumber) {
          if (left.questionNumber === null) return 1;
          if (right.questionNumber === null) return -1;
          return left.questionNumber - right.questionNumber;
        }
        return left.displayOrder - right.displayOrder;
      });
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, element]) => {
      element.classList.toggle("active", key === name);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function shuffle(array) {
    const next = [...array];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }
    return next;
  }

  function shouldShowInsertQuestion() {
    return specialLogic.gateValues.includes(app.answers[specialLogic.gateQuestionId]);
  }

  function getVisibleQuestions() {
    const visible = [...app.shuffledQuestions];
    const gateIndex = visible.findIndex((question) => question.id === specialLogic.gateQuestionId);
    if (gateIndex !== -1 && shouldShowInsertQuestion() && insertQuestion) {
      visible.splice(gateIndex + 1, 0, insertQuestion);
    }
    return visible;
  }

  function getQuestionMetaLabel(question) {
    if (question.special) return "补充题";
    return "维度已隐藏";
  }

  function updateProgress() {
    const visibleQuestions = getVisibleQuestions();
    const total = visibleQuestions.length;
    const done = visibleQuestions.filter((question) => app.answers[question.id] !== undefined).length;
    const percent = total ? (done / total) * 100 : 0;
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${done} / ${total}`;
    const complete = done === total && total > 0;
    submitBtn.disabled = !complete;
    testHint.textContent = complete
      ? "都做完了。提交吧，看看这位导师到底是哪种带组生物。"
      : "";
  }

  function renderCurrentQuestion() {
    const visibleQuestions = getVisibleQuestions();
    const question = visibleQuestions[app.currentIndex];
    const total = visibleQuestions.length;

    questionList.innerHTML = "";
    const card = document.createElement("article");
    card.className = "question";
    card.innerHTML = `
      <div class="question-meta">
        <div class="badge">第 ${app.currentIndex + 1} / ${total} 题</div>
        <div>${getQuestionMetaLabel(question)}</div>
      </div>
      <div class="question-title">${question.text}</div>
      <div class="options">
        ${question.options
          .map((option, optionIndex) => {
            const code = ["A", "B", "C", "D"][optionIndex] || String(optionIndex + 1);
            const checked = app.answers[question.id] === option.value ? "checked" : "";
            return `
              <label class="option">
                <input type="radio" name="${question.id}" value="${option.value}" ${checked} />
                <div class="option-code">${code}</div>
                <div>${option.label}</div>
              </label>
            `;
          })
          .join("")}
      </div>
    `;
    questionList.appendChild(card);

    card.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener("change", (event) => {
        if (app.navigating) return;
        const { name, value } = event.target;
        app.answers[name] = Number(value);

        if (name === specialLogic.gateQuestionId && !shouldShowInsertQuestion()) {
          delete app.answers[specialLogic.insertQuestionId];
        }

        updateProgress();
        app.navigating = true;
        window.setTimeout(() => {
          const updatedVisible = getVisibleQuestions();
          if (app.currentIndex < updatedVisible.length - 1) {
            app.currentIndex += 1;
            renderCurrentQuestion();
          }
          app.navigating = false;
        }, 250);
      });
    });

    prevBtn.style.display = app.currentIndex === 0 ? "none" : "";
    const isAnswered = app.answers[question.id] !== undefined;
    const isLast = app.currentIndex >= visibleQuestions.length - 1;
    nextBtn.style.display = isAnswered && !isLast ? "" : "none";
    updateProgress();

    const testWrap = document.querySelector(".test-wrap");
    if (testWrap) {
      testWrap.scrollTop = 0;
      testWrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function valueToLevel(value) {
    return { 1: "L", 2: "M", 3: "H", 4: "X" }[value] || "M";
  }

  function levelNum(level) {
    return { L: 1, M: 2, H: 3, X: 4 }[level];
  }

  function parsePattern(pattern) {
    return pattern.replace(/-/g, "").split("");
  }

  function hiddenTriggered() {
    return app.answers[specialLogic.triggerQuestionId] === specialLogic.triggerValue;
  }

  function computeResult() {
    const rawScores = {};
    const levels = {};
    Object.keys(dimensionMeta).forEach((dimension) => {
      rawScores[dimension] = 0;
    });

    questions.forEach((question) => {
      rawScores[question.dim] += Number(app.answers[question.id] || 0);
    });

    Object.entries(rawScores).forEach(([dimension, score]) => {
      levels[dimension] = valueToLevel(score);
    });

    const userVector = dimensionOrder.map((dimension) => rawScores[dimension]);
    const ranked = normalTypes
      .map((type) => {
        const vector = parsePattern(type.pattern).map(levelNum);
        let distance = 0;
        let exact = 0;
        for (let index = 0; index < vector.length; index += 1) {
          const diff = Math.abs(userVector[index] - vector[index]);
          distance += diff;
          if (diff === 0) exact += 1;
        }
        const similarity = Math.max(0, Math.round((1 - distance / (dimensionOrder.length * 3)) * 100));
        return { ...type, ...typeLibrary[type.code], distance, exact, similarity };
      })
      .sort((left, right) => {
        if (left.distance !== right.distance) return left.distance - right.distance;
        if (right.exact !== left.exact) return right.exact - left.exact;
        return right.similarity - left.similarity;
      });

    const bestNormal = ranked[0];

    let finalType = bestNormal;
    let modeKicker = "你抽到的导师人格";
    let badge = `匹配度 ${bestNormal.similarity}% · 精准命中 ${bestNormal.exact}/${dimensionOrder.length} 维`;
    let sub = "标准人格模板与当前观察结果比较接近，这份结果可以视为这位导师的第一印象画像。";
    let special = false;
    let secondaryType = null;

    if (hiddenTriggered()) {
      finalType = typeLibrary[specialLogic.hiddenTypeCode];
      secondaryType = bestNormal;
      modeKicker = "隐藏导师人格已触发";
      badge = "导师实体化失败 · 量子态占领结果页";
      sub = `常规人格最近似 ${bestNormal.code}（${bestNormal.cn}），但系统判断“存在感异常”已经压过一切。`;
      special = true;
    } else if (bestNormal.similarity < 60) {
      finalType = typeLibrary["NULL"];
      modeKicker = "系统被导师风格绕晕了";
      badge = `标准人格库最近似仅 ${bestNormal.similarity}%`;
      sub = "这位导师的人设组合过于复杂，系统直接返回了 NullPointerException。";
      special = true;
    }

    return {
      rawScores,
      levels,
      ranked,
      bestNormal,
      finalType,
      modeKicker,
      badge,
      sub,
      special,
      secondaryType
    };
  }

  function renderDimList(result) {
    const dimList = document.getElementById("dimList");
    dimList.innerHTML = dimensionOrder
      .map((dimension) => {
        const level = result.levels[dimension];
        const explanation = dimExplanations[dimension][level];
        return `
          <div class="dim-item">
            <div class="dim-item-top">
              <div class="dim-item-name">${dimensionMeta[dimension].name}</div>
              <div class="dim-item-score">${level} / ${result.rawScores[dimension]} 分</div>
            </div>
            <p>${explanation}</p>
          </div>
        `;
      })
      .join("");
  }

  function renderPoster(type) {
    const posterBox = document.getElementById("posterBox");
    const posterImage = document.getElementById("posterImage");
    const posterFallback = document.getElementById("posterFallback");

    posterImage.removeAttribute("src");
    posterImage.dataset.fallbackSrc = type.imageFallback || "";
    posterImage.dataset.fallbackTried = "";
    posterBox.classList.add("no-image");
    posterFallback.innerHTML = `
      <strong>${type.code}</strong>
      <span>${type.cn}</span>
    `;

    if (!type.image) return;

    posterImage.src = type.image;
    posterImage.alt = `${type.code}（${type.cn}）`;
    posterImage.onload = () => {
      posterBox.classList.remove("no-image");
    };
    posterImage.onerror = () => {
      if (!posterImage.dataset.fallbackTried && posterImage.dataset.fallbackSrc) {
        posterImage.dataset.fallbackTried = "1";
        posterImage.src = posterImage.dataset.fallbackSrc;
        return;
      }
      posterBox.classList.add("no-image");
    };
  }

  function renderResult() {
    const result = computeResult();
    const type = result.finalType;

    document.getElementById("resultModeKicker").textContent = result.modeKicker;
    document.getElementById("resultTypeName").textContent = `${type.code}（${type.cn}）`;
    document.getElementById("matchBadge").textContent = result.badge;
    document.getElementById("resultTypeSub").textContent = result.sub;
    document.getElementById("resultDesc").textContent = type.desc;
    document.getElementById("posterCaption").textContent = type.intro;
    document.getElementById("funNote").textContent = result.special
      ? "本测试仅供娱乐。隐藏人格和兜底人格都属于剧情化彩蛋，请不要把它当成对任何导师的正式评价。"
      : "本测试仅供娱乐。你可以笑，可以截图发给同门，但别把它当成严肃的人事测评系统。";

    renderPoster(type);
    renderDimList(result);
    showScreen("result");
    updateFeedbackUI("accurate");
    recordResult(result);
  }

  function startTest() {
    app.answers = {};
    app.currentIndex = 0;
    app.resultLogged = false;
    app.resultRecordKey = null;
    app.feedbackVerdict = null;
    app.feedbackSaving = false;
    resetFeedbackUI();
    const shuffledRegular = shuffle(questions);
    const insertIndex = Math.floor(Math.random() * shuffledRegular.length) + 1;
    app.shuffledQuestions = [
      ...shuffledRegular.slice(0, insertIndex),
      specialQuestions[0],
      ...shuffledRegular.slice(insertIndex)
    ];
    renderCurrentQuestion();
    showScreen("test");
  }

  const feedbackAccurateBtn = document.getElementById("feedbackAccurateBtn");
  const feedbackInaccurateBtn = document.getElementById("feedbackInaccurateBtn");
  const feedbackNote = document.getElementById("feedbackNote");
  const feedbackWrap = feedbackAccurateBtn.closest(".result-feedback");

  function resetFeedbackUI() {
    feedbackWrap.style.display = "";
    feedbackAccurateBtn.classList.remove("active-accurate");
    feedbackInaccurateBtn.classList.remove("active-inaccurate");
    feedbackAccurateBtn.disabled = false;
    feedbackInaccurateBtn.disabled = false;
    feedbackAccurateBtn.textContent = "准";
    feedbackInaccurateBtn.textContent = "不准";
    feedbackNote.textContent = "用于匿名校准画像，不影响你的测试结果。";
    feedbackNote.className = "feedback-note";
  }

  function updateFeedbackUI(verdict) {
    feedbackAccurateBtn.classList.toggle("active-accurate", verdict === "accurate");
    feedbackInaccurateBtn.classList.toggle("active-inaccurate", verdict === "inaccurate");
    feedbackAccurateBtn.disabled = false;
    feedbackInaccurateBtn.disabled = false;
    feedbackAccurateBtn.textContent = "准";
    feedbackInaccurateBtn.textContent = "不准";
    feedbackNote.className = "feedback-note";
    feedbackNote.textContent = verdict === "accurate"
      ? "你觉得这次结果准"
      : "你觉得这次结果不准";
  }

  function hideFeedbackUI() {
    feedbackWrap.style.display = "none";
  }

  async function sendFeedback(verdict) {
    if (app.feedbackSaving) return;
    if (!app.resultRecordKey) {
      feedbackNote.textContent = "结果尚未上传完成，请稍后再试";
      feedbackNote.className = "feedback-note is-error";
      return;
    }

    app.feedbackSaving = true;
    feedbackAccurateBtn.disabled = true;
    feedbackInaccurateBtn.disabled = true;
    if (verdict === "accurate") {
      feedbackAccurateBtn.textContent = "提交中...";
    } else {
      feedbackInaccurateBtn.textContent = "提交中...";
    }
    feedbackNote.textContent = "";
    feedbackNote.className = "feedback-note is-pending";

    const data = await trackAnalytics({
      kind: "feedback",
      resultKey: app.resultRecordKey,
      verdict: verdict
    });

    app.feedbackSaving = false;

    if (data && data.ok) {
      app.feedbackVerdict = verdict;
      hideFeedbackUI();
    } else {
      if (app.feedbackVerdict) {
        updateFeedbackUI(app.feedbackVerdict);
      } else {
        resetFeedbackUI();
      }
      feedbackNote.textContent = "记录失败，请重试";
      feedbackNote.className = "feedback-note is-error";
    }
  }

  feedbackAccurateBtn.addEventListener("click", () => sendFeedback("accurate"));
  feedbackInaccurateBtn.addEventListener("click", () => sendFeedback("inaccurate"));

  prevBtn.addEventListener("click", () => {
    if (app.currentIndex > 0) {
      app.currentIndex -= 1;
      renderCurrentQuestion();
    }
  });

  nextBtn.addEventListener("click", () => {
    const visibleQuestions = getVisibleQuestions();
    if (app.currentIndex < visibleQuestions.length - 1) {
      app.currentIndex += 1;
      renderCurrentQuestion();
    }
  });

  document.getElementById("startBtn").addEventListener("click", () => startTest());
  document.getElementById("galleryBtn").addEventListener("click", () => {
    window.location.href = "./gallery.html";
  });
  document.getElementById("leaderboardBtn").addEventListener("click", () => {
    window.location.href = "./leaderboard.html";
  });
  document.getElementById("backIntroBtn").addEventListener("click", () => showScreen("intro"));
  document.getElementById("submitBtn").addEventListener("click", renderResult);
  document.getElementById("restartBtn").addEventListener("click", () => startTest());
  document.getElementById("resultLeaderboardBtn").addEventListener("click", () => {
    window.location.href = "./leaderboard.html#rankingPanel";
  });
  document.getElementById("resultStatsBtn").addEventListener("click", () => {
    window.location.href = "./leaderboard.html#summaryStats";
  });
  document.getElementById("toTopBtn").addEventListener("click", () => showScreen("intro"));

  recordVisit();
})();
