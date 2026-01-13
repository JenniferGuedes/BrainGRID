
// --------- State ---------
const today = new Date();
let currentWeekStart = startOfWeekFromDate(today); // Sunday of current week
let selectedDate = null;

// --------- Boot ---------
window.onload = () => {
  updateCalendar();
  startGoogleApis(); // init gapi client; login happens via button (login())
};

// --------- Helpers ---------
function startOfWeekFromDate(d) {
  const base = new Date(d);
  base.setHours(0,0,0,0);
  base.setDate(base.getDate() - base.getDay()); // Sunday
  return base;
}

function endOfWeekFromDate(start) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23,59,59,999);
  return end;
}

function ymdId(date) {
  return `day-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatWeekLabel(start, end) {
  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                      "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
}

// --------- Calendar UI ---------
function updateCalendar() {
  generateCalendar(currentWeekStart);
  // populate the agenda with the week's events by default
  listarEventosSemana(currentWeekStart);

  // auto-select today if it's within the displayed week
  const start = new Date(currentWeekStart);
  const end = endOfWeekFromDate(start);
  if (today >= start && today <= end) {
    selecionarDia(today);
  } else {
    // otherwise select the first day of the week
    selecionarDia(start);
  }
}

function prevWeek() {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  updateCalendar();
}

function nextWeek() {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  updateCalendar();
}

function generateCalendar(startOfWeek) {
  const table = document.getElementById("calendar");

  // Clear old rows
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  // Create single row with 7 days
  const row = table.insertRow();

  for (let i = 0; i < 7; i++) {
    const cell = row.insertCell();
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    day.setHours(0,0,0,0);

    // content + id
    cell.textContent = day.getDate();
    cell.id = ymdId(day);

    // highlight today
    if (day.toDateString() === today.toDateString()) {
      cell.classList.add("selectedDay");
    }

    // make clickable
    cell.style.cursor = "pointer";
    cell.addEventListener("click", () => {
      selecionarDia(day);
    });
  }

  // Update header (week range)
  const end = endOfWeekFromDate(startOfWeek);
  document.getElementById("monthYear").textContent = formatWeekLabel(startOfWeek, end);
}

// --------- Selection ---------
function selecionarDia(dateObj) {
  // remove previous selection
  document.querySelectorAll("#calendar td").forEach(td => td.classList.remove("selectedDay"));

  // mark new selection
  const cell = document.getElementById(ymdId(dateObj));
  if (cell) cell.classList.add("selectedDay");

  selectedDate = new Date(dateObj);

  // fetch events and tasks for this day
  listarEventosDia(selectedDate);
  listarTarefasDia(selectedDate);
}

// --------- Agenda & Tasks rendering ---------
function clearAgenda() {
  const agenda = document.getElementById("agenda");
  agenda.innerHTML = "";
}

function appendAgendaItem(text) {
  const agenda = document.getElementById("agenda");
  const li = document.createElement("li");
  li.textContent = text;
  agenda.appendChild(li);
}

function clearTaskList() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
}

function appendTaskItem(text) {
  const taskList = document.getElementById("taskList");
  const li = document.createElement("li");
  li.textContent = text;
  taskList.appendChild(li);
}

// --------- Google APIs: Init & Login ---------
function startGoogleApis() {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      apiKey: 'AIzaSyBjT_rmiPSV-2BA67gN1ISLy1W03wB3Euo',
      clientId: '768357838488-p3pba4gjh8bbr6s4gr0u3bk3ih77a79q.apps.googleusercontent.com',
      discoveryDocs: [
        "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest",
        "https://sheets.googleapis.com/$discovery/rest?version=v4"
      ],
      scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/spreadsheets.readonly"
    }).then(() => {
      console.log("Google APIs inicializadas");
    }).catch(err => {
      console.error("Erro na inicialização:", err);
    });
  });
}




// Login via button
function login() {
  const auth = gapi.auth2.getAuthInstance();
  if (!auth) {
    console.error("Auth não inicializado ainda");
    return;
  }

  auth.signIn().then(() => {
    console.log("Login feito!");
    updateCalendar();
    listarTarefas();
    listarPlanilha();

    document.getElementById("loginGoogle").style.display = "none";
    document.getElementById("userIcon").style.display = "inline-block";
  }).catch(err => console.error("Erro ao logar:", err));
}


// --------- Google Calendar ---------
function listarEventosSemana(startOfWeek) {
  const firstDay = new Date(startOfWeek);
  firstDay.setHours(0,0,0,0);
  const lastDay = endOfWeekFromDate(firstDay);

  gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: firstDay.toISOString(),
    timeMax: lastDay.toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: 'startTime'
  }).then(response => {
    const events = response.result.items || [];

    // clear agenda
    clearAgenda();

    // clear events rendered inside cells
    const cells = document.querySelectorAll("#calendar td");
    cells.forEach(cell => {
      cell.querySelectorAll(".event").forEach(e => e.remove());
    });

    // render
    events.forEach(event => {
      const when = event.start.dateTime || event.start.date;
      const date = new Date(when);

      // list item (agenda)
      appendAgendaItem(`${date.toLocaleDateString()} - ${event.summary}`);

      // calendar cell chip
      const cell = document.getElementById(ymdId(date));
      if (cell) {
        const div = document.createElement("div");
        div.classList.add("event");
        div.textContent = event.summary;
        cell.appendChild(div);
      }
    });
  }).catch(err => {
    console.error("Erro ao listar eventos da semana:", err);
  });
}

function listarEventosDia(dateObj) {
  const start = new Date(dateObj);
  start.setHours(0,0,0,0);
  const end = new Date(dateObj);
  end.setHours(23,59,59,999);

  gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: 'startTime'
  }).then(response => {
    const events = response.result.items || [];
    clearAgenda();
    events.forEach(event => {
      const startStr = event.start.dateTime || event.start.date;
      appendAgendaItem(`${event.summary} (${startStr})`);
    });
  }).catch(err => {
    console.error("Erro ao listar eventos do dia:", err);
  });
}

// --------- Google Tasks ---------
function listarTarefas() {
  gapi.client.tasks.tasks.list({
    tasklist: '@default'
  }).then(response => {
    const tasks = response.result.items || [];
    clearTaskList();
    tasks.forEach(task => {
      appendTaskItem(task.title);
    });
  }).catch(err => {
    console.error("Erro ao listar tarefas:", err);
  });
}

function listarTarefasDia(dateObj) {
  gapi.client.tasks.tasks.list({
    tasklist: '@default'
  }).then(response => {
    const tasks = response.result.items || [];
    clearTaskList();

    const target = new Date(dateObj);
    target.setHours(0,0,0,0);

    tasks.forEach(task => {
      if (task.due) {
        const due = new Date(task.due);
        due.setHours(0,0,0,0);
        if (due.getTime() === target.getTime()) {
          appendTaskItem(task.title);
        }
      }
    });
  }).catch(err => {
    console.error("Erro ao listar tarefas do dia:", err);
  });
}

// --------- Google Sheets ---------
function listarPlanilha() {
  const spreadsheetId = "SUA_PLANILHA_ID"; // TODO: configure
  const range = "Página1!A1:C10";          // TODO: adjust

  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  }).then(response => {
    const values = response.result.values || [];
    // Example: log values; you can render them wherever you want
    console.log("Sheet values:", values);
  }).catch(err => {
    console.error("Erro ao listar dados da planilha:", err);
  });
}

// --------- Simple local tasks (optional) ---------
document.getElementById("addTask")?.addEventListener("click", () => {
  const task = prompt("Digite sua tarefa:");
  if (task) appendTaskItem(task);
});

// --------- Expose controls globally (if using inline HTML handlers) ---------
window.prevWeek = prevWeek;
window.nextWeek = nextWeek;
window.login = login;
