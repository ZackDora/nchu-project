import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

type NchuCourse = {
  code: string;
  name: string;
  credits: string;
  time: string;
  classroom: string;
  teacher: string;
  department: string;
  seats: string;
  language: string;
  note: string;
  syllabusUrl: string;
};

type NchuEvent = {
  date: string;
  time: string;
  audience: string;
  title: string;
  instructor: string;
  location: string;
  seats: string;
  url: string;
};

type NchuSource = {
  title: string;
  url: string;
  excerpt: string;
};

const courseSearchUrl = "https://onepiece.nchu.edu.tw/cofsys/plsql/crseqry_all2";
const libraryEventsUrl = "https://cal.lib.nchu.edu.tw/";
const dfllGraduationUrl = "https://dfll.nchu.edu.tw/news_detail.php?Key=224";
const nchuSearchTargets = [
  {
    title: "NCHU official search",
    url: "https://www.nchu.edu.tw/search/all/keyword/",
  },
  {
    title: "NCHU DFLL search",
    url: "https://dfll.nchu.edu.tw/search.php?keyword=",
  },
  {
    title: "NCHU Office of Academic Affairs search",
    url: "https://www.oaa.nchu.edu.tw/zh-tw/search?keyword=",
  },
];
const nchuSourceCatalog = [
  {
    title: "NCHU 學生事務處生活輔導組：獎助學金",
    url: "https://www.osa.nchu.edu.tw/osa/laa/scholarship.html",
    patterns: [/獎學金/, /獎助學金/, /助學/, /scholarship/i, /補助/],
  },
  {
    title: "NCHU 學生事務處生活輔導組：獎助學金申請公告",
    url: "https://www.osa.nchu.edu.tw/osa/laa/sys/modules/osa_scholarship/index.php",
    patterns: [/獎學金/, /獎助學金/, /申請期限/, /scholarship/i, /補助/],
  },
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
    patterns: [/英文/, /英語/, /日文/, /日語/, /日本語/, /德文/, /德語/, /西班牙文/, /西班牙語/, /法文/, /法語/, /韓文/, /韓語/, /越南文/, /越南語/, /馬來文/, /馬來語/, /第二外語/, /外語/, /口說/, /聽力/, /寫作/, /雅思/i, /托福/i, /多益/i, /語言中心/, /language/i, /speaking/i, /japanese/i, /german/i, /spanish/i, /french/i, /korean/i, /vietnamese/i, /malay/i],
  },
  {
    title: "NCHU 語言中心：第二外語",
    url: "https://lc.nchu.edu.tw/second.php",
    patterns: [/日文/, /日語/, /日本語/, /德文/, /德語/, /西班牙文/, /西班牙語/, /法文/, /法語/, /韓文/, /韓語/, /越南文/, /越南語/, /馬來文/, /馬來語/, /第二外語/, /外語/, /語言/, /japanese/i, /german/i, /spanish/i, /french/i, /korean/i, /vietnamese/i, /malay/i],
  },
  {
    title: "NCHU 語言中心：語言推廣班",
    url: "https://lc.nchu.edu.tw/language.php",
    patterns: [/日文/, /日語/, /日本語/, /德文/, /德語/, /西班牙文/, /西班牙語/, /法文/, /法語/, /韓文/, /韓語/, /越南文/, /越南語/, /馬來文/, /馬來語/, /第二外語/, /外語/, /語言推廣班/, /語言/, /japanese/i, /german/i, /spanish/i, /french/i, /korean/i, /vietnamese/i, /malay/i],
  },
  {
    title: "NCHU 語言中心：學習資源",
    url: "https://lc.nchu.edu.tw/link.php",
    patterns: [/日文/, /日語/, /日本語/, /英文/, /英語/, /德文/, /德語/, /西班牙文/, /西班牙語/, /法文/, /法語/, /韓文/, /韓語/, /越南文/, /越南語/, /馬來文/, /馬來語/, /第二外語/, /外語/, /自學/, /學習資源/, /語言/, /japanese/i, /language/i, /german/i, /spanish/i, /french/i, /korean/i, /vietnamese/i, /malay/i],
  },
  {
    title: "NCHU 語言中心：免費自學英文資源",
    url: "https://www2.nchu.edu.tw/news-detail/id/61395",
    patterns: [/英文/, /英語/, /口說/, /自學/, /英檢/, /工作坊/, /語言密客室/, /英語智囊團/, /speaking/i],
  },
  {
    title: "NCHU 語言中心：英檢工作坊口說寫作場",
    url: "https://lc.nchu.edu.tw/page.php?uuid=a33d5c10-9841-11f0-8274-0050569c18d8",
    patterns: [/英文/, /英語/, /口說/, /寫作/, /雅思/i, /托福/i, /多益/i, /工作坊/, /speaking/i],
  },
  {
    title: "NCHU 語言中心：學術英語口說力 UP！系列工作坊",
    url: "https://lc.nchu.edu.tw/campaign_detail.php?id=8f08c2a5-19a7-11f0-8274-0050569c18d8",
    patterns: [/英文/, /英語/, /口說/, /簡報/, /學術英文/, /工作坊/, /presentation/i, /speaking/i],
  },
  {
    title: "NCHU 課程查詢系統",
    url: "https://onepiece.nchu.edu.tw/cofsys/plsql/crseqry_all2",
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
  {
    title: "NCHU 國際事務處：外國學生獎學金",
    url: "https://www.oia.nchu.edu.tw/index.php/zh/4-current-student-tw/4-1-international-degree-and-dual-degree-students-tw/4-1-2-current-students-tw/4-1-2-5-scholarship-tw",
    patterns: [/外國學生/, /國際/, /僑生/, /交換/, /留學/, /scholarship/i, /international/i],
  },
];

const textDecoder = new TextDecoder("utf-8");

const decodeEntities = (value: string) =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stripTags = (value: string) =>
  decodeEntities(value.replace(/<br\s*\/?>/gi, " / ").replace(/<\/?[^>]+>/g, " "));

const getRelevantLines = (text: string, patterns: RegExp[], limit = 18) => {
  const lines = text
    .split(/[。！？\n\r]+/)
    .map((line) => decodeEntities(line).trim())
    .filter((line) => line.length > 0 && line.length < 220);

  const matches = lines.filter((line) => patterns.some((pattern) => pattern.test(line)));
  return Array.from(new Set(matches)).slice(0, limit).join("\n");
};

const getQuestionTerms = (question: string) =>
  Array.from(new Set(
    question
      .split(/[，,。.\s、/：:？?！!()（）]+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 2 && term.length <= 20),
  )).slice(0, 6);

const fetchText = async (url: string) => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return stripTags(textDecoder.decode(buffer));
};

const extractSearchResults = (htmlText: string, baseUrl: string, question: string) => {
  const terms = getQuestionTerms(question);
  const lines = htmlText
    .split(/\n|\s{2,}/)
    .map((line) => decodeEntities(line).trim())
    .filter((line) => line.length >= 8 && line.length <= 180);

  return Array.from(new Set(lines))
    .filter((line) => terms.some((term) => line.includes(term)))
    .slice(0, 8)
    .join("\n") || getRelevantLines(htmlText, terms.map((term) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")), 8);
};

const getCellText = (row: string, label: string) => {
  const pattern = new RegExp(`<td\\b[^>]*data-label=["']${label}["'][^>]*>([\\s\\S]*?)<\\/td>`, "i");
  return stripTags(row.match(pattern)?.[1] ?? "");
};

const getCourseCodeAndSyllabus = (row: string, term: string) => {
  const cell = row.match(/<td\b[^>]*data-label=["']課程號碼["'][^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? "";
  const href = cell.match(/href=["']?([^"'\s>]+)["']?/i)?.[1] ?? "";
  const code = stripTags(cell);
  const syllabusUrl = href
    ? new URL(href.replace(/&amp;/g, "&"), "https://onepiece.nchu.edu.tw/cofsys/plsql/").toString()
    : `https://onepiece.nchu.edu.tw/cofsys/plsql/crseqry_all2?p_year=${term}&v_crseno=${encodeURIComponent(code)}`;

  return { code, syllabusUrl };
};

const parseCourses = (html: string, term: string) => {
  const rows = html.match(/<tr class=["']trall["'][\s\S]*?<\/tr>/gi) ?? [];
  const courses: NchuCourse[] = rows.map((row) => {
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
  });

  const seen = new Set<string>();
  return courses.filter((course) => {
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

const searchCourses = async (keyword: string, term?: string) => {
  const currentTerm = term || await getCurrentCourseTerm();
  const body = new URLSearchParams({
    p_year: currentTerm,
    v_subject: "",
    v_text: keyword,
    v_teach: "",
    v_week: "",
    v_mtg: "",
    v_lang: "",
    v_emi: "",
    v_crseno: "",
  });
  const response = await fetch(courseSearchUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
  return { term: currentTerm, courses: parseCourses(await response.text(), currentTerm) };
};

const parseLibraryEvents = (html: string) => {
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i)?.[0] ?? "";
  const rows = tableMatch.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const events: NchuEvent[] = [];

  for (const row of rows) {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
    if (cells.length < 7) continue;
    const titleCell = cells[3];
    const eventHref = titleCell.match(/href=["']?([^"'\s>]+)["']?/i)?.[1] ?? "";
    const event: NchuEvent = {
      date: stripTags(cells[0]),
      time: stripTags(cells[1]),
      audience: stripTags(cells[2]),
      title: stripTags(titleCell),
      instructor: stripTags(cells[4]),
      location: stripTags(cells[5]),
      seats: stripTags(cells[6]),
      url: eventHref ? new URL(eventHref.replace(/&amp;/g, "&"), libraryEventsUrl).toString() : libraryEventsUrl,
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

const getOfficialSources = async (question: string) => {
  const sources: NchuSource[] = [];
  const compactQuestion = question.toLowerCase().replace(/\s+/g, "");
  const terms = getQuestionTerms(question);

  if (/(外文|外國語文|dfll|foreign)/i.test(compactQuestion) && /(畢業|畢業標準|畢業門檻|學分|graduation|requirement)/i.test(compactQuestion)) {
    const response = await fetch(dfllGraduationUrl);
    const html = await response.text();
    const text = stripTags(html);
    const excerpt = getRelevantLines(text, [
      /畢業學分/,
      /畢業條件/,
      /通識/,
      /人文、社會、自然/,
      /文學學群/,
      /外系學分/,
      /第二外語/,
      /英語能力畢業標準/,
      /不計入畢業學分/,
      /54小時/,
      /實用英文/,
    ]);

    if (excerpt) {
      sources.push({
        title: "114學年度應屆畢業生請自行檢視畢業學分是否符合規定",
        url: dfllGraduationUrl,
        excerpt,
      });
    }
  }

  const catalogMatches = nchuSourceCatalog.filter((source) => source.patterns.some((pattern) => pattern.test(question)));
  for (const source of catalogMatches) {
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
      // Keep going; public pages can change without warning.
    }
  }

  for (const target of nchuSearchTargets) {
    if (sources.length >= 4 || terms.length === 0) break;
    try {
      const searchUrl = `${target.url}${encodeURIComponent(question)}`;
      const text = await fetchText(searchUrl);
      const excerpt = extractSearchResults(text, target.url, question);
      if (excerpt && !sources.some((source) => source.url === searchUrl)) {
        sources.push({
          title: target.title,
          url: searchUrl,
          excerpt,
        });
      }
    } catch {
      // Search pages can change or reject requests; keep the assistant useful with other sources.
    }
  }

  return sources.slice(0, 4);
};

const getRequestBody = async (req: import("node:http").IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });

const cleanAiText = (text: string) =>
  text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^\s*<think>[\s\S]*$/i, "")
    .trim();

const sendJson = (res: import("node:http").ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
};

const createAiAnswer = async (groqApiKey: string, model: string, body: string) => {
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const payload = JSON.parse(body || "{}") as {
    question?: string;
    courses?: NchuCourse[];
    events?: NchuEvent[];
    sources?: NchuSource[];
    history?: { role: "assistant" | "user"; text: string }[];
  };

  const systemInstruction = [
    "You are an NCHU student learning advisor chatbot.",
    "Use only the provided NCHU course and activity data for specific NCHU course codes, seats, times, and event details.",
    "Use provided official NCHU source excerpts for policy, graduation, requirement, and department-rule questions.",
    "For NCHU-specific facts, if data is not provided, say what you cannot verify instead of inventing it. For general learning advice, answer normally.",
    "Answer in the student's language. If answering in Chinese, always use Traditional Chinese as written in Taiwan, never Simplified Chinese.",
    "Use Taiwan terminology and wording where natural, for example 資訊, 課程, 學期, 名額, 申請.",
    "Be direct, simple, and practical. Avoid long greetings or meta commentary.",
    "Do not include hidden reasoning, chain-of-thought, or <think> tags.",
    "When the user asks to learn something, always include concrete suggestions or a short plan, not only resource lookup results.",
    "For learning-plan answers, start directly with Markdown headings. Do not begin with greetings such as 同學你好 or 很高興.",
    "Format answers in readable Markdown: use short bold section labels, bullets, and numbered steps when helpful.",
    "Do not include unrelated activities or courses. If sources are about graduation rules, do not recommend unrelated workshops.",
    "When official source excerpts contain the answer, extract the answer directly from those excerpts.",
    "Cite source titles or URLs briefly at the end.",
  ].join("\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${groqApiKey}`,
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
  if (!response.ok) {
    throw new Error(typeof data === "object" && data !== null ? JSON.stringify(data) : "Groq request failed");
  }

  if (typeof data === "object" && data !== null) {
    const choices = (data as { choices?: { message?: { content?: unknown } }[] }).choices;
    const text = choices?.[0]?.message?.content;
    if (typeof text === "string") return cleanAiText(text);
  }

  return "";
};

const nchuDataPlugin = (groqApiKey: string, groqModel: string): Plugin => ({
  name: "nchu-data-api",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
      try {
        if (requestUrl.pathname === "/api/nchu/courses") {
          const keyword = requestUrl.searchParams.get("keyword")?.trim() || "AI";
          const term = requestUrl.searchParams.get("term")?.trim() || undefined;
          sendJson(res, 200, await searchCourses(keyword, term));
          return;
        }

        if (requestUrl.pathname === "/api/nchu/library-events") {
          sendJson(res, 200, { events: await getLibraryEvents() });
          return;
        }

        if (requestUrl.pathname === "/api/nchu/official-sources") {
          const question = requestUrl.searchParams.get("question")?.trim() || "";
          sendJson(res, 200, { sources: await getOfficialSources(question) });
          return;
        }

        if (requestUrl.pathname === "/api/nchu/chat") {
          if (req.method !== "POST") {
            sendJson(res, 405, { error: "Method not allowed" });
            return;
          }

          const answer = await createAiAnswer(groqApiKey, groqModel, await getRequestBody(req));
          sendJson(res, 200, { answer, model: groqModel, provider: "Groq" });
          return;
        }
      } catch (error) {
        sendJson(res, 502, { error: error instanceof Error ? error.message : "NCHU data request failed" });
        return;
      }

      next();
    });
  },
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const basePath = env.VITE_BASE_PATH || (process.env.NETLIFY ? "/" : "/nchu-project/");
  return {
    base: basePath,
    plugins: [
      react(),
      nchuDataPlugin(
        env.GROQ_API_KEY || process.env.GROQ_API_KEY || "",
        env.GROQ_MODEL || process.env.GROQ_MODEL || "qwen/qwen3-32b",
      ),
    ],
  };
});
