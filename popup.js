function qs(id){return document.getElementById(id);} 

function render(data){
  if(!data){
    qs('cgpa-value').textContent='--';
    qs('credits-value').textContent='--';
    qs('semester-list').innerHTML='<div style="opacity:.6;font-size:12px;">Open the ERP grades page.</div>';
    qs('grades-table').innerHTML='';
    return;
  }
  if(data.error){
    qs('cgpa-value').textContent='--';
    qs('credits-value').textContent='--';
    qs('semester-list').innerHTML=`<div style="opacity:.7;font-size:12px;">${data.error === 'TABLE_NOT_FOUND' ? 'Grade table not found yet.' : 'No rows parsed yet.'}</div>`;
    qs('grades-table').innerHTML='';
    return;
  }
  const { result, grades } = data;
  qs('cgpa-value').textContent = result.cgpa.toFixed(2);
  qs('credits-value').textContent = result.totalCredits;
  qs('semester-list').innerHTML = result.semesterGPA.map(s=>`<div class="sem-item"><span>${s.semester}</span><span>${s.gpa.toFixed(2)} (${s.credits})</span></div>`).join('');
  const gradeMap = { 'O':10,'A+':9,'A':8,'B+':7,'B':6,'C':5,'D':4,'E':5,'F':0,'RA':0,'AB':0 };
  const rows = grades.map(g=>{
    const gp = (gradeMap[g.grade]??0) * g.credit;
    return `<tr><td>${g.semester||''}</td><td>${g.courseCode||''}</td><td>${g.courseTitle||''}</td><td>${g.credit}</td><td>${g.grade}</td><td>${gp}</td></tr>`;
  }).join('');
  qs('grades-table').innerHTML = `<table><thead><tr><th>Sem</th><th>Code</th><th>Title</th><th>Cr</th><th>Grade</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function requestFromActiveTab(){
  chrome.tabs.query({active:true,currentWindow:true}, tabs => {
    const tab = tabs[0];
    if(!tab){ return; }

    // helper to actually ask for data
    const ask = () => {
      let responded = false;
      chrome.tabs.sendMessage(tab.id, {type:'CGPA_GET_DATA'}, resp => {
        responded = true;
        if(chrome.runtime.lastError){
          // Will attempt injection if not already tried
          attemptInject(tab, true);
        } else if(!resp){
          // Might still be parsing / or no data saved yet
          render({ error: 'NO_ROWS' });
        } else {
          render(resp);
        }
      });
      // Timeout fallback
      setTimeout(()=>{ if(!responded){ attemptInject(tab, true); } }, 400);
    };
    ask();
  });
}

let lastInjectedTab = null;
function attemptInject(tab, requeryAfter){
  if(!tab || !/^https?:\/\/.*camsmkce\.in/i.test(tab.url||'')){
    render(null); return;
  }
  // Prevent infinite reinjection loops
  if(lastInjectedTab === tab.id){
    return; // already tried
  }
  lastInjectedTab = tab.id;
  try {
    chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['content.js'] }, () => {
      setTimeout(()=>{ if(requeryAfter) requestFromActiveTab(); }, 250);
    });
  } catch(e){
    console.error('Injection failed', e);
  }
}

function forceRecalc(){
  chrome.tabs.query({active:true,currentWindow:true}, tabs => {
    const tab = tabs[0];
    if(!tab) return;
    chrome.tabs.sendMessage(tab.id, {type:'CGPA_FORCE_RECALC'}, () => {
      setTimeout(requestFromActiveTab, 400); // brief delay for recompute
    });
  });
}

qs('refresh-btn').addEventListener('click', () => { forceRecalc(); });

// initial load
requestFromActiveTab();
