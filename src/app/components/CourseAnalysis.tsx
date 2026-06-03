import {
  BrainCircuit,
  LoaderCircle,
  Send,
} from "lucide-react";
import { useState } from "react";
import { getLearningSearchTerms, hasLearningIntent, normalizeLearningTopic } from "../utils/learningTopic";

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

type ExternalResource = {
  provider: string;
  title: string;
  description: string;
  url: string;
};

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
  courses?: NchuCourse[];
  events?: NchuEvent[];
  externalResources?: ExternalResource[];
  nchuLookup?: boolean;
  modelLabel?: string;
};

const DEFAULT_STARTER_DURATION = "4 週入門";
const REQUIRED_ANSWER_SECTIONS = ["方向", "入門路線", "練習方式"];
const MIN_COMPLETE_ANSWER_LENGTH = 180;
const MAX_SEARCH_TERMS = 3;
const MAX_COURSE_CARDS = 4;
const MAX_EVENT_CARDS = 3;
const MAX_EXTERNAL_RESOURCE_CARDS = 5;
const RETRY_CONTEXT_LINES = 4;
const CHAT_TIMEOUT_MS = 60000;
const safetyRedirectText = [
  "I can’t help with that request.",
  "",
  "This tool is for learning planning, school resources, and skill development. Please rephrase it as a safe learning goal.",
].join("\n");
const clarifyLearningGoalText = [
  "我還沒有看到明確的學習目標。",
  "",
  "請直接告訴我你想學什麼、目前程度，或想達成什麼成果。例如：",
  "",
  "- 我想學人工智慧，完全新手",
  "- 我想加強微積分，準備期中考",
  "- 我想找 NCHU 有沒有鋼琴相關課程",
].join("\n");

const unsafeRequestPatterns = [
  /(?:how|teach|show|help).{0,40}(?:kill|stab|shoot|poison|bomb|weapon|explosive)/i,
  /(?:製作|教我|如何).{0,20}(?:炸彈|武器|毒藥|殺人|傷害)/,
  /(?:suicide|self[-\s]?harm|kill myself|end my life|自殺|自殘|輕生).{0,40}(?:method|方法|how|怎麼|教)/i,
  /(?:hack|phish|malware|ransomware|steal password|credential|ddos|bypass login|crack account)/i,
  /(?:駭入|釣魚|惡意程式|勒索軟體|偷密碼|盜帳號|繞過登入|破解帳號)/,
  /(?:cheat|作弊|代寫|幫我寫考試|考試答案|作業答案|plagiar)/i,
  /(?:make|sell|buy|traffic).{0,30}(?:drugs|cocaine|meth|heroin|毒品|違禁藥)/i,
  /(?:hate|racial slur|種族歧視|仇恨).{0,40}(?:speech|attack|罵|攻擊)/i,
  /(?:api key|password|private key|secret|token|密碼|金鑰|權杖).{0,30}(?:steal|reveal|extract|偷|取得|破解)/i,
];

const isUnsafeLearningRequest = (message: string) =>
  unsafeRequestPatterns.some((pattern) => pattern.test(message));

const fetchWithTimeout = async (url: string, init: RequestInit = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(`Request timed out after ${timeoutMs / 1000} seconds`), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

const getRequestErrorMessage = (error: unknown) => {
  if (error instanceof DOMException && error.name === "AbortError") return "AI API 回覆逾時，可能是目前流量較高或免費額度受限。";
  if (error instanceof Error && /GROQ_API_KEY/i.test(error.message)) return "尚未設定 Groq API key。";
  if (error instanceof Error && /aborted|abort/i.test(error.message)) return "AI API 回覆逾時，可能是目前流量較高或免費額度受限。";
  if (error instanceof Error && /503|UNAVAILABLE|high demand|高需求|暫時無法使用/i.test(error.message)) {
    return "Groq 目前流量較高，暫時無法回覆。請稍後再試。";
  }
  if (error instanceof Error && /quota|rate|429/i.test(error.message)) return "Groq 免費額度或速率限制暫時用完。";
  if (error instanceof Error) return error.message;
  return "未知錯誤";
};

const chineseNumberMap: Record<string, number> = {
  一: 1,
  二: 2,
  兩: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

const parseSmallNumber = (value: string) => {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) return numericValue;
  if (value === "半") return 0.5;
  if (value.length === 1) return chineseNumberMap[value];
  if (value.startsWith("十")) return 10 + (chineseNumberMap[value[1]] ?? 0);
  if (value.endsWith("十")) return (chineseNumberMap[value[0]] ?? 1) * 10;
  if (value.includes("十")) {
    const [tens, ones] = value.split("十");
    return (chineseNumberMap[tens] ?? 1) * 10 + (chineseNumberMap[ones] ?? 0);
  }
  return undefined;
};

const inferDuration = (message: string) => {
  const normalizedMessage = message.toLowerCase();
  if (/一學期|一個學期|semester/.test(normalizedMessage)) {
    return {
      label: "一學期",
      tableColumn: "階段",
      instruction: "學生希望以一學期規劃；入門路線請用一學期的階段表，不要固定成 4 週。",
    };
  }

  const durationMatch = message.match(/([0-9]{1,2}|半|[一二兩三四五六七八九十]{1,3})\s*(週|周|星期|個月|月|months?|weeks?)/i);
  if (!durationMatch) {
    return {
      label: DEFAULT_STARTER_DURATION,
      tableColumn: "週次",
      instruction: `學生沒有提供期限；請給一個「${DEFAULT_STARTER_DURATION}」路線作為起點，但不要說這是唯一安排。`,
    };
  }

  const amount = parseSmallNumber(durationMatch[1]);
  const unit = durationMatch[2].toLowerCase();
  if (!amount) {
    return {
      label: DEFAULT_STARTER_DURATION,
      tableColumn: "週次",
      instruction: `學生沒有提供可辨識期限；請給一個「${DEFAULT_STARTER_DURATION}」路線作為起點，但不要說這是唯一安排。`,
    };
  }

  const isMonth = /月|month/.test(unit);
  const label = isMonth ? `${amount} 個月` : `${amount} 週`;
  const tableColumn = isMonth ? "月份" : "週次";
  return {
    label,
    tableColumn,
    instruction: `學生希望用 ${label} 規劃；入門路線必須符合這個期限，不要固定成 4 週。`,
  };
};

const inferChatContext = (message: string) => {
  const hourMatch = message.match(/(?:每週|一週|week)?\s*(\d{1,2})\s*(?:小時|hours?|hrs?)/i);
  const parsedHours = hourMatch ? Math.min(20, Math.max(1, Number(hourMatch[1]))) : undefined;
  const duration = inferDuration(message);

  return {
    hours: parsedHours,
    duration,
  };
};

const renderInlineText = (text: string) =>
  text.split(/(\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*\*[^*]+\*\*)/g).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      return (
        <a
          key={`${part}-${index}`}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="mx-0.5 inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-sm font-medium text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:border-blue-700"
        >
          {link[1]}
        </a>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    return part;
  });

const isMarkdownTableDivider = (line: string) => /^\s*\|?[\s:-]+\|[\s|:-]+\|?\s*$/.test(line);
const isMarkdownTableRow = (line: string) => line.trim().includes("|") && !isMarkdownTableDivider(line);

const parseMarkdownTableRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const renderMarkdownTable = (rows: string[], keyPrefix: string) => {
  const header = parseMarkdownTableRow(rows[0] ?? "");
  const bodyRows = rows.slice(1).filter((row) => !isMarkdownTableDivider(row)).map(parseMarkdownTableRow);

  return (
    <div key={keyPrefix} className="my-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-900 dark:text-gray-300">
          <tr>
            {header.map((cell, index) => (
              <th key={`${keyPrefix}-head-${index}`} className="border-b border-gray-200 px-3 py-2 dark:border-gray-700">
                {renderInlineText(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800">
          {bodyRows.map((row, rowIndex) => (
            <tr key={`${keyPrefix}-row-${rowIndex}`} className="border-t border-gray-100 dark:border-gray-700">
              {header.map((_, cellIndex) => (
                <td key={`${keyPrefix}-cell-${rowIndex}-${cellIndex}`} className="align-top px-3 py-2 text-gray-700 dark:text-gray-200">
                  {renderInlineText(row[cellIndex] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderMessageText = (text: string) => {
  const rawLines = text.split("\n");
  const lines: string[] = [];
  for (let index = 0; index < rawLines.length; index += 1) {
    const currentLine = rawLines[index]?.trim() ?? "";
    const nextLine = rawLines[index + 1]?.trim() ?? "";
    if (/^\d+[.)、]$/.test(currentLine) && nextLine) {
      lines.push(`${currentLine} ${nextLine}`);
      index += 1;
    } else {
      lines.push(rawLines[index] ?? "");
    }
  }

  return (
    <div className="space-y-2.5">
      {lines.map((line, index) => {
        if (isMarkdownTableDivider(line)) return null;
        if (isMarkdownTableRow(line) && isMarkdownTableDivider(lines[index + 1] ?? "")) {
          const tableRows = [line];
          let cursor = index + 1;
          while (cursor < lines.length && (isMarkdownTableRow(lines[cursor] ?? "") || isMarkdownTableDivider(lines[cursor] ?? ""))) {
            tableRows.push(lines[cursor] ?? "");
            cursor += 1;
          }
          return renderMarkdownTable(tableRows, `table-${index}`);
        }
        if (index > 0 && (isMarkdownTableRow(lines[index - 1] ?? "") || isMarkdownTableDivider(lines[index - 1] ?? "")) && isMarkdownTableRow(line)) {
          return null;
        }

        const trimmedLine = line.trim();
        if (!trimmedLine) return <div key={`spacer-${index}`} className="h-1" />;

        const heading = trimmedLine.match(/^(#{2,4})\s+(.+)$/);
        if (heading) {
          const sizeClass = heading[1].length === 2 ? "text-lg" : "text-base";
          return (
            <h3 key={`${trimmedLine}-${index}`} className={`pt-2 font-semibold leading-6 text-gray-950 dark:text-white ${sizeClass}`}>
              {renderInlineText(heading[2])}
            </h3>
          );
        }

        const bullet = trimmedLine.match(/^[-*]\s+(.+)$/);
        if (bullet) {
          return (
            <div key={`${trimmedLine}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <p>{renderInlineText(bullet[1])}</p>
            </div>
          );
        }

        const numbered = trimmedLine.match(/^(\d+)[.)、]\s+(.+)$/);
        if (numbered) {
          return (
            <div key={`${trimmedLine}-${index}`} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">{numbered[1]}.</span>
              <p>{renderInlineText(numbered[2])}</p>
            </div>
          );
        }

        if (/^\*\*[^*]+\*\*$/.test(trimmedLine)) {
          return (
            <p key={`${trimmedLine}-${index}`} className="pt-2 text-base font-semibold text-gray-950 dark:text-white">
              {trimmedLine.slice(2, -2)}
            </p>
          );
        }

        return <p key={`${trimmedLine}-${index}`}>{renderInlineText(trimmedLine)}</p>;
      })}
    </div>
  );
};

const renderCourseCards = (courses: NchuCourse[]) => {
  if (courses.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-base font-semibold text-gray-950 dark:text-white">NCHU 課程</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {courses.map((course) => (
          <a
            key={`${course.code}-${course.name}-${course.department}`}
            href={course.syllabusUrl}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/30 dark:hover:border-blue-700"
          >
            <div className="mb-2">
              <p className="font-semibold leading-5 text-gray-950 dark:text-white">{course.name}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{course.department || "未標示單位"}</p>
            </div>
            <div className="grid gap-1 text-xs text-gray-600 dark:text-gray-300">
              {course.code && <p>課號：{course.code}</p>}
              {course.teacher && <p>教師：{course.teacher}</p>}
              {course.credits && <p>學分：{course.credits}</p>}
              {course.time && <p>時間：{course.time}</p>}
              {course.classroom && <p>教室：{course.classroom}</p>}
              {course.seats && <p>名額：{course.seats}</p>}
              {course.note && <p>備註：{course.note}</p>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

const renderNchuLookupStatus = (courses: NchuCourse[], events: NchuEvent[], didLookup?: boolean) => {
  if (!didLookup) return null;

  if (courses.length === 0 && events.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
        目前沒有找到直接相關的 NCHU 課程或活動。
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
        目前沒有找到直接相關的 NCHU 課程；下方列出可參考的相關活動。
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
        已找到相關 NCHU 課程；目前沒有找到直接相關的 NCHU 活動。
      </div>
    );
  }

  return null;
};

const renderEventCards = (events: NchuEvent[]) => {
  if (events.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-base font-semibold text-gray-950 dark:text-white">NCHU 活動</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {events.map((event) => (
          <a
            key={`${event.date}-${event.time}-${event.title}`}
            href={event.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-green-100 bg-green-50/70 p-3 text-sm transition hover:border-green-300 hover:bg-green-50 dark:border-green-900/60 dark:bg-green-950/30 dark:hover:border-green-700"
          >
            <p className="font-semibold leading-5 text-gray-950 dark:text-white">{event.title}</p>
            <div className="mt-2 grid gap-1 text-xs text-gray-600 dark:text-gray-300">
              {event.date && <p>日期：{event.date}</p>}
              {event.time && <p>時間：{event.time}</p>}
              {event.location && <p>地點：{event.location}</p>}
              {event.instructor && <p>講師：{event.instructor}</p>}
              {event.audience && <p>對象：{event.audience}</p>}
              {event.seats && <p>名額：{event.seats}</p>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

const renderExternalResourceCards = (resources: ExternalResource[]) => {
  if (resources.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-base font-semibold text-gray-950 dark:text-white">外部線上課程</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {resources.map((resource) => (
          <a
            key={`${resource.provider}-${resource.title}`}
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-violet-100 bg-violet-50/70 p-3 text-sm transition hover:border-violet-300 hover:bg-violet-50 dark:border-violet-900/60 dark:bg-violet-950/30 dark:hover:border-violet-700"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="font-semibold leading-5 text-gray-950 dark:text-white">{resource.title}</p>
              <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-200">
                {resource.provider}
              </span>
            </div>
            <p className="text-xs leading-5 text-gray-600 dark:text-gray-300">{resource.description}</p>
            <p className="mt-2 text-[11px] font-medium text-violet-700 dark:text-violet-300">
              Live course result
            </p>
          </a>
        ))}
      </div>
    </div>
  );
};

const isCompleteAiAnswer = (answer: string) => {
  const trimmedAnswer = answer.trim();
  if (trimmedAnswer.length < MIN_COMPLETE_ANSWER_LENGTH) return false;
  if (/[，、：；（([*-]$/.test(trimmedAnswer)) return false;
  return REQUIRED_ANSWER_SECTIONS.every((section) => new RegExp(`(^|\\n)#{0,3}\\s*\\*{0,2}${section}\\*{0,2}`, "m").test(trimmedAnswer));
};

const buildCompletionRetryQuestion = (question: string) =>
  [
    question.split("\n").slice(0, RETRY_CONTEXT_LINES).join("\n"),
    "上一個回答不完整。請重新輸出更短的完整答案。",
    "第一行必須是：## 方向",
    "只用三到四個短標題：## 方向、## 入門路線、## 練習方式、## 下一步。",
    "每個標題下最多兩句。不要寒暄。不要寫開場白。",
    `入門路線請用 Markdown 表格，欄位：週次或階段、重點、要做的事。若學生有指定期限，必須符合該期限；若沒有指定，才用「${DEFAULT_STARTER_DURATION}」路線。`,
    "如果學生沒有提供每週可投入時間，不要假設任何小時數。",
  ].join("\n");

const getSearchTerms = (topic: string) => {
  return getLearningSearchTerms(topic).slice(0, MAX_SEARCH_TERMS);
};

const fetchExternalResources = async (topic: string) => {
  try {
    const response = await fetchWithTimeout(`/api/nchu/external-courses?topic=${encodeURIComponent(topic)}`, {}, 14000);
    if (!response.ok) return [];
    const data = (await response.json()) as { resources?: ExternalResource[] };
    return (data.resources ?? []).slice(0, MAX_EXTERNAL_RESOURCE_CARDS);
  } catch {
    return [];
  }
};

const getCourseScore = (course: NchuCourse, terms: string[]) => {
  const courseText = `${course.name} ${course.department} ${course.teacher} ${course.note}`.toLowerCase();
  return terms.reduce((score, term) => score + (courseText.includes(term.toLowerCase()) ? 1 : 0), 0);
};

const isRelevantCourse = (course: NchuCourse, topic: string, terms: string[]) => {
  const courseText = `${course.name} ${course.department} ${course.teacher} ${course.note}`.toLowerCase();
  const normalizedTopic = topic.toLowerCase();
  if (normalizedTopic.includes("鋼琴")) return courseText.includes("鋼琴");
  return getCourseScore(course, terms) > 0;
};

const wantsNchuResources = (message: string) => /nchu|中興|校內|學校|課程|選課|通識|社團|資源/i.test(message);

const getEventScore = (event: NchuEvent, terms: string[]) => {
  const normalizedContent = `${event.title} ${event.audience} ${event.location} ${event.instructor}`.toLowerCase();
  return terms.reduce((score, term) => score + (normalizedContent.includes(term.toLowerCase()) ? 1 : 0), 0);
};

const fetchCourses = async (keyword: string) => {
  const response = await fetchWithTimeout(`/api/nchu/courses?keyword=${encodeURIComponent(keyword)}`);
  if (!response.ok) throw new Error("NCHU course search failed");
  return (await response.json()) as { term: string; courses: NchuCourse[] };
};

const fetchEvents = async () => {
  const response = await fetchWithTimeout("/api/nchu/library-events");
  if (!response.ok) throw new Error("NCHU activity search failed");
  const data = (await response.json()) as { events: NchuEvent[] };
  return data.events;
};

const fetchOfficialSources = async (question: string) => {
  const response = await fetchWithTimeout(`/api/nchu/official-sources?question=${encodeURIComponent(question)}`);
  if (!response.ok) throw new Error("NCHU official source search failed");
  const data = (await response.json()) as { sources: NchuSource[] };
  return data.sources;
};

const fetchAiAnswer = async (
  question: string,
  courses: NchuCourse[],
  events: NchuEvent[],
  sources: NchuSource[],
) => {
  const response = await fetchWithTimeout(
    "/api/nchu/chat",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question,
        courses,
        events,
        sources,
        history: [],
      }),
    },
    CHAT_TIMEOUT_MS,
  );
  const data = (await response.json()) as { answer?: string; error?: string; model?: string; provider?: string };
  if (!response.ok) throw new Error(data.error || "AI chatbot request failed");
  return {
    answer: data.answer || "AI 沒有回傳內容，請再試一次。",
    modelLabel: `${data.provider || "AI"} ${data.model || ""}`.trim(),
  };
};

export function CourseAnalysis() {
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "直接告訴我你想學什麼、目前程度、或想達成什麼成果。我會用對話幫你整理方向、路線與下一步。",
    },
  ]);

  const sendChatMessage = async () => {
    const nextMessage = chatInput.trim();
    if (!nextMessage || isAiLoading) return;

    if (isUnsafeLearningRequest(nextMessage)) {
      setChatInput("");
      setHasGenerated(true);
      setMessages((current) => [
        ...current,
        { role: "user", text: nextMessage },
        { role: "assistant", text: safetyRedirectText },
      ]);
      return;
    }

    if (!hasLearningIntent(nextMessage)) {
      setChatInput("");
      setHasGenerated(true);
      setMessages((current) => [
        ...current,
        { role: "user", text: nextMessage },
        { role: "assistant", text: clarifyLearningGoalText },
      ]);
      return;
    }

    const context = inferChatContext(nextMessage);
    const nextTopic = normalizeLearningTopic(nextMessage);
    const nextHours = context.hours;
    const nextDuration = context.duration;
    const shouldUseNchuResources = wantsNchuResources(nextMessage);
    const timeInstruction = nextHours
      ? `學生可用時間：每週 ${nextHours} 小時。可以依這個時數安排練習。`
      : "學生沒有提供每週可投入時間；不要假設 6 小時或任何固定時數。若需要時間，請在下一步請學生補充。";

    setChatInput("");
    setHasGenerated(true);
    setIsAiLoading(true);
    setMessages((current) => [...current, { role: "user", text: nextMessage }]);

    try {
      const searchTerms = getSearchTerms(nextTopic);
      const question = [
        `學生訊息：${nextMessage}`,
        `推定學習主題：${nextTopic}`,
        timeInstruction,
        nextDuration.instruction,
        "請用繁體中文，語氣直接、簡單、以內容為主。不要寒暄，不要說「很高興」、不要說「我會為你提供」。",
        "第一行必須是：## 方向",
        "回答一定要包含具體建議或計畫，不可以只說明資源查詢結果。",
        `入門路線請用 Markdown 表格，欄位：${nextDuration.tableColumn}、重點、要做的事。`,
        "只能使用這些短標題：## 方向、## 入門路線、## 練習方式、## 下一步。",
        "每段最多 2 句。表格內容要短、具體、可執行。",
        "外部線上課程連結會由介面用卡片顯示；回答中可以簡短提到可搭配線上課程，但不要列出一長串平台連結。",
        shouldUseNchuResources
          ? "學生有問到校內、課程或 NCHU 資源；如有相關校內資料，只在回答最後用一句話提醒，詳細課程資料會由介面顯示成卡片。"
          : "學生沒有要求 NCHU 或校內資源；不要主動加入 NCHU 資源段落，也不要提校內查詢結果。若介面找到相關校內課程或活動，會另外用卡片顯示。",
        "不要輸出生硬的系統推定欄位。",
      ].join("\n");

      const [sources, courseResults, allEvents, externalResources] = await Promise.all([
        shouldUseNchuResources ? fetchOfficialSources(question).catch(() => [] as NchuSource[]) : Promise.resolve([] as NchuSource[]),
        Promise.allSettled(searchTerms.map((term) => fetchCourses(term))),
        fetchEvents().catch(() => [] as NchuEvent[]),
        fetchExternalResources(nextTopic),
      ]);
      const courseResponses = courseResults
        .filter((result): result is PromiseFulfilledResult<{ term: string; courses: NchuCourse[] }> => result.status === "fulfilled")
        .map((result) => result.value);

      const courseMap = new Map<string, NchuCourse>();
      for (const response of courseResponses) {
        for (const course of response.courses) {
          courseMap.set(`${course.code}-${course.name}-${course.department}`, course);
        }
      }

      const courses = Array.from(courseMap.values())
        .map((course) => ({ course, score: getCourseScore(course, searchTerms) }))
        .filter(({ course }) => isRelevantCourse(course, nextTopic, searchTerms))
        .sort((a, b) => b.score - a.score)
        .map(({ course }) => course)
        .slice(0, MAX_COURSE_CARDS);
      const events = allEvents
        .map((event) => ({ event, score: getEventScore(event, searchTerms) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ event }) => event)
        .slice(0, MAX_EVENT_CARDS);

      let ai = await fetchAiAnswer(question, shouldUseNchuResources ? courses : [], shouldUseNchuResources ? events : [], sources);
      if (!isCompleteAiAnswer(ai.answer)) {
        ai = await fetchAiAnswer(buildCompletionRetryQuestion(question), shouldUseNchuResources ? courses : [], shouldUseNchuResources ? events : [], sources);
      }

      if (!isCompleteAiAnswer(ai.answer)) {
        throw new Error("AI 回覆不完整，請再試一次。");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: ai.answer,
          courses,
          events,
          externalResources,
          nchuLookup: shouldUseNchuResources || courses.length > 0 || events.length > 0,
          modelLabel: ai.modelLabel,
        },
      ]);
    } catch (error) {
      const errorMessage = getRequestErrorMessage(error);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: `AI 回覆暫時無法完成。\n\n${errorMessage}\n\n請稍後再試，或確認 Groq API key 是否可用。`,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50 dark:bg-gray-900">
      <header className="shrink-0 border-b border-gray-200 bg-white/95 px-4 py-2 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500">
              <BrainCircuit className="text-white" size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-gray-900 dark:text-white">AI 學習規劃</h1>
            </div>
          </div>
          <span className="shrink-0 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {isAiLoading ? "正在思考" : hasGenerated ? "可繼續追問" : "等待問題"}
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-4xl flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6 md:py-8">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              AI 內容可能有錯，請再次確認 NCHU 官方課程查詢、系所公告或授課教師資訊。模型：Groq，實際模型會顯示在每次回答下方；限制：非官方學務建議，免費 API 可能有額度或速率限制。
            </div>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[82%] ${
                    message.role === "user"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <>
                      {renderMessageText(message.text)}
                      {message.modelLabel && (
                        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                          AI model：{message.modelLabel}
                        </p>
                      )}
                      {renderNchuLookupStatus(message.courses ?? [], message.events ?? [], message.nchuLookup)}
                      {renderCourseCards(message.courses ?? [])}
                      {renderEventCards(message.events ?? [])}
                      {renderExternalResourceCards(message.externalResources ?? [])}
                    </>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                  <LoaderCircle size={16} className="animate-spin" />
                  正在整理 AI 建議與 NCHU 資源...
                </div>
              </div>
            )}
          </div>

          <form
            className="shrink-0 border-t border-gray-200 bg-white/95 px-3 py-2 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90 sm:px-6 sm:py-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendChatMessage();
            }}
          >
            <div className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:ring-blue-900/40">
              <textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendChatMessage();
                  }
                }}
                placeholder="例如：我想學 Python，想做一個作品"
                rows={1}
                className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 sm:text-sm"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isAiLoading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition active:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-blue-500 dark:active:bg-blue-600 dark:disabled:bg-gray-700"
                aria-label="送出訊息"
              >
                {isAiLoading ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
