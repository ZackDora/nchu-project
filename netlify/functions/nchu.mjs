const courseSearchUrl = "https://onepiece.nchu.edu.tw/cofsys/plsql/crseqry_all2";
const libraryEventsUrl = "https://cal.lib.nchu.edu.tw/";
const dfllGraduationUrl = "https://dfll.nchu.edu.tw/news_detail.php?Key=224";
const textDecoder = new TextDecoder("utf-8");

const sourceCatalog = [
  {
    title: "NCHU 圖書館活動報名系統",
    url: "https://cal.lib.nchu.edu.tw/",
    patterns: [/活動/, /講座/, /工作坊/, /研究/, /資料庫/, /論文/, /學習/, /workshop/i, /library/i],
  },
  {
    title: "NCHU 學生事務處課外活動組：社團活動查詢",
    url: "https://www.osa.nchu.edu.tw/osa/act/activity.html",
    patterns: [/社團/, /課外活動/, /音樂/, /鋼琴/, /樂器/, /合唱/, /管樂/, /吉他/, /藝術/, /club/i, /music/i],
  },
  {
    title: "NCHU 招生資訊網：校園生活與社團",
    url: "https://recruit.nchu.edu.tw/PRESENT/campus/campus-life04-02.aspx",
    patterns: [/社團/, /校園生活/, /音樂/, /藝術/, /學藝性社團/, /課外活動/, /club/i, /music/i],
  },
  {
    title: "NCHU 語言中心",
    url: "https://lc.nchu.edu.tw/",
    patterns: [/英文/, /英語/, /日文/, /日語/, /第二外語/, /外語/, /口說/, /聽力/, /寫作/, /language/i],
  },
  {
    title: "NCHU 課程查詢系統",
    url: courseSearchUrl,
    patterns: [/課程/, /選課/, /修課/, /學分/, /course/i, /class/i],
  },
  {
    title: "NCHU 外國語文學系：學生資訊",
    url: "https://dfll.nchu.edu.tw/student2.php",
    patterns: [/外文/, /外國語文/, /dfll/i, /英文能力/, /抵免/, /學生須知/],
  },
  {
    title: "NCHU 外國語文學系：114學年度應屆畢業生畢業學分公告",
    url: dfllGraduationUrl,
    patterns: [/外文/, /外國語文/, /dfll/i, /畢業/, /畢業標準/, /畢業門檻/, /畢業學分/],
  },
];

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

const decodeEntities = (value) =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripTags = (value) => decodeEntities(value.replace(/<br\s*\/?>/gi, " / ").replace(/<\/?[^>]+>/g, " "));

const cleanAiText = (text) =>
  text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^\s*<think>[\s\S]*$/i, "")
    .trim();

const getRelevantLines = (text, patterns, limit = 12) => {
  const lines = text
    .split(/[。！？\n\r]+/)
    .map((line) => decodeEntities(line).trim())
    .filter((line) => line.length > 0 && line.length < 220);

  return Array.from(new Set(lines.filter((line) => patterns.some((pattern) => pattern.test(line)))))
    .slice(0, limit)
    .join("\n");
};

const getQuestionTerms = (question) =>
  Array.from(
    new Set(
      question
        .split(/[，,。.\s、/：:？?！!()（）]+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2 && term.length <= 20),
    ),
  ).slice(0, 6);

const fetchText = async (url) => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return stripTags(textDecoder.decode(buffer));
};

const getCellText = (row, label) => {
  const pattern = new RegExp(`<td\\b[^>]*data-label=["']${label}["'][^>]*>([\\s\\S]*?)<\\/td>`, "i");
  return stripTags(row.match(pattern)?.[1] ?? "");
};

const getCourseCodeAndSyllabus = (row, term) => {
  const cell = row.match(/<td\b[^>]*data-label=["']課程號碼["'][^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? "";
  const href = cell.match(/href=["']?([^"'\s>]+)["']?/i)?.[1] ?? "";
  const code = stripTags(cell);
  const syllabusUrl = href
    ? new URL(href.replace(/&amp;/g, "&"), "https://onepiece.nchu.edu.tw/cofsys/plsql/").toString()
    : `https://onepiece.nchu.edu.tw/cofsys/plsql/crseqry_all2?p_year=${term}&v_crseno=${encodeURIComponent(code)}`;

  return { code, syllabusUrl };
};

const parseCourses = (html, term) => {
  const rows = html.match(/<tr class=["']trall["'][\s\S]*?<\/tr>/gi) ?? [];
  const seen = new Set();

  return rows
    .map((row) => {
      const { code, syllabusUrl } = getCourseCodeAndSyllabus(row, term);
      return {
        code,
        name: getCellText(row, "科目名稱"),
        credits: getCellText(row, "學分"),
        time: getCellText(row, "上課時間"),
        classroom: getCellText(row, "上課教室"),
        teacher: getCellText(row, "授課教師"),
        department: getCellText(row, "開課系所"),
        seats: getCellText(row, "可加選餘額"),
        language: getCellText(row, "授課語言"),
        note: getCellText(row, "備註"),
        syllabusUrl,
      };
    })
    .filter((course) => {
      const key = `${course.code}-${course.name}-${course.department}`;
      if (!course.code || !course.name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const getCurrentCourseTerm = async () => {
  const response = await fetch(courseSearchUrl);
  const html = await response.text();
  return html.match(/<option selected=["']selected["'] value=["']([^"']+)["']/i)?.[1] ?? "1142";
};

const searchCourses = async (keyword, term) => {
  const currentTerm = term || (await getCurrentCourseTerm());
  const response = await fetch(courseSearchUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({
      p_year: currentTerm,
      v_subject: "",
      v_text: keyword,
      v_teach: "",
      v_week: "",
      v_mtg: "",
      v_lang: "",
      v_emi: "",
      v_crseno: "",
    }),
  });
  return { term: currentTerm, courses: parseCourses(await response.text(), currentTerm) };
};

const parseLibraryEvents = (html) => {
  const rows = html.match(/<table[\s\S]*?<\/table>/i)?.[0]?.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const events = [];

  for (const row of rows) {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
    if (cells.length < 7) continue;
    const titleCell = cells[3];
    const href = titleCell.match(/href=["']?([^"'\s>]+)["']?/i)?.[1] ?? "";
    const event = {
      date: stripTags(cells[0]),
      time: stripTags(cells[1]),
      audience: stripTags(cells[2]),
      title: stripTags(titleCell),
      instructor: stripTags(cells[4]),
      location: stripTags(cells[5]),
      seats: stripTags(cells[6]),
      url: href ? new URL(href.replace(/&amp;/g, "&"), libraryEventsUrl).toString() : libraryEventsUrl,
    };
    if (event.date && event.title) events.push(event);
  }

  return events.slice(0, 24);
};

const getLibraryEvents = async () => {
  const response = await fetch(libraryEventsUrl);
  const buffer = await response.arrayBuffer();
  return parseLibraryEvents(textDecoder.decode(buffer));
};

const getOfficialSources = async (question) => {
  const sources = [];
  const terms = getQuestionTerms(question);
  const compactQuestion = question.toLowerCase().replace(/\s+/g, "");

  if (/(外文|外國語文|dfll|foreign)/i.test(compactQuestion) && /(畢業|畢業標準|畢業門檻|學分|graduation|requirement)/i.test(compactQuestion)) {
    const text = await fetchText(dfllGraduationUrl);
    const excerpt = getRelevantLines(text, [/畢業學分/, /畢業條件/, /通識/, /第二外語/, /外系學分/, /英語能力畢業標準/]);
    if (excerpt) sources.push({ title: "114學年度應屆畢業生請自行檢視畢業學分是否符合規定", url: dfllGraduationUrl, excerpt });
  }

  for (const source of sourceCatalog.filter((source) => source.patterns.some((pattern) => pattern.test(question)))) {
    if (sources.length >= 4) break;
    try {
      const text = await fetchText(source.url);
      const patterns = [
        ...source.patterns,
        ...terms.map((term) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")),
      ];
      const excerpt = getRelevantLines(text, patterns, 12);
      if (!sources.some((existing) => existing.url === source.url)) {
        sources.push({
          title: source.title,
          url: source.url,
          excerpt: excerpt || "這是與問題關鍵字相關的 NCHU 官方查詢頁，可用來確認是否有最新課程、社團或活動資訊。",
        });
      }
    } catch {
      // Keep other sources working.
    }
  }

  return sources.slice(0, 4);
};

const createAiAnswer = async (body) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "qwen/qwen3-32b";
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const payload = JSON.parse(body || "{}");
  const systemInstruction = [
    "You are an NCHU student learning advisor chatbot.",
    "Use only provided NCHU data for specific NCHU course, event, policy, and source details.",
    "For NCHU-specific facts, if data is not provided, say what you cannot verify instead of inventing it. For general learning advice, answer normally.",
    "Answer in Traditional Chinese as written in Taiwan unless the user asks otherwise.",
    "Be direct, simple, and practical. Avoid long greetings or meta commentary. Use short Markdown bullets.",
    "Do not include hidden reasoning, chain-of-thought, or <think> tags.",
    "When the user asks to learn something, always include concrete suggestions or a short plan, not only resource lookup results.",
    "For learning-plan answers, start directly with Markdown headings. Do not begin with greetings such as 同學你好 or 很高興.",
    "Cite source titles or URLs briefly at the end when sources are provided.",
  ].join("\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        { role: "system", content: systemInstruction },
        ...(payload.history ?? []).map((message) => ({
          role: message.role,
          content: message.text,
        })),
        {
          role: "user",
          content: JSON.stringify({
              student_question: payload.question ?? "",
              official_nchu_sources: payload.sources ?? [],
              live_nchu_courses: payload.courses ?? [],
              live_nchu_activities: payload.events ?? [],
          }),
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(typeof data === "object" && data !== null ? JSON.stringify(data) : "Groq request failed");
  return cleanAiText(data?.choices?.[0]?.message?.content ?? "");
};

export const handler = async (event) => {
  const rawPath =
    event.path.split("/.netlify/functions/nchu/")[1] ??
    event.path.split("/api/nchu/")[1] ??
    "";
  const endpoint = rawPath.replace(/^\/+/, "");
  const params = new URLSearchParams(event.rawQuery || "");

  try {
    if (endpoint === "courses") {
      return json(200, await searchCourses(params.get("keyword")?.trim() || "AI", params.get("term")?.trim() || undefined));
    }

    if (endpoint === "library-events") {
      return json(200, { events: await getLibraryEvents() });
    }

    if (endpoint === "official-sources") {
      return json(200, { sources: await getOfficialSources(params.get("question")?.trim() || "") });
    }

    if (endpoint === "chat") {
      if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
      const answer = await createAiAnswer(event.body || "{}");
      return json(200, { answer, model: process.env.GROQ_MODEL || "qwen/qwen3-32b", provider: "Groq" });
    }

    return json(404, { error: "Unknown NCHU API endpoint" });
  } catch (error) {
    return json(502, { error: error instanceof Error ? error.message : "NCHU data request failed" });
  }
};
