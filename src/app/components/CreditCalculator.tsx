import { Calculator, Upload, GraduationCap, AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// 中興大學各學院系所畢業學分標準
const departmentCredits: Record<string, { name: string; credits: number }[]> = {
  "文學院": [
    { name: "中國文學系", credits: 128 },
    { name: "外國語文學系", credits: 128 },
    { name: "歷史學系", credits: 128 },
    { name: "圖書資訊學研究所", credits: 128 },
  ],
  "理學院": [
    { name: "應用數學系", credits: 128 },
    { name: "物理學系", credits: 128 },
    { name: "化學系", credits: 128 },
    { name: "生命科學系", credits: 128 },
  ],
  "工學院": [
    { name: "化學工程學系", credits: 136 },
    { name: "材料科學與工程學系", credits: 134 },
    { name: "土木工程學系", credits: 136 },
    { name: "機械工程學系", credits: 136 },
    { name: "環境工程學系", credits: 133 },
  ],
  "農業暨自然資源學院": [
    { name: "農藝學系", credits: 128 },
    { name: "園藝學系", credits: 128 },
    { name: "森林學系", credits: 128 },
    { name: "動物科學系", credits: 128 },
    { name: "土壤環境科學系", credits: 128 },
    { name: "植物病理學系", credits: 128 },
    { name: "昆蟲學系", credits: 128 },
  ],
  "管理學院": [
    { name: "企業管理學系", credits: 128 },
    { name: "資訊管理學系", credits: 128 },
    { name: "財務金融學系", credits: 128 },
    { name: "會計學系", credits: 128 },
    { name: "行銷學系", credits: 128 },
  ],
  "法政學院": [
    { name: "法律學系", credits: 132 },
    { name: "國際政治研究所", credits: 128 },
  ],
  "生命科學院": [
    { name: "生命科學系", credits: 128 },
    { name: "生物科技學研究所", credits: 128 },
  ],
  "獸醫學院": [
    { name: "獸醫學系", credits: 154 },
  ],
  "電機資訊學院": [
    { name: "電機工程學系", credits: 136 },
    { name: "資訊科學與工程學系", credits: 134 },
    { name: "通訊工程研究所", credits: 128 },
  ],
};

export function CreditCalculator() {
  GlobalWorkerOptions.workerSrc = pdfWorker;

  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState("");
  const [parseError, setParseError] = useState("");
  const [rawText, setRawText] = useState("");
  const [profile, setProfile] = useState({ name: "", department: "" });
  const [courses, setCourses] = useState<{ name: string; semester: string; credits: number; grade: string }[]>([]);

  const selectedDepartment = profile.department;
  const totalRequired = useMemo(() => {
    if (!selectedDepartment) return 128;
    for (const college of Object.values(departmentCredits)) {
      const match = college.find((dept) => selectedDepartment.includes(dept.name) || dept.name.includes(selectedDepartment));
      if (match) return match.credits;
    }
    return 128;
  }, [selectedDepartment]);

  const groupedCredits = useMemo(() => {
    const groups = {
      "共同必修/通識": 0,
      "體育/服務學習": 0,
      "專業課程": 0,
      "其他": 0,
    };

    for (const course of courses) {
      if (/(通識|共同|英文|國文|語文)/.test(course.name)) groups["共同必修/通識"] += course.credits;
      else if (/(體育|服務|軍訓)/.test(course.name)) groups["體育/服務學習"] += course.credits;
      else if (/(專題|程式|工程|系統|數學|統計|管理|設計|實驗|實習|資料|電路|演算法|微積分)/.test(course.name)) groups["專業課程"] += course.credits;
      else groups["其他"] += course.credits;
    }
    return groups;
  }, [courses]);

  const completed = useMemo(() => courses.reduce((sum, course) => sum + course.credits, 0), [courses]);
  const remaining = Math.max(totalRequired - completed, 0);
  const progress = Math.min((completed / totalRequired) * 100, 100);

  const extractProfile = (text: string) => {
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const nameLabelIdx = lines.findIndex((line) => /(姓名|Name)/.test(line));
    const deptLabelIdx = lines.findIndex((line) => /(學系|Department)/.test(line));

    const rawNameFromLine = nameLabelIdx >= 0 ? (lines[nameLabelIdx + 1] ?? "") : "";
    const rawDeptFromLine = deptLabelIdx >= 0 ? (lines[deptLabelIdx + 1] ?? "") : "";

    const fallbackName =
      text.match(/姓名\s*\(Name\)\s*\n([^\n]+)/)?.[1] ??
      text.match(/Name\)\s*\n([^\n]+)/)?.[1] ??
      "";
    const fallbackDept =
      text.match(/學系\s*\(Department\)\s*\n([^\n]+)/)?.[1] ??
      text.match(/Department\)\s*\n([^\n]+)/)?.[1] ??
      "";

    const cleanName = (rawNameFromLine || fallbackName)
      .replace(/\(.*?\)/g, "")
      .replace(/[^A-Za-z\u4e00-\u9fa5\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const cleanDept = (rawDeptFromLine || fallbackDept)
      .replace(/\(.*?\)/g, "")
      .replace(/\s+/g, "")
      .trim();

    return {
      name: cleanName,
      department: cleanDept,
    };
  };

  const extractCourses = (text: string) => {
    const lines = text.split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
    const parsed: { name: string; semester: string; credits: number; grade: string }[] = [];
    const seen = new Set<string>();
    let currentSemester = "";
    let currentBlock: string[] = [];

    const isCourseStartLine = (line: string) => /^\d{4}\b/.test(line);
    const isSemesterLine = (line: string) => /(1\d{2})\s*學年度.*?第\s*([12])\s*學期/.test(line);
    const isStopLine = (line: string) =>
      /^(學期總分|Total Score|修習學分|Chosen|注意事項|📝|-- \d+ of \d+ --|選課|號碼|Course|No|課程別|Category|科 ⽬ 名稱|Course Name|課程分類|Classify|開課系所|Offered Dept\.)/.test(line);

    const skipNameLine = (line: string) =>
      /^(Req|Elec|Gen|P\.E\.|Service|Department of|College of|Office of|General Education|Language Center|Center|Category|Core|Competencies|Integrated|Domains|Physical|Education|Languages and Literatures|Foreign|Social|Natural|Science|Humanistic)$/.test(
        line,
      ) || /^(外文系|文學院|通識中⼼|語⾔中⼼|體育室|學務處|資⼯系|應數系|資管系|夜外文)$/.test(line);

    const isClassifyLine = (line: string) =>
      /(人文領域|社會科學領域|自然科學領域|核心素養|通識自由選|統合領域|體育|服務學習|專業領域微課程|Classify|Category)/.test(line);

    const isOfferedDeptLine = (line: string) =>
      /(系|學院|中心|中⼼|學務處|體育室|Department|College|Office of|Language Center|General Education Center)/.test(line);

    const classifyKeywords = [
      "人文領域",
      "社會科學領",
      "自然科學領",
      "核心素養",
      "通識自由選",
      "統合領域",
      "專業領域微",
      "體育",
      "服務學習",
    ];
    const hardNoiseCourseNames = new Set([
      "自然科學領",
      "全校英外語",
      "通識自由選",
      "修/統合領域",
      "核心素養",
      "人文領域",
      "社會科學領",
    ]);
    const classifyNoiseTokens = [
      "全校可選修",
      "通識自由選",
      "修/統合領域",
      "統合領域",
      "Other Elective",
      "Elective Course",
      "General Education",
      "Category",
      "Classify",
    ];
    const semesterFromLine = (line: string) => {
      const m = line.match(/(1\d{2})\s*學年度.*?第\s*([12])/);
      return m ? `${m[1]}-${m[2]}` : "";
    };
    const normalizeZh = (line: string) =>
      line
        .replace(/⼀/g, "一")
        .replace(/⼆/g, "二")
        .replace(/⼤/g, "大")
        .replace(/⽤/g, "用")
        .replace(/⾔/g, "言")
        .replace(/⼼/g, "心")
        .replace(/\s+/g, " ")
        .trim();
    const compactZh = (line: string) => normalizeZh(line).replace(/\s+/g, "");

    const cleanCourseName = (raw: string) =>
      raw
        .replace(/^[\s必選通體服ReqElecGenP.E.]+/, "")
        .replace(/\s+/g, " ")
        .replace(/\s*[:：]\s*/g, "：")
        .replace(/\s*\(\s*/g, "(")
        .replace(/\s*\)\s*/g, ")")
        .replace(/[\s　]+/g, " ")
        .trim();

    const flushBlock = () => {
      if (currentBlock.length === 0) return;
      const blockLines = [...currentBlock];
      currentBlock = [];

      const joined = blockLines.join(" ");
      if (!/^\d{4}\b/.test(joined)) return;

      const normalizedBlock = blockLines.map((line) => normalizeZh(line).replace(/At/g, "A+"));
      const scoreRegex = /\b([0-6](?:\.[05])?)\s+(\d{1,3}|I|W|-)\s+(A\+|A-|A|B\+|B-|B|C\+|C-|C|D|F|W|抵|-)\s+([YN-])\b/;
      const scoreLineIdx = normalizedBlock.findIndex((line) => scoreRegex.test(line));
      const scoreLine = scoreLineIdx >= 0 ? normalizedBlock[scoreLineIdx] : undefined;
      let credits = 0;
      let grade = "-";
      if (scoreLine) {
        const scoreMatch = scoreLine.match(scoreRegex);
        if (scoreMatch) {
          credits = Number(scoreMatch[1]);
          grade = scoreMatch[3];
        }
      } else {
        const fallback = normalizedBlock.join(" ").match(/\b([0-6](?:\.[05])?)\s+(A\+|A-|A|B\+|B-|B|C\+|C-|C|D|F|W|抵|-)\b/);
        if (!fallback) return;
        credits = Number(fallback[1]);
        grade = fallback[2];
      }
      if (Number.isNaN(credits)) return;

      const preScoreLines = blockLines.filter((_, idx) => idx !== scoreLineIdx);
      const nameParts: string[] = [];

      for (const rawLine of preScoreLines) {
        let line = rawLine.replace(/^\d{4}\s*(必|選|通|體|服)?\s*/, "").trim();
        if (!line) continue;
        if (!/[\u4e00-\u9fa5]/.test(line)) continue;
        if (/[A-Za-z]/.test(line)) continue;
        line = compactZh(line);
        if (skipNameLine(line)) continue;

        for (const token of classifyNoiseTokens) {
          line = line.replace(token, "");
        }
        line = compactZh(line);
        if (!line) continue;

        const classifyAt = classifyKeywords
          .map((k) => line.indexOf(k))
          .filter((idx) => idx >= 0)
          .sort((a, b) => a - b)[0];

        if (classifyAt !== undefined) {
          const beforeClassify = line.slice(0, classifyAt).trim();
          if (beforeClassify && /[\u4e00-\u9fa5]{2,}/.test(beforeClassify)) {
            nameParts.push(beforeClassify);
          }
          break;
        }

        if (isClassifyLine(line)) break;
        if (isOfferedDeptLine(line) && /(系|學院|中心|學務處|體育室)$/.test(line)) break;
        nameParts.push(line);
      }

      let name = cleanCourseName(nameParts.join(""));
      name = name.replace(/^(必|選|通|體|服)\s*/, "").trim();
      for (const token of classifyNoiseTokens) {
        name = name.replace(token, "");
      }
      name = compactZh(name);
      name = name
        .replace(/(語言中心|通識中心|學務處|體育室|外文系|文學院|資工系|應數系|資管系).*$/, "")
        .replace(/(人文領域|社會科學領域|自然科學領域|核心素養|通識自由選|統合領域).*$/, "")
        .replace(/^敘事表達\/?/, "")
        .trim();
      if (hardNoiseCourseNames.has(name)) return;
      if (name.endsWith("外") || name.endsWith("領")) {
        const extension = preScoreLines
          .map((l) => compactZh(l))
          .find((l) => l.startsWith("語習得") || l.startsWith("域"));
        if (extension && extension.startsWith("語習得")) {
          name = `${name}${extension}`;
        }
      }
      if (!name || name.length < 2) return;

      const key = `${currentSemester}-${name}-${credits}-${grade}`;
      if (seen.has(key)) return;
      seen.add(key);
      parsed.push({ semester: currentSemester, name, credits, grade });
    };

    for (const line of lines) {
      const sem = semesterFromLine(line);
      if (sem) currentSemester = sem;

      if (isCourseStartLine(line)) {
        flushBlock();
        currentBlock = [line];
        continue;
      }

      if (currentBlock.length > 0) {
        if (isStopLine(line) || isSemesterLine(line)) {
          flushBlock();
        } else {
          currentBlock.push(line);
        }
      }
    }
    flushBlock();
    return parsed;
  };

  const preprocessCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      const value = gray > 170 ? 255 : 0;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const readPdfText = async (pdfData: Uint8Array) => {
    const pdf = await getDocument({ data: pdfData }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i += 1) {
      setParseStatus(`正在讀取 PDF 文字（第 ${i}/${pdf.numPages} 頁）`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const rows = new Map<string, string[]>();
      for (const item of content.items) {
        if (!("str" in item) || !item.str) continue;
        const y = Math.round(item.transform[5] ?? 0);
        const key = String(y);
        const textPart = item.str.trim();
        if (!textPart) continue;
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key)!.push(textPart);
      }
      const pageLines = [...rows.entries()]
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([, parts]) => parts.join(" ").replace(/\s+/g, " ").trim())
        .filter(Boolean);
      fullText += `${pageLines.join("\n")}\n`;
    }
    return { fullText };
  };

  const readPdfWithOcr = async (pdfData: Uint8Array) => {
    const pdf = await getDocument({ data: pdfData }).promise;
    const worker = await createWorker("chi_tra+eng");
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });
    let ocrText = "";
    try {
      for (let i = 1; i <= pdf.numPages; i += 1) {
        setParseStatus(`正在進行 OCR（第 ${i}/${pdf.numPages} 頁，首次可能較慢）`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.6 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: context, viewport }).promise;
        preprocessCanvas(canvas);
        const dataUrl = canvas.toDataURL("image/png");
        const { data } = await worker.recognize(dataUrl);
        ocrText += `${data.text}\n`;
      }
    } finally {
      await worker.terminate();
    }
    return ocrText;
  };

  const handlePdfUpload = async (file: File) => {
    setIsParsing(true);
    setParseStatus("初始化中...");
    setParseError("");
    try {
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const { fullText } = await readPdfText(fileBytes.slice());

      let sourceText = fullText;
      let parsedCourses = extractCourses(sourceText);
      if (!sourceText.trim() || parsedCourses.length === 0) {
        setParseStatus("偵測到掃描型 PDF，切換 OCR 辨識...");
        sourceText = await readPdfWithOcr(fileBytes.slice());
        parsedCourses = extractCourses(sourceText);
      }

      if (parsedCourses.length < 6 && !sourceText.includes("TRANSCRIPT OF ACADEMIC RECORD")) {
        setParseStatus("OCR 品質偏低，進行第二輪強化辨識...");
        const secondPassText = await readPdfWithOcr(fileBytes.slice());
        const secondPassCourses = extractCourses(secondPassText);
        if (secondPassCourses.length > parsedCourses.length) {
          sourceText = `${sourceText}\n${secondPassText}`;
          parsedCourses = secondPassCourses;
        }
      }

      setRawText(sourceText);
      const parsedProfile = extractProfile(sourceText);
      setProfile(parsedProfile);
      setCourses(parsedCourses);

      if (!sourceText.trim() || parsedCourses.length === 0) {
        setParseError("仍無法辨識到課程資料。請再上傳一份同格式 PDF，我會再調整規則。");
      }
    } catch (error) {
      console.error("PDF parse error:", error);
      const message =
        error instanceof Error && error.message
          ? `PDF 解析失敗：${error.message}`
          : "PDF 解析失敗，請確認檔案格式正確。";
      setParseError(message);
    } finally {
      setParseStatus("");
      setIsParsing(false);
    }
  };

  return (
    <div className="p-4 pb-6 md:max-w-4xl md:mx-auto">
      {/* 標題 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
          <Calculator className="text-white" size={18} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">剩餘學分計算</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 transition-colors">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">上傳學生歷年成績查詢 PDF</p>
        <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed border-blue-400 dark:border-blue-500 rounded-lg text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
          <Upload size={18} />
          <span className="text-sm">{isParsing ? (parseStatus || "解析中...") : "點擊選擇 PDF 檔案"}</span>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={isParsing}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handlePdfUpload(file);
              }
            }}
          />
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">系統會先做文字解析，若是掃描 PDF 會自動改用 OCR。</p>
      </div>

      {parseError && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
          <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">{parseError}</p>
        </div>
      )}

      {/* 主要統計卡片 */}
      {courses.length > 0 && (
        <>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl shadow-lg p-6 mb-4 text-white">
            <div className="flex items-center justify-center mb-4">
              <GraduationCap size={32} className="opacity-90" />
            </div>
            <div className="text-center mb-4">
              <p className="text-xs opacity-75 mb-1">{profile.name || "未辨識姓名"} / {selectedDepartment || "未辨識系所"}</p>
              <p className="text-sm opacity-90 mb-1">剩餘學分</p>
              <p className="text-5xl font-bold">{Math.max(remaining, 0)}</p>
            </div>
            <div className="w-full bg-blue-400/30 rounded-full h-2 mb-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs opacity-90">
              <span>已完成 {completed} 學分</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">畢業門檻</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalRequired}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">學分</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">已完成</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-500">{completed}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">學分</p>
            </div>
            {Object.entries(groupedCredits).map(([groupName, credits]) => (
              <div key={groupName} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{groupName}</p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{credits}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">學分</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">辨識到的課程</p>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-2 pr-2">學期</th>
                    <th className="py-2 pr-2">課程</th>
                    <th className="py-2 pr-2">學分</th>
                    <th className="py-2">成績</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, idx) => (
                    <tr key={`${course.name}-${idx}`} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-2 text-gray-600 dark:text-gray-400">{course.semester || "-"}</td>
                      <td className="py-2 pr-2 text-gray-900 dark:text-gray-100">{course.name}</td>
                      <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{course.credits}</td>
                      <td className="py-2 text-gray-700 dark:text-gray-300">{course.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              {remaining <= 0
                ? "恭喜！已達成畢業學分門檻。"
                : `目前已完成 ${completed} 學分，距離預估畢業門檻還差 ${remaining} 學分。請確認分類是否符合系上規範。`}
            </p>
          </div>
        </>
      )}

      {rawText && (
        <details className="mt-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <summary className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">查看解析文字（除錯用）</summary>
          <pre className="mt-3 text-xs whitespace-pre-wrap text-gray-600 dark:text-gray-400 max-h-48 overflow-auto">{rawText}</pre>
        </details>
      )}
    </div>
  );
}