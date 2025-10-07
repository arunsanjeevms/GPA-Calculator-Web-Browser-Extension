// content.js - enhanced
(function () {
  // Avoid running twice
  if (window.__CGPA_EXT_ALREADY_RAN__) return;
  window.__CGPA_EXT_ALREADY_RAN__ = true;

  function log(...args) {
    console.log("[CGPA EXT]", ...args);
  }

  // Grade to points map (adjust if institution differs)
  const GRADE_MAP = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, D: 4, E: 5, F: 0, RA: 0, AB: 0 };

  function gradeToPoint(g) {
    return GRADE_MAP[g] ?? 0;
  }

  // Try to identify the grade table: first by known ID then fallback heuristics
  function findGradeTable() {
    function scan(doc, depth = 0) {
      if (!doc) return null;
      // direct by ID
      const direct = doc.getElementById("ctl00_ContentPlaceHolder1_Table1");
      if (direct) return direct;
      // heuristic
      const tables = Array.from(doc.querySelectorAll("table"));
      for (const t of tables) {
        const headerText = t.innerText.toLowerCase();
        if (/(course code|course title|credit|grade)/.test(headerText)) return t;
      }
      // recurse into same-origin iframes (limit depth)
      if (depth < 4) {
        const iframes = Array.from(doc.querySelectorAll('iframe'));
        for (const f of iframes) {
          try {
            const innerDoc = f.contentDocument || f.contentWindow?.document;
            const found = scan(innerDoc, depth + 1);
            if (found) return found;
          } catch (e) {
            // cross-origin; skip
          }
        }
      }
      return null;
    }
    return scan(document, 0);
  }

  function parseTable(table) {
    const rows = Array.from(table.querySelectorAll("tbody tr, tr"));
    const data = [];
    rows.forEach((row) => {
      if (/table_head/i.test(row.className)) return; // skip header by class
      const cells = row.querySelectorAll("td");
      if (cells.length < 7) return; // ensure full row
      // Expected structure from user snippet:
      // 0 S.No. | 1 Semester | 2 Course Code | 3 Course Title | 4 Credit | 5 Grade | 6 Result
      const semester = cells[1].innerText.trim();
      const courseCode = cells[2].innerText.trim();
      const courseTitle = cells[3].innerText.trim();
      const creditText = cells[4].innerText.trim();
      const grade = cells[5].innerText.trim();
      const credit = parseFloat(creditText.replace(/[^0-9.]/g, ""));
      if (!semester || !courseCode || !isFinite(credit) || !grade) return;
      data.push({ semester, courseCode, courseTitle, credit, grade });
    });
    return data;
  }

  function aggregate(grades) {
    const total = grades.reduce(
      (acc, g) => {
        const p = gradeToPoint(g.grade);
        acc.points += p * g.credit;
        acc.credits += g.credit;
        return acc;
      },
      { points: 0, credits: 0 }
    );
    const cgpa = total.credits ? total.points / total.credits : 0;

    // Semester-wise
    const semesterMap = {};
    grades.forEach((g) => {
      const semKey = g.semester || "Unknown";
      if (!semesterMap[semKey]) semesterMap[semKey] = { points: 0, credits: 0 };
      const p = gradeToPoint(g.grade);
      semesterMap[semKey].points += p * g.credit;
      semesterMap[semKey].credits += g.credit;
    });
    const semesterGPA = Object.entries(semesterMap).map(([semester, v]) => ({
      semester,
      gpa: v.credits ? (v.points / v.credits) : 0,
      credits: v.credits,
    }));
    semesterGPA.sort((a, b) => a.semester.localeCompare(b.semester, undefined, { numeric: true }));

    return { cgpa: Number(cgpa.toFixed(2)), totalCredits: total.credits, semesterGPA };
  }

  function renderOverlay(result) {
    // Remove any previous overlay
    const prev = document.getElementById("cgpa-extension-overlay");
    if (prev) prev.remove();
    // Create new overlay
    const existing = document.createElement("div");
    existing.id = "cgpa-extension-overlay";
    const position = 'bottom-right'; // change to 'top-right' or 'bottom-left' if desired later
    const posRules = {
      'bottom-right': ['bottom:12px','right:12px'],
      'top-right': ['top:12px','right:12px'],
      'bottom-left': ['bottom:12px','left:12px'],
      'top-left': ['top:12px','left:12px']
    }[position] || ['bottom:12px','right:12px'];
    existing.style.cssText = [
      'position:fixed',
      ...posRules,
      'background:#1e293b',
      'color:#fff',
      'padding:12px 14px',
      'border-radius:8px',
      'z-index:999999',
      'font:14px system-ui,Segoe UI,Arial,sans-serif',
      'box-shadow:0 4px 12px rgba(0,0,0,.25)',
      'max-width:260px',
      'line-height:1.35'
    ].join(';');
    existing.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:8px;">
        <strong style="font-size:15px;">CGPA: ${result.cgpa}</strong>
        <button id="cgpa-ext-close" style="background:#334155;color:#fff;border:none;border-radius:4px;cursor:pointer;padding:2px 6px;font-size:12px;">×</button>
      </div>
      <div style="font-size:12px;margin-bottom:6px;opacity:.85">Total Credits: ${result.totalCredits}</div>
      <details style="background:#0f172a;padding:6px 8px;border-radius:6px;">
        <summary style="cursor:pointer;font-size:12px;">Semester Breakdown</summary>
        <div style="margin-top:6px;font-size:12px;display:flex;flex-direction:column;gap:4px;">
          ${result.semesterGPA
            .map(
              (s) => `<div style="display:flex;justify-content:space-between;">
                <span>${s.semester}</span><span>${s.gpa.toFixed(2)} (${s.credits})</span>
              </div>`
            )
            .join("")}
        </div>
      </details>
    `;
    existing.querySelector("#cgpa-ext-close")?.addEventListener("click", () => {
      existing.remove();
    });
    document.body.appendChild(existing);
  }

  function storeResult(payload) {
    try {
      chrome.storage?.local?.set({ cgpaData: payload });
    } catch (e) {
      // ignore if storage not available
    }
  }

  function main() {
    log('Content script injected. URL:', location.href);
    const table = findGradeTable();
    if (!table) {
      log("No suitable grades table found yet; will retry & observe mutations...");
      let attempts = 0;
      const maxAttempts = 20;
      const retryInterval = setInterval(() => {
        attempts++;
        const t2 = findGradeTable();
        if (t2) {
          clearInterval(retryInterval);
          processTable(t2);
        } else if (attempts >= maxAttempts) {
          clearInterval(retryInterval);
          log("Failed to detect grade table after retries.");
          storeResult({ error: 'TABLE_NOT_FOUND', timestamp: Date.now() });
        }
      }, 500);

      // Mutation observer as secondary path
      const observer = new MutationObserver(() => {
        const t3 = findGradeTable();
        if (t3) {
          observer.disconnect();
          processTable(t3);
        }
      });
      observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
      return;
    }
    processTable(table);
  }

  function processTable(table) {
    try {
      const grades = parseTable(table);
      if (!grades.length) {
        log("No grade rows parsed (maybe still loading). Setting observer on table for dynamic rows.");
        storeResult({ error: 'NO_ROWS', timestamp: Date.now() });
        // Observe for new rows being added later
        const rowObserver = new MutationObserver(() => {
          const again = parseTable(table);
            if (again.length) {
              rowObserver.disconnect();
              log('Rows appeared after mutation, recomputing.');
              const result2 = aggregate(again);
              renderOverlay(result2);
              storeResult({ timestamp: Date.now(), grades: again, result: result2 });
              window.dispatchEvent(new CustomEvent("cgpa-data-ready", { detail: { grades: again, result: result2 } }));
            }
        });
        rowObserver.observe(table, { childList: true, subtree: true });
        return;
      }
      const result = aggregate(grades);
      log("Computed", result);
      renderOverlay(result);
      storeResult({ timestamp: Date.now(), grades, result });
      window.dispatchEvent(new CustomEvent("cgpa-data-ready", { detail: { grades, result } }));
    } catch (e) {
      log("Processing failed", e);
      storeResult({ error: 'PROCESS_FAIL', message: e.message, timestamp: Date.now() });
    }
  }

  // Listen for messages from popup (optional future use)
  try {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === "CGPA_GET_DATA") {
        try {
          chrome.storage?.local?.get(["cgpaData"], (data) => {
            sendResponse(data.cgpaData || null);
          });
        } catch (e) {
          sendResponse(null);
        }
        return true; // async
      }
      if (msg?.type === 'CGPA_FORCE_RECALC') {
        const table = findGradeTable();
        if (table) processTable(table); else main();
        sendResponse({ ok: true });
        return true;
      }
    });
  } catch (e) {
    // ignore when not permitted
  }

  main();
})();
