const contentInput = document.getElementById("contentInput");
const charCount = document.getElementById("charCount");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const inputMessage = document.getElementById("inputMessage");
const emptyState = document.getElementById("emptyState");
const resultsContent = document.getElementById("resultsContent");

const stopWords = new Set([
  "في", "من", "إلى", "الى", "على", "عن", "أن", "ان", "ما", "هو", "هي", "هذا", "هذه",
  "ذلك", "تلك", "مع", "كل", "كان", "كانت", "يكون", "التي", "الذي", "الذين", "ثم", "أو",
  "او", "و", "ف", "ب", "ل", "ك", "كما", "لكن", "لأن", "لان", "إذا", "اذا", "قد", "تم",
  "هناك", "هنا", "أي", "اي", "بعد", "قبل", "بين", "حتى", "عند", "عندما", "the", "a",
  "an", "and", "or", "to", "of", "in", "on", "for", "with", "is", "are", "was", "were",
  "this", "that", "it", "as", "at", "by", "be", "from"
]);

const positiveWords = [
  "ممتاز", "جميل", "رائع", "نجاح", "أفضل", "سعيد", "فرصة", "تطوير", "إبداع", "مفيد",
  "احترافي", "مميز", "قوي", "سهولة", "إنجاز", "محبة", "دعم", "excellent", "great", "good",
  "success", "happy", "amazing", "best", "creative", "useful", "positive"
];

const negativeWords = [
  "سيئ", "مشكلة", "فشل", "ضعيف", "صعب", "حزين", "خسارة", "خطر", "سلبي", "خطأ", "تعب",
  "قلق", "مزعج", "bad", "fail", "problem", "weak", "difficult", "sad", "loss", "negative", "risk"
];

contentInput.addEventListener("input", () => {
  charCount.textContent = `${contentInput.value.length} / 6000 حرف`;
  inputMessage.textContent = "";
});

clearBtn.addEventListener("click", () => {
  contentInput.value = "";
  charCount.textContent = "0 / 6000 حرف";
  inputMessage.textContent = "";
  resultsContent.classList.add("hidden");
  emptyState.classList.remove("hidden");
  contentInput.focus();
});

analyzeBtn.addEventListener("click", async () => {
  const text = contentInput.value.trim();

  if (text.length < 20) {
    inputMessage.textContent = "يرجى إدخال نص لا يقل عن 20 حرفًا.";
    contentInput.focus();
    return;
  }

  analyzeBtn.classList.add("loading");
  analyzeBtn.disabled = true;
  inputMessage.textContent = "";

  await new Promise(resolve => setTimeout(resolve, 650));

  const result = analyzeContent(text);
  showResults(result);

  analyzeBtn.classList.remove("loading");
  analyzeBtn.disabled = false;
});

function analyzeContent(text) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  const words = cleanText.match(/[\p{L}\p{N}]+/gu) || [];
  const sentences = cleanText.split(/[.!؟?،؛\n]+/).map(s => s.trim()).filter(Boolean);
  const uniqueWords = new Set(words.map(w => normalizeWord(w)));
  const readingMinutes = Math.max(1, Math.ceil(words.length / 180));

  const avgSentenceLength = words.length / Math.max(sentences.length, 1);
  const diversity = uniqueWords.size / Math.max(words.length, 1);
  const punctuationCount = (cleanText.match(/[.!؟?،؛:]/g) || []).length;
  const punctuationRatio = punctuationCount / Math.max(sentences.length, 1);

  let clarity = 92;
  if (avgSentenceLength > 28) clarity -= 18;
  else if (avgSentenceLength > 20) clarity -= 10;
  if (avgSentenceLength < 4) clarity -= 8;
  if (punctuationRatio < 0.6) clarity -= 8;
  clarity = clamp(Math.round(clarity), 45, 98);

  let quality = Math.round((clarity * 0.48) + (Math.min(diversity * 100, 100) * 0.34) + (Math.min(words.length / 2, 100) * 0.18));
  quality = clamp(quality, 48, 97);

  const tone = detectTone(cleanText);
  const keywords = extractKeywords(words, 8);
  const summary = buildSummary(sentences, words.length);
  const suggestions = buildSuggestions({ words, sentences, avgSentenceLength, diversity, punctuationRatio, tone });

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    readingMinutes,
    clarity,
    quality,
    tone,
    keywords,
    summary,
    suggestions
  };
}

function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function extractKeywords(words, limit) {
  const frequencies = {};

  words.forEach(word => {
    const normalized = normalizeWord(word);
    if (normalized.length < 3 || stopWords.has(normalized)) return;
    frequencies[normalized] = (frequencies[normalized] || 0) + 1;
  });

  return Object.entries(frequencies)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([word]) => word);
}

function detectTone(text) {
  const normalized = normalizeWord(text);
  let positive = 0;
  let negative = 0;

  positiveWords.forEach(word => {
    if (normalized.includes(normalizeWord(word))) positive += 1;
  });

  negativeWords.forEach(word => {
    if (normalized.includes(normalizeWord(word))) negative += 1;
  });

  if (positive > negative) {
    return { label: "إيجابية", description: "يستخدم النص كلمات تحمل طابعًا مشجعًا أو متفائلًا." };
  }
  if (negative > positive) {
    return { label: "سلبية", description: "يميل النص إلى عرض تحديات أو مشكلات أو مشاعر سلبية." };
  }
  return { label: "محايدة", description: "يعرض النص المعلومات دون ميل عاطفي واضح." };
}

function buildSummary(sentences, wordCount) {
  if (sentences.length === 1) {
    return shortenText(sentences[0], 220);
  }

  const targetCount = wordCount > 180 ? 3 : 2;
  const selected = sentences
    .map((sentence, index) => ({ sentence, index, score: sentenceScore(sentence, index, sentences.length) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, targetCount)
    .sort((a, b) => a.index - b.index)
    .map(item => item.sentence);

  return shortenText(selected.join(". ") + ".", 420);
}

function sentenceScore(sentence, index, total) {
  const words = sentence.match(/[\p{L}\p{N}]+/gu) || [];
  const lengthScore = Math.min(words.length / 18, 1);
  const positionScore = index === 0 ? 1 : index === total - 1 ? 0.7 : 0.55;
  const keywordScore = extractKeywords(words, 4).length / 4;
  return lengthScore * 0.45 + positionScore * 0.35 + keywordScore * 0.2;
}

function buildSuggestions(data) {
  const suggestions = [];

  if (data.avgSentenceLength > 22) {
    suggestions.push("قسّم الجمل الطويلة إلى جمل أقصر لزيادة الوضوح وسهولة القراءة.");
  } else {
    suggestions.push("طول الجمل مناسب عمومًا ويحافظ على سلاسة القراءة.");
  }

  if (data.diversity < 0.48) {
    suggestions.push("قلّل تكرار الكلمات نفسها واستخدم مرادفات لتقوية الأسلوب.");
  } else {
    suggestions.push("تنوع المفردات جيد ويساعد على إبقاء المحتوى جذابًا.");
  }

  if (data.punctuationRatio < 0.7) {
    suggestions.push("استخدم علامات الترقيم بصورة أوضح لتنظيم الأفكار.");
  }

  if (data.words.length < 45) {
    suggestions.push("أضف تفاصيل أو مثالًا عمليًا حتى يصبح المحتوى أكثر إقناعًا.");
  } else if (data.words.length > 450) {
    suggestions.push("اختصر بعض الفقرات أو استخدم عناوين فرعية لتجنب إرهاق القارئ.");
  }

  if (data.tone.label === "محايدة") {
    suggestions.push("أضف دعوة واضحة لاتخاذ إجراء إذا كان النص تسويقيًا أو مخصصًا للنشر.");
  }

  return suggestions.slice(0, 4);
}

function showResults(result) {
  emptyState.classList.add("hidden");
  resultsContent.classList.remove("hidden");

  document.getElementById("qualityScore").textContent = result.quality;
  document.getElementById("scoreRing").style.setProperty("--score", result.quality);
  document.getElementById("wordCount").textContent = result.wordCount;
  document.getElementById("sentenceCount").textContent = result.sentenceCount;
  document.getElementById("readingTime").textContent = `${result.readingMinutes} د`;
  document.getElementById("summaryText").textContent = result.summary;
  document.getElementById("toneText").textContent = result.tone.label;
  document.getElementById("toneDescription").textContent = result.tone.description;
  document.getElementById("clarityValue").textContent = `${result.clarity}%`;

  requestAnimationFrame(() => {
    document.getElementById("clarityBar").style.width = `${result.clarity}%`;
  });

  const keywordsContainer = document.getElementById("keywords");
  keywordsContainer.innerHTML = "";
  const keywords = result.keywords.length ? result.keywords : ["لا توجد كلمات كافية"];
  keywords.forEach(keyword => {
    const span = document.createElement("span");
    span.className = "keyword";
    span.textContent = keyword;
    keywordsContainer.appendChild(span);
  });

  const suggestionsList = document.getElementById("suggestions");
  suggestionsList.innerHTML = "";
  result.suggestions.forEach(suggestion => {
    const li = document.createElement("li");
    li.textContent = suggestion;
    suggestionsList.appendChild(li);
  });

  if (window.innerWidth < 980) {
    document.getElementById("resultsPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function shortenText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

document.querySelectorAll(".copy-button").forEach(button => {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copy);
    try {
      await navigator.clipboard.writeText(target.textContent);
      const oldText = button.textContent;
      button.textContent = "تم النسخ";
      setTimeout(() => { button.textContent = oldText; }, 1300);
    } catch {
      button.textContent = "تعذر النسخ";
    }
  });
});

document.getElementById("year").textContent = new Date().getFullYear();
