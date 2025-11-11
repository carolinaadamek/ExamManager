const api = (p, opts={}) => fetch('/api'+p, {headers:{'Content-Type':'application/json'}, ...opts});
const $ = s => document.querySelector(s);

const subjectSel = $('#subject');
const qtext = $('#qtext');
const diffSel = $('#difficulty');
const list = $('#questionList');
const form = $('#qForm');

async function loadSubjects() {
  try {
    const res = await api('/subjects');
    if (!res.ok) throw new Error('subjects fetch failed');
    const subjects = await res.json();

    subjectSel.innerHTML = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    if (subjects.length === 0) {
      list.innerHTML = '<p>Noch keine Fächer. Lege zuerst eines an.</p>';
      return;
    }
    await loadQuestions();
  } catch (e) {
    console.error(e);
    alert('Konnte Fächer nicht laden. Siehe Console.');
  }
}

async function loadQuestions() {
  const sid = subjectSel.value;
  if (!sid) { list.innerHTML = '<p>Kein Fach gewählt.</p>'; return; }
  const res = await api(`/questions?subject_id=${sid}`);
  if (!res.ok) { list.innerHTML = '<p>Fehler beim Laden der Fragen.</p>'; return; }
  const items = await res.json();
  list.innerHTML = items.length ? items.map(q => `
    <div class="q">
      <div><span class="badge">${q.difficulty}</span> ${q.text}</div>
      <ol>${q.options.map(o => `<li>${o.text} ${o.is_correct ? '✅' : ''}</li>`).join('')}</ol>
    </div>
  `).join('') : '<p>Keine Fragen im gewählten Fach.</p>';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const sid = parseInt(subjectSel.value, 10);
  const opts = [...document.querySelectorAll('.opt')].map(i => i.value.trim());
  const correct = parseInt((new FormData(form)).get('correct'), 10);

  const payload = {
    subject_id: sid,
    text: qtext.value.trim(),
    difficulty: diffSel.value,
    options: opts.map((t,i)=>({ text: t, is_correct: i===correct }))
  };

  const res = await api('/questions', { method:'POST', body: JSON.stringify(payload) });
  if (!res.ok) { alert('Fehler beim Speichern der Frage'); return; }

  qtext.value=''; document.querySelectorAll('.opt').forEach(i=>i.value='');
  const checked = form.querySelector('input[name="correct"]:checked'); if (checked) checked.checked=false;
  await loadQuestions();
});

subjectSel.addEventListener('change', loadQuestions);
document.addEventListener('DOMContentLoaded', loadSubjects);
