const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  activeStep: "template",
  templateFile: null,
  workbook: null,
  templateBuffer: null,
  sheetOptions: [],
  selectedSheet: "",
  records: [],
  screenshots: [],
  archiveIssues: [],
  currentRecord: 0,
  applicant: "",
  period: "2026-07",
  currency: "RMB",
};

const STEPS = ["template", "receipts", "review", "export"];
const CATEGORY_KEYS = ["酒店", "机票/火车", "其他交通", "招待餐费", "餐饮", "通讯费", "其他"];

document.addEventListener("DOMContentLoaded", () => {
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  }
  bindStepper();
  render();
});

function bindStepper() {
  $$(".step").forEach((button) => button.addEventListener("click", () => goTo(button.dataset.step)));
}

function goTo(step) {
  const target = STEPS.indexOf(step);
  const unlocked = state.templateFile ? (state.records.length ? 3 : 1) : 0;
  if (target > unlocked) {
    showToast(target > 1 ? "请先导入至少一张票据" : "请先上传公司模板");
    return;
  }
  state.activeStep = step;
  render();
}

function render() {
  $$(".step").forEach((el, index) => {
    const activeIndex = STEPS.indexOf(state.activeStep);
    el.classList.toggle("is-active", el.dataset.step === state.activeStep);
    el.classList.toggle("is-done", index < activeIndex);
  });
  const views = { template: renderTemplate, receipts: renderReceipts, review: renderReview, export: renderExport };
  views[state.activeStep]();
}

function renderTemplate() {
  const root = $("#workspace");
  root.innerHTML = `
    <div class="pane">
      <div class="pane-head">
        <div><h2>先告诉我，公司表格长什么样</h2><p>上传原始 Excel 模板。我们会识别工作表和字段位置，不改动模板文件本身。</p></div>
      </div>
      ${state.templateFile ? templateReadyHtml() : `
        <label class="dropzone" id="template-drop">
          <input id="template-input" type="file" accept=".xlsx,.xls" />
          <div>
            <div class="dropzone-icon"><i class="ph ph-file-xls"></i></div>
            <strong>拖入公司报销模板</strong>
            <p>支持 .xlsx 和 .xls，文件只在本地浏览器中读取</p>
          </div>
        </label>`}
      <div class="trust-grid">
        <div class="trust-item"><i class="ph ph-browser"></i><strong>本地处理</strong><span>模板和票据不发送到服务器。</span></div>
        <div class="trust-item"><i class="ph ph-table"></i><strong>自动找字段</strong><span>识别日期、描述和各费用类别。</span></div>
        <div class="trust-item"><i class="ph ph-copy"></i><strong>保留原文件</strong><span>生成新表，不覆盖你的模板。</span></div>
      </div>
      <div class="action-row"><span></span><button class="button primary" id="template-next" ${state.templateFile ? "" : "disabled"}>继续上传票据 <i class="ph ph-arrow-right"></i></button></div>
    </div>`;

  if (!state.templateFile) bindDropzone("template-drop", "template-input", handleTemplateFiles);
  $("#template-next")?.addEventListener("click", () => goTo("receipts"));
  $("#change-template")?.addEventListener("click", () => {
    state.templateFile = null; state.workbook = null; state.templateBuffer = null; state.sheetOptions = []; state.selectedSheet = ""; render();
  });
  $("#sheet-select")?.addEventListener("change", (event) => { state.selectedSheet = event.target.value; render(); });
}

function templateReadyHtml() {
  const selected = state.sheetOptions.find((sheet) => sheet.name === state.selectedSheet) || state.sheetOptions[0];
  const tags = selected ? selected.fields.map((field) => `<span class="field-tag">${escapeHtml(field)}</span>`).join("") : "";
  return `
    <div class="template-ready">
      <div class="file-summary">
        <div class="file-line"><i class="ph ph-check-circle"></i><div><strong>${escapeHtml(state.templateFile.name)}</strong><span>模板读取成功</span></div></div>
        <button class="button ghost" id="change-template">换一个模板</button>
      </div>
      <div class="field-summary">
        <div class="field"><label for="sheet-select">要填写的工作表</label>
          <select id="sheet-select">${state.sheetOptions.map((sheet) => `<option value="${escapeHtml(sheet.name)}" ${sheet.name === state.selectedSheet ? "selected" : ""}>${escapeHtml(sheet.name)}</option>`).join("")}</select>
        </div>
        <div class="field-tags">${tags}</div>
      </div>
    </div>`;
}

async function handleTemplateFiles(files) {
  const file = files[0];
  if (!file) return;
  if (!window.XLSX) { showToast("表格组件尚未加载，请稍后重试"); return; }
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array", cellStyles: true, cellDates: true });
    const options = workbook.SheetNames.map((name) => analyzeSheet(name, workbook.Sheets[name])).filter(Boolean);
    if (!options.length) throw new Error("没有找到包含“发生日期”和“项目名称”的表头");
    state.templateFile = file;
    state.templateBuffer = data.slice(0);
    state.workbook = workbook;
    state.sheetOptions = options;
    state.selectedSheet = options[0].name;
    showToast(`已识别 ${options.length} 个可填写工作表`);
    render();
  } catch (error) {
    showToast(`模板读取失败：${error.message}`);
  }
}

function analyzeSheet(name, sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
  let headerRow = -1;
  for (let r = 0; r < Math.min(rows.length, 30); r += 1) {
    const joined = rows[r].join("|");
    if (joined.includes("发生日期") && (joined.includes("项目名称") || joined.includes("具体描述"))) { headerRow = r; break; }
  }
  if (headerRow < 0) return null;
  const headers = rows[headerRow].map((value) => String(value).trim());
  const columns = {};
  headers.forEach((header, index) => {
    if (!header) return;
    if (header.includes("发生日期")) columns.date = index;
    else if (header.includes("项目名称") || header.includes("具体描述")) columns.description = index;
    else if (header.includes("金额小计")) columns.subtotal = index;
    else if (header.includes("备注")) columns.note = index;
    else CATEGORY_KEYS.forEach((key) => { if (header.includes(key)) columns[key] = index; });
  });
  let totalRow = rows.findIndex((row, index) => index > headerRow && row.some((cell) => String(cell).trim() === "总计"));
  if (totalRow < 0) totalRow = Math.max(headerRow + 19, rows.length - 1);
  return { name, headerRow, totalRow, columns, fields: headers.filter(Boolean) };
}

function renderReceipts() {
  const root = $("#workspace");
  root.innerHTML = `
    <div class="pane">
      <div class="pane-head"><div><h2>导入发票和相关截图</h2><p>可以分别上传，也可以直接选择一个 ZIP 压缩包。我们会读取内容、匹配对应关系，只把不确定项留给你补充。</p></div></div>
      <div class="upload-grid">
        <label class="dropzone compact" id="invoice-drop">
          <input id="invoice-input" type="file" accept=".pdf,image/*" multiple />
          <div><span class="upload-kicker">发票文件 必需</span><div class="dropzone-icon"><i class="ph ph-receipt"></i></div><strong>上传发票</strong><p>电子发票 PDF 或发票图片，可一次多选</p>${state.records.length ? `<span class="upload-count">已读取 ${state.records.length} 张</span>` : ""}</div>
        </label>
        <label class="dropzone compact evidence-zone" id="screenshot-drop">
          <input id="screenshot-input" type="file" accept="image/*" multiple />
          <div><span class="upload-kicker">辅助材料 推荐</span><div class="dropzone-icon"><i class="ph ph-image-square"></i></div><strong>上传相关截图</strong><p>行程、订单、支付截图，用来判断真实使用信息</p>${state.screenshots.length ? `<span class="upload-count">已分析 ${state.screenshots.length} 张</span>` : ""}</div>
        </label>
      </div>
      <div class="upload-divider"><span>或者</span></div>
      <label class="dropzone bundle-zone" id="archive-drop">
        <input id="archive-input" type="file" accept=".zip,application/zip" multiple />
        <div class="bundle-icon"><i class="ph ph-file-zip"></i></div>
        <div class="bundle-copy"><strong>上传一个 ZIP 压缩包</strong><p>可包含多层文件夹。我们会在本地解压，并按内容自动区分发票和截图。</p></div>
        <span class="bundle-action">选择压缩包 <i class="ph ph-arrow-up"></i></span>
      </label>
      <div id="processing"></div>
      ${state.archiveIssues.length ? archiveIssuesHtml() : ""}
      ${state.screenshots.length ? screenshotMatchesHtml() : ""}
      ${state.records.length ? receiptListHtml() : ""}
      <div class="action-row">
        <span class="local-note"><i class="ph ph-lock-key"></i> 文件只在当前浏览器处理</span>
        <button class="button primary" id="receipts-next" ${state.records.length ? "" : "disabled"}>查看智能识别结果 <i class="ph ph-arrow-right"></i></button>
      </div>
    </div>`;
  bindDropzone("invoice-drop", "invoice-input", processInvoiceFiles);
  bindDropzone("screenshot-drop", "screenshot-input", processScreenshotFiles);
  bindDropzone("archive-drop", "archive-input", processArchiveFiles);
  $("#receipts-next").addEventListener("click", () => goTo("review"));
  $$("[data-remove]").forEach((button) => button.addEventListener("click", () => {
    state.records = state.records.filter((record) => record.id !== button.dataset.remove);
    matchScreenshotsToInvoices();
    render();
  }));
}

function archiveIssuesHtml() {
  return `<section class="archive-report"><div><i class="ph ph-info"></i><strong>压缩包中有 ${state.archiveIssues.length} 个文件未导入</strong></div><ul>${state.archiveIssues.slice(0, 8).map((issue) => `<li><span title="${escapeHtml(issue.name)}">${escapeHtml(issue.name)}</span><em>${escapeHtml(issue.reason)}</em></li>`).join("")}</ul>${state.archiveIssues.length > 8 ? `<p>另有 ${state.archiveIssues.length - 8} 个文件未显示</p>` : ""}</section>`;
}

function screenshotMatchesHtml() {
  const matched = state.screenshots.filter((shot) => shot.status === "matched").length;
  return `<section class="match-panel"><div class="match-head"><div><strong>截图匹配</strong><span>${matched}/${state.screenshots.length} 张已找到对应发票</span></div><i class="ph ph-link"></i></div>
    <div class="match-list">${state.screenshots.map((shot) => {
      const record = state.records.find((item) => item.id === shot.matchedRecordId);
      return `<div class="match-row"><i class="ph ${record ? "ph-check-circle" : "ph-warning-circle"}"></i><span><strong>${escapeHtml(shot.sourceName)}</strong><small>${record ? `已对应：${escapeHtml(record.vendor || record.sourceName)}` : "暂未找到对应发票，核对时会提醒"}</small></span><em>${record ? "已匹配" : "待核对"}</em></div>`;
    }).join("")}</div></section>`;
}

function receiptListHtml() {
  return `<div class="receipt-list">${state.records.map((record, index) => `
    <div class="receipt-row">
      <div class="receipt-index">${String(index + 1).padStart(2, "0")}</div>
      <div class="receipt-main"><strong>${escapeHtml(record.vendor || "未识别商户")}</strong><span>${escapeHtml(record.sourceName)}</span></div>
      <div class="receipt-meta">开票日期 ${record.invoiceDate || "未识别"}</div>
      <div class="money">¥${money(record.amount)}</div>
      <div><span class="status ${record.evidenceNames.length ? "good" : ""}">${record.evidenceNames.length ? "已匹配截图" : (record.confidence < .6 ? "需补充" : "待确认")}</span> <button class="button ghost" data-remove="${record.id}" aria-label="移除"><i class="ph ph-trash"></i></button></div>
    </div>`).join("")}</div>`;
}

async function processInvoiceFiles(files) {
  if (!files.length) return;
  const processing = $("#processing");
  processing.className = "processing";
  for (const [index, file] of [...files].entries()) {
    const item = document.createElement("div");
    item.className = "processing-item";
    item.innerHTML = `<div class="processing-top"><span>${escapeHtml(file.name)}</span><span>读取中</span></div><div class="thin-progress"><span style="width:12%"></span></div>`;
    processing.appendChild(item);
    try {
      const text = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
        ? await extractPdfText(file, (p) => setProgress(item, p))
        : await extractImageText(file, (p) => setProgress(item, p));
      state.records.push(parseInvoiceText(text, file.name));
      setProgress(item, 1, "完成");
    } catch (error) {
      state.records.push(blankRecord(file.name));
      setProgress(item, 1, "需要手动补充");
    }
    if (index < files.length - 1) await new Promise((resolve) => setTimeout(resolve, 80));
  }
  matchScreenshotsToInvoices();
  showToast(`已读取 ${files.length} 张发票`);
  setTimeout(render, 350);
}

async function processScreenshotFiles(files) {
  if (!files.length) return;
  const processing = $("#processing");
  processing.className = "processing";
  for (const file of [...files]) {
    const item = document.createElement("div");
    item.className = "processing-item";
    item.innerHTML = `<div class="processing-top"><span>${escapeHtml(file.name)}</span><span>分析截图</span></div><div class="thin-progress"><span style="width:12%"></span></div>`;
    processing.appendChild(item);
    try {
      const text = await extractImageText(file, (p) => setProgress(item, p));
      state.screenshots.push(parseScreenshotText(text, file.name));
      setProgress(item, 1, "完成");
    } catch {
      state.screenshots.push({ id: crypto.randomUUID(), sourceName: file.name, dates: [], amounts: [], merchant: "", invoiceNo: "", matchedRecordId: "", matchConfidence: 0, status: "unmatched" });
      setProgress(item, 1, "未能识别");
    }
  }
  matchScreenshotsToInvoices();
  showToast("截图分析完成，已尝试匹配发票");
  setTimeout(render, 350);
}

async function processArchiveFiles(files) {
  if (!files.length) return;
  if (!window.JSZip) { showToast("压缩包组件尚未加载，请稍后重试"); return; }
  const processing = $("#processing");
  processing.className = "processing";
  state.archiveIssues = [];
  let invoiceCount = 0;
  let screenshotCount = 0;

  for (const archive of [...files]) {
    const item = document.createElement("div");
    item.className = "processing-item";
    item.innerHTML = `<div class="processing-top"><span title="${escapeHtml(archive.name)}">${escapeHtml(archive.name)}</span><span>检查压缩包</span></div><div class="thin-progress"><span style="width:12%"></span></div>`;
    processing.appendChild(item);
    try {
      const zip = await JSZip.loadAsync(await archive.arrayBuffer());
      const entries = Object.values(zip.files).filter((entry) => !entry.dir && !isHiddenArchiveEntry(entry.name));
      const totalSize = entries.reduce((sum, entry) => sum + Number(entry._data?.uncompressedSize || 0), 0);
      if (entries.length > 100) throw new Error("单个压缩包最多支持 100 个文件");
      if (totalSize > 80 * 1024 * 1024) throw new Error("解压后的文件总量不能超过 80 MB");
      if (!entries.length) throw new Error("没有找到可读取的文件");

      for (const [index, entry] of entries.entries()) {
        const name = entry.name.split("/").filter(Boolean).at(-1) || entry.name;
        const extension = name.split(".").at(-1)?.toLowerCase() || "";
        const size = Number(entry._data?.uncompressedSize || 0);
        if (!["pdf", "png", "jpg", "jpeg", "webp"].includes(extension)) {
          state.archiveIssues.push({ name: entry.name, reason: "不支持此文件格式" });
          continue;
        }
        if (size > 20 * 1024 * 1024) {
          state.archiveIssues.push({ name: entry.name, reason: "单个文件超过 20 MB" });
          continue;
        }
        setProgress(item, Math.max(.08, index / entries.length), `识别 ${index + 1}/${entries.length}`);
        try {
          const blob = await entry.async("blob");
          const file = new File([blob], name, { type: mimeForExtension(extension) });
          if (extension === "pdf") {
            const text = await extractPdfText(file, () => {});
            state.records.push(parseInvoiceText(text, name));
            invoiceCount += 1;
          } else {
            const text = await extractImageText(file, () => {});
            if (!text.trim()) throw new Error("图片中没有识别到文字");
            if (looksLikeInvoice(text)) {
              state.records.push(parseInvoiceText(text, name));
              invoiceCount += 1;
            } else {
              state.screenshots.push(parseScreenshotText(text, name));
              screenshotCount += 1;
            }
          }
        } catch (error) {
          state.archiveIssues.push({ name: entry.name, reason: error.message || "识别失败" });
        }
      }
      setProgress(item, 1, "解压识别完成");
    } catch (error) {
      state.archiveIssues.push({ name: archive.name, reason: error.message || "压缩包读取失败" });
      setProgress(item, 1, "无法读取");
    }
  }
  matchScreenshotsToInvoices();
  const imported = invoiceCount + screenshotCount;
  showToast(imported ? `已导入 ${invoiceCount} 张发票和 ${screenshotCount} 张截图` : "压缩包中没有可导入的票据");
  setTimeout(render, 450);
}

function isHiddenArchiveEntry(name) {
  return name.split("/").some((part) => part === "__MACOSX" || part.startsWith("."));
}

function mimeForExtension(extension) {
  return ({ pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" })[extension] || "application/octet-stream";
}

function looksLikeInvoice(text) {
  const compact = text.replace(/\s+/g, "");
  const signals = [/发票号码/, /电子发票/, /数电票/, /价税合计/, /开票日期/, /购买方(?:信息|名称)/, /销售方(?:信息|名称)/, /税额/];
  return signals.filter((pattern) => pattern.test(compact)).length >= 2;
}

async function extractPdfText(file, onProgress) {
  if (!window.pdfjsLib) throw new Error("PDF 组件未加载");
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = "";
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
    onProgress(pageNo / pdf.numPages);
  }
  return text;
}

async function extractImageText(file, onProgress) {
  if (!window.Tesseract) throw new Error("OCR 组件未加载");
  const result = await Tesseract.recognize(file, "chi_sim+eng", { logger: (event) => {
    if (event.status === "recognizing text") onProgress(event.progress || .1);
  }});
  return result.data.text;
}

function parseInvoiceText(text, sourceName) {
  const compact = text.replace(/\s+/g, "");
  const invoiceNo = firstMatch(compact, [/发票号码[：:]?(\d{15,25})/, /(\d{20})/]);
  const rawDate = firstMatch(compact, [/(20\d{2})年(\d{1,2})月(\d{1,2})日/], true);
  const invoiceDate = rawDate ? `${rawDate[1]}-${pad(rawDate[2])}-${pad(rawDate[3])}` : "";
  const totalMatch = compact.match(/小写[）)]?[¥￥]?([\d,.]+\.\d{2})/);
  const currencyAmounts = [...compact.matchAll(/[¥￥]([\d,.]+\.\d{2})/g)].map((match) => match[1]);
  const numericCurrencyAmounts = currencyAmounts.map((value) => Number(value.replaceAll(",", ""))).filter(Number.isFinite);
  let amount = Number(String(totalMatch?.[1] || Math.max(0, ...numericCurrencyAmounts)).replaceAll(",", "")) || 0;
  if (amount > 10000000) amount = 0;
  const partyMatch = compact.match(/20\d{2}年\d{1,2}月\d{1,2}日(.{2,100}?)([0-9A-Z]{18})(.{2,120}?)([0-9A-Z]{18})(?=项目名称)/);
  const companyMatches = [...compact.matchAll(/([\u4e00-\u9fa5（）()]{3,90}?(?:有限公司|有限责任公司)(?:[\u4e00-\u9fa5]{0,12}(?:分公司|分社))?)/g)];
  const vendor = companyMatches.at(-1)?.[1] || partyMatch?.[3] || "";
  const item = firstMatch(compact, [/(代订机票产品|代订房费|技术服务费|信息服务费|广告制作)/, /项目名称.*?(\*[^¥￥\d]{2,45}?)(?=规格型号|单位|数量|单价|金额)/]) || "票面项目待核对";
  const normalizedItem = item.replace(/\*/g, "").replace(/生产生活服务/g, "").trim();
  return {
    id: crypto.randomUUID(), sourceName, vendor: vendor?.trim() || "", invoiceDate, invoiceNo: invoiceNo || "",
    item: normalizedItem, amount,
    category: classify(normalizedItem), actualDate: "", description: normalizedItem === "票面项目待核对" ? "" : normalizedItem, note: "",
    confidence: vendor && amount && normalizedItem !== "票面项目待核对" ? 0.86 : 0.45,
    evidenceDates: [], evidenceNames: [], matchConfidence: 0, confirmed: false,
  };
}

function blankRecord(sourceName) {
  return { id: crypto.randomUUID(), sourceName, vendor: "", invoiceDate: "", invoiceNo: "", item: "", amount: 0, category: "其他", actualDate: "", description: "", note: "", confidence: 0, evidenceDates: [], evidenceNames: [], matchConfidence: 0, confirmed: false };
}

function parseScreenshotText(text, sourceName) {
  const compact = text.replace(/\s+/g, "");
  const currencyAmounts = [...compact.matchAll(/[¥￥]\s*([\d,]+(?:\.\d{1,2})?)/g)].map((match) => match[1]);
  const labeledAmounts = [...compact.matchAll(/(?:支付金额|订单金额|实付|合计|金额)[：:]?([\d,]+(?:\.\d{1,2})?)/g)].map((match) => match[1]);
  const amounts = [...currencyAmounts, ...labeledAmounts]
    .map((value) => Number(value.replaceAll(",", ""))).filter((value) => Number.isFinite(value) && value > 0);
  const companyMatches = [...compact.matchAll(/([\u4e00-\u9fa5（）()]{3,70}?(?:有限公司|有限责任公司)(?:[\u4e00-\u9fa5]{0,12}(?:分公司|分社))?)/g)];
  return {
    id: crypto.randomUUID(), sourceName, dates: extractCandidateDates(text), amounts: [...new Set(amounts)],
    merchant: companyMatches.at(-1)?.[1] || "",
    invoiceNo: firstMatch(compact, [/发票号码[：:]?(\d{15,25})/, /(\d{20})/]) || "",
    matchedRecordId: "", matchConfidence: 0, status: "unmatched",
  };
}

function matchScreenshotsToInvoices() {
  state.records.forEach((record) => { record.evidenceDates = []; record.evidenceNames = []; record.matchConfidence = 0; });
  state.screenshots.forEach((shot) => {
    let best = null;
    let runnerUp = 0;
    state.records.forEach((record) => {
      let score = 0;
      if (shot.invoiceNo && record.invoiceNo && shot.invoiceNo === record.invoiceNo) score += .85;
      if (shot.amounts.some((amount) => Math.abs(amount - Number(record.amount)) < .01)) score += .65;
      if (shot.merchant && record.vendor && (shot.merchant.includes(record.vendor) || record.vendor.includes(shot.merchant))) score += .35;
      if (!best || score > best.score) { runnerUp = best?.score || 0; best = { record, score }; }
      else runnerUp = Math.max(runnerUp, score);
    });
    const reliable = best && best.score >= .6 && (best.score - runnerUp >= .2 || best.score >= .85);
    shot.matchedRecordId = reliable ? best.record.id : "";
    shot.matchConfidence = reliable ? Math.min(1, best.score) : 0;
    shot.status = reliable ? "matched" : "unmatched";
    if (reliable) {
      best.record.evidenceDates = [...new Set([...best.record.evidenceDates, ...shot.dates])].slice(0, 4);
      best.record.evidenceNames.push(shot.sourceName);
      best.record.matchConfidence = Math.max(best.record.matchConfidence, shot.matchConfidence);
    }
  });
}

function classify(text) {
  if (/机票|火车|高铁|动车/.test(text)) return "机票/火车";
  if (/酒店|住宿|房费/.test(text)) return "酒店";
  if (/餐饮|餐费|食品/.test(text)) return "招待餐费";
  if (/出租|网约|打车|停车|过路|交通/.test(text)) return "其他交通";
  if (/通信|通讯|话费|流量/.test(text)) return "通讯费";
  return "其他";
}

function renderReview() {
  const current = state.records[state.currentRecord] || state.records[0];
  if (!current) { goTo("receipts"); return; }
  const root = $("#workspace");
  root.innerHTML = `
    <div class="review-layout">
      <aside class="review-nav"><h2>还差 ${state.records.filter((record) => !isConfirmed(record)).length} 项确认</h2>${state.records.map((record, index) => `
        <button class="review-choice ${index === state.currentRecord ? "is-active" : ""}" data-record="${index}">
          <span class="mini">${index + 1}</span><span class="review-choice-copy"><strong title="${escapeHtml(record.vendor || "待补充商户")}">${escapeHtml(record.vendor || "待补充商户")}</strong><small>¥${money(record.amount)}</small></span>
          <i class="ph ${isConfirmed(record) ? "ph-check-circle" : "ph-circle"}"></i>
        </button>`).join("")}</aside>
      <div class="review-editor">
        <div class="editor-head"><div><h3>${current.confidence < .6 ? "这笔需要你补充一下" : "请确认这笔识别结果"}</h3><p>${current.confidence < .6 ? "部分票面信息不确定，补齐标记字段即可。" : (current.evidenceNames.length ? `已结合 ${current.evidenceNames.length} 张截图匹配，请确认实际信息。` : "票面读取完整；实际日期和用途仍由你确认。")}</p></div><div class="amount-callout"><small>价税合计</small><strong>¥${money(current.amount)}</strong></div></div>
        <div class="fact-strip">
          <div class="fact"><small>销售方</small><span title="${escapeHtml(current.vendor)}">${escapeHtml(current.vendor || "未识别")}</span></div>
          <div class="fact"><small>开票日期，仅供参考</small><span>${current.invoiceDate || "未识别"}</span></div>
          <div class="fact"><small>票面项目</small><span title="${escapeHtml(current.item)}">${escapeHtml(current.item || "未识别")}</span></div>
        </div>
        ${current.confidence < .6 ? `<div class="manual-panel"><div class="manual-head"><i class="ph ph-warning-circle"></i><div><strong>有些票面信息不够确定</strong><span>只需补充或修正下面几项，不确定时可以对照原发票。</span></div></div><div class="form-grid">
          <div class="field"><label for="vendor">销售方</label><input id="vendor" value="${escapeHtml(current.vendor)}" placeholder="发票上的销售方名称" /></div>
          <div class="field"><label for="amount">价税合计 <span class="required">*</span></label><input id="amount" type="number" min="0" step="0.01" value="${current.amount || ""}" placeholder="0.00" /></div>
          <div class="field full"><label for="invoice-no">发票号码</label><input id="invoice-no" inputmode="numeric" value="${escapeHtml(current.invoiceNo)}" placeholder="可选，用于核对" /></div>
        </div></div>` : ""}
        <div class="form-grid">
          <div class="field"><label for="actual-date">实际发生日期 <span class="required">*</span></label><input id="actual-date" type="date" value="${current.actualDate}" /><span class="field-hint">不要直接照抄开票日期，请按行程、支付或实际使用日期填写。</span></div>
          <div class="field"><label for="category">费用类别 <span class="required">*</span></label><select id="category">${availableCategories().map((category) => `<option ${category === current.category ? "selected" : ""}>${category}</option>`).join("")}</select><span class="field-hint">金额会写入模板中对应的费用列。</span></div>
          <div class="field full"><label for="description">项目名称 / 具体用途 <span class="required">*</span></label><input id="description" value="${escapeHtml(current.description)}" placeholder="例如：上海行业活动差旅 - 北京至上海机票" /><span class="field-hint">建议写清楚事项、地点和用途，财务通常更容易一次通过。</span></div>
          <div class="field full"><label for="note">备注</label><textarea id="note" placeholder="可选：同行人、分摊说明、特殊审批等">${escapeHtml(current.note)}</textarea></div>
        </div>
        <div class="evidence">
          <div class="evidence-top"><div><strong>不记得日期？上传行程或支付截图</strong><p>截图会在浏览器内识别，并给出可选日期，不会直接替你决定。</p></div><label class="button secondary"><i class="ph ph-camera"></i> 选择截图<input id="evidence-input" type="file" accept="image/*" /></label></div>
          <div class="suggestions">${current.evidenceDates.map((date) => `<button class="suggestion" data-date="${date}">${date}</button>`).join("")}</div>
        </div>
        <div class="editor-actions"><button class="button secondary" id="prev-record" ${state.currentRecord === 0 ? "disabled" : ""}><i class="ph ph-arrow-left"></i> 上一笔</button><button class="button primary" id="next-record">${state.currentRecord === state.records.length - 1 ? "确认并查看导出" : "确认并看下一笔"} <i class="ph ph-arrow-right"></i></button></div>
      </div>
    </div>`;
  bindReview(current);
}

function bindReview(current) {
  const update = () => {
    const vendor = $("#vendor")?.value.trim() ?? current.vendor;
    const invoiceNo = $("#invoice-no")?.value.trim() ?? current.invoiceNo;
    const amount = $("#amount") ? Number($("#amount").value) : current.amount;
    const changed = current.actualDate !== $("#actual-date").value || current.category !== $("#category").value || current.description !== $("#description").value.trim() || current.note !== $("#note").value.trim() || current.vendor !== vendor || current.invoiceNo !== invoiceNo || current.amount !== amount;
    current.actualDate = $("#actual-date").value;
    current.category = $("#category").value;
    current.description = $("#description").value.trim();
    current.note = $("#note").value.trim();
    current.vendor = vendor;
    current.invoiceNo = invoiceNo;
    current.amount = amount;
    if (changed) current.confirmed = false;
  };
  ["actual-date", "category", "description", "note", "vendor", "invoice-no", "amount"].forEach((id) => $("#" + id)?.addEventListener("input", update));
  $$("[data-record]").forEach((button) => button.addEventListener("click", () => { update(); state.currentRecord = Number(button.dataset.record); render(); }));
  $("#prev-record").addEventListener("click", () => { update(); state.currentRecord -= 1; render(); });
  $("#next-record").addEventListener("click", () => {
    update();
    if (!isComplete(current)) { showToast("请补充实际发生日期和具体用途"); return; }
    current.confirmed = true;
    if (state.currentRecord < state.records.length - 1) { state.currentRecord += 1; render(); }
    else goTo("export");
  });
  $$("[data-date]").forEach((button) => button.addEventListener("click", () => { $("#actual-date").value = button.dataset.date; update(); }));
  $("#evidence-input").addEventListener("change", async (event) => {
    const file = event.target.files[0]; if (!file) return;
    showToast("正在本地识别截图日期");
    try {
      const text = await extractImageText(file, () => {});
      current.evidenceDates = extractCandidateDates(text);
      current.evidenceNames = [...new Set([...current.evidenceNames, file.name])];
      current.confirmed = false;
      showToast(current.evidenceDates.length ? "已找到可选日期，请确认" : "没有识别到明确日期，请手动填写");
      render();
    } catch { showToast("截图识别失败，请手动填写日期"); }
  });
}

function extractCandidateDates(text) {
  const results = new Set();
  for (const match of text.matchAll(/(20\d{2})[年\-\/.](\d{1,2})[月\-\/.](\d{1,2})/g)) results.add(`${match[1]}-${pad(match[2])}-${pad(match[3])}`);
  return [...results].slice(0, 4);
}

function availableCategories() {
  const selected = state.sheetOptions.find((sheet) => sheet.name === state.selectedSheet);
  const found = selected ? CATEGORY_KEYS.filter((key) => selected.columns[key] !== undefined) : CATEGORY_KEYS;
  return [...new Set(found.map((key) => key === "餐饮" ? "餐饮" : key))];
}

function renderExport() {
  const incomplete = state.records.filter((record) => !isConfirmed(record));
  const selected = state.sheetOptions.find((sheet) => sheet.name === state.selectedSheet);
  const total = state.records.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const root = $("#workspace");
  root.innerHTML = `
    <div class="pane">
      <div class="pane-head"><div><h2>${incomplete.length ? "还有几项需要确认" : "检查完成，可以生成表格"}</h2><p>${incomplete.length ? `有 ${incomplete.length} 张票据尚未完成信息确认，确认后即可下载。` : "所有信息已经逐项确认，金额会写入所选类别，票面事实放在备注中便于核对。"}</p></div></div>
      <div class="summary-grid">
        <div class="summary-card"><small>票据数量</small><strong>${state.records.length} 张</strong></div>
        <div class="summary-card"><small>报销总额</small><strong>¥${money(total)}</strong></div>
        <div class="summary-card"><small>目标工作表</small><strong style="font-size:17px">${escapeHtml(selected?.name || "")}</strong></div>
      </div>
      <div class="checklist">
        <div class="check"><i class="ph ph-check-circle"></i><div><strong>模板字段已匹配</strong><span>发生日期、用途、费用类别、金额小计和备注均已找到。</span></div></div>
        <div class="check"><i class="ph ${incomplete.length ? "ph-warning-circle" : "ph-check-circle"}"></i><div><strong>实际信息${incomplete.length ? "仍待确认" : "已确认"}</strong><span>${incomplete.length ? "返回逐项确认，补充真实发生日期和用途。" : "没有使用文件名或开票日期替代实际发生日期。"}</span></div></div>
      </div>
      <div class="export-form">
        <div class="field"><label for="applicant">报销申请人</label><input id="applicant" value="${escapeHtml(state.applicant)}" placeholder="请输入姓名" /></div>
        <div class="field"><label for="period">报销月份</label><input id="period" type="month" value="${state.period}" /></div>
        <div class="field"><label for="currency">货币单位</label><select id="currency"><option ${state.currency === "RMB" ? "selected" : ""}>RMB</option><option ${state.currency === "USD" ? "selected" : ""}>USD</option><option ${state.currency === "HKD" ? "selected" : ""}>HKD</option><option ${state.currency === "EUR" ? "selected" : ""}>EUR</option></select></div>
      </div>
      <div class="privacy-note"><i class="ph ph-shield-check"></i> 下载完成后，当前页面不会保留你的文件。关闭或刷新页面即可清空本次数据。</div>
      <div class="action-row"><button class="button secondary" id="back-review"><i class="ph ph-arrow-left"></i> 返回检查</button><button class="button primary" id="download" ${incomplete.length ? "disabled" : ""}><i class="ph ph-download-simple"></i> 生成 Excel 报销单</button></div>
    </div>`;
  $("#applicant").addEventListener("input", (event) => { state.applicant = event.target.value; });
  $("#period").addEventListener("input", (event) => { state.period = event.target.value; });
  $("#currency").addEventListener("input", (event) => { state.currency = event.target.value; });
  $("#back-review").addEventListener("click", () => { state.currentRecord = Math.max(0, state.records.findIndex((record) => !isConfirmed(record))); goTo("review"); });
  $("#download").addEventListener("click", exportWorkbook);
}

async function exportWorkbook() {
  const option = state.sheetOptions.find((sheet) => sheet.name === state.selectedSheet);
  if (!option || !state.templateBuffer || !window.XlsxPopulate || !window.JSZip) { showToast("没有找到目标工作表，或样式保留组件尚未加载"); return; }
  const startRow = option.headerRow + 1;
  if (startRow + state.records.length > option.totalRow) { showToast("票据数量超过模板预留行数，请减少后再导出"); return; }

  try {
    showToast("正在按原模板生成表格");
    const styledWorkbook = await XlsxPopulate.fromDataAsync(state.templateBuffer.slice(0));
    const sheet = styledWorkbook.sheet(state.selectedSheet);
    const rows = XLSX.utils.sheet_to_json(state.workbook.Sheets[state.selectedSheet], { header: 1, defval: "" });
    const write = (row, col, value, format) => {
      if (col === undefined) return;
      const cell = sheet.cell(row + 1, col + 1);
      cell.value(value);
      if (format) cell.style("numberFormat", format);
    };

    const clearColumns = [...new Set(Object.values(option.columns))];
    for (let row = startRow; row < option.totalRow; row += 1) clearColumns.forEach((col) => write(row, col, null));

    state.records.forEach((record, index) => {
      const row = startRow + index;
      const [year, month, day] = record.actualDate.split("-").map(Number);
      write(row, option.columns.date, new Date(year, month - 1, day), "yyyy-mm-dd");
      write(row, option.columns.description, record.description);
      write(row, resolveCategoryColumn(option.columns, record.category), Number(record.amount), "#,##0.00");
      const categoryCols = CATEGORY_KEYS.map((key) => option.columns[key]).filter((col) => col !== undefined);
      if (option.columns.subtotal !== undefined && categoryCols.length) {
        const first = XLSX.utils.encode_col(categoryCols[0]) + (row + 1);
        const last = XLSX.utils.encode_col(categoryCols[categoryCols.length - 1]) + (row + 1);
        sheet.cell(row + 1, option.columns.subtotal + 1).formula(`SUM(${first}:${last})`).style("numberFormat", "#,##0.00");
      }
      write(row, option.columns.note, [record.note, `销售方：${record.vendor}`, `发票号：${record.invoiceNo || "未识别"}`, `开票日期：${record.invoiceDate || "未识别"}`].filter(Boolean).join("；"));
    });

    for (const col of [...CATEGORY_KEYS.map((key) => option.columns[key]), option.columns.subtotal].filter((value) => value !== undefined)) {
      const column = XLSX.utils.encode_col(col);
      sheet.cell(option.totalRow + 1, col + 1).formula(`SUM(${column}${startRow + 1}:${column}${option.totalRow})`).style("numberFormat", "#,##0.00");
    }

    const applicantLabel = findCell(rows, "报销申请人");
    if (applicantLabel && state.applicant) write(applicantLabel.r, applicantLabel.c + 1, state.applicant);
    const [periodYear, periodMonth] = state.period.split("-");
    const titleCell = findTitleCell(rows);
    if (titleCell) write(titleCell.r, titleCell.c, `${periodYear}.${Number(periodMonth)}月费用报销单`);
    const currencyLabel = findCell(rows, "货币单位");
    if (currencyLabel) {
      const nextValue = rows[currencyLabel.r]?.[currencyLabel.c + 1];
      if (nextValue) write(currencyLabel.r, currencyLabel.c + 1, state.currency);
      else write(currencyLabel.r, currencyLabel.c, `货币单位：${state.currency}`);
    }

    const filename = `报销单-${state.applicant || "申请人"}-${state.period}.xlsx`;
    const output = await styledWorkbook.outputAsync();
    const zip = await JSZip.loadAsync(output);
    const relsPath = "xl/_rels/workbook.xml.rels";
    const rels = await zip.file(relsPath).async("string");
    zip.file(relsPath, rels.replace(/<Relationship[^>]+calcChain[^>]+\/>/g, ""));
    const typesPath = "[Content_Types].xml";
    const contentTypes = await zip.file(typesPath).async("string");
    zip.file(typesPath, contentTypes.replace(/<Override[^>]+calcChain[^>]+\/>/g, ""));
    zip.remove("xl/calcChain.xml");
    const finalBlob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(finalBlob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("报销单已生成，请检查下载文件");
  } catch (error) {
    showToast(`生成失败：${error.message}`);
  }
}

function resolveCategoryColumn(columns, category) {
  if (columns[category] !== undefined) return columns[category];
  if (category === "餐饮" && columns["招待餐费"] !== undefined) return columns["招待餐费"];
  if (category === "招待餐费" && columns["餐饮"] !== undefined) return columns["餐饮"];
  return columns["其他"];
}

function findCell(rows, label) {
  for (let r = 0; r < rows.length; r += 1) for (let c = 0; c < rows[r].length; c += 1) if (String(rows[r][c]).includes(label)) return { r, c };
  return null;
}

function findTitleCell(rows) {
  for (let r = 0; r < Math.min(4, rows.length); r += 1) for (let c = 0; c < rows[r].length; c += 1) if (/报销单/.test(String(rows[r][c]))) return { r, c };
  return null;
}

function bindDropzone(zoneId, inputId, handler) {
  const zone = $("#" + zoneId); const input = $("#" + inputId);
  if (!zone || !input) return;
  ["dragenter", "dragover"].forEach((eventName) => zone.addEventListener(eventName, (event) => { event.preventDefault(); zone.classList.add("is-dragging"); }));
  ["dragleave", "drop"].forEach((eventName) => zone.addEventListener(eventName, (event) => { event.preventDefault(); zone.classList.remove("is-dragging"); }));
  zone.addEventListener("drop", (event) => handler([...event.dataTransfer.files]));
  input.addEventListener("change", (event) => handler([...event.target.files]));
}

function setProgress(item, progress, label = "识别中") {
  $(".thin-progress span", item).style.width = `${Math.max(12, Math.round(progress * 100))}%`;
  $(".processing-top span:last-child", item).textContent = label;
}

function firstMatch(text, patterns, raw = false) {
  for (const pattern of patterns) { const match = text.match(pattern); if (match) return raw ? match : match[1]; }
  return "";
}
function isComplete(record) { return Boolean(record.actualDate && record.description && record.category && Number(record.amount) > 0); }
function isConfirmed(record) { return Boolean(record.confirmed && isComplete(record)); }
function pad(value) { return String(value).padStart(2, "0"); }
function money(value) { return Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char])); }
function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("is-visible");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}
