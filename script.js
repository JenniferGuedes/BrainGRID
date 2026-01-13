// start when page load
window.onload = () => { 
  updateCalendar(); 
  start(); 
};


//Calendar

const today = new Date();
let currentWeekStart = new Date(today);
currentWeekStart.setDate(today.getDate() - today.getDay()); 

function updateCalendar() {
  generateCalendar(currentWeekStart);
  listarEventos(currentWeekStart);
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

  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  let row = table.insertRow();

  for (let i = 0; i < 7; i++) {
    const cell = row.insertCell();
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);

    cell.textContent = day.getDate();
    cell.id = `day-${day.getDate()}-${day.getMonth()}`;

    // highlight the actual day
    if (day.toDateString() === today.toDateString()) {
      cell.classList.add("selectedDay");
    }
  }

  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                      "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  document.getElementById("monthYear").textContent =
    `${startOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`;
}

// simple task example
document.getElementById("addTask").addEventListener("click", () => {
  const task = prompt("Digite sua tarefa:");
  if (task) {
    const li = document.createElement("li");
    li.textContent = task;
    document.getElementById("taskList").appendChild(li);
  }
});

// start calendar
window.onload = () => { updateCalendar(); };


function listarEventos(startOfWeek) {
  const firstDay = new Date(startOfWeek);
  const lastDay = new Date(startOfWeek);
  lastDay.setDate(startOfWeek.getDate() + 6);

  gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: firstDay.toISOString(),
    timeMax: lastDay.toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: 'startTime'
  }).then(response => {
    const events = response.result.items;

    const agenda = document.getElementById("agenda");
    agenda.innerHTML = "";

    const cells = document.querySelectorAll("#calendar td");
    cells.forEach(cell => {
      cell.querySelectorAll(".event").forEach(e => e.remove());
    });

    events.forEach(event => {
      const when = event.start.dateTime || event.start.date;
      const date = new Date(when);

      const li = document.createElement("li");
      li.textContent = `${date.toLocaleDateString()} - ${event.summary}`;
      agenda.appendChild(li);

      const cell = document.getElementById(`day-${date.getDate()}-${date.getMonth()}`);
      if (cell) {
        const div = document.createElement("div");
        div.classList.add("event");
        div.textContent = event.summary;
        cell.appendChild(div);
      }
    });
  });
}


//Google APIs

function start() { 
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
      return gapi.auth2.getAuthInstance().signIn();
     }).then(() => { 
      updateCalendar(); 
      listarTarefas(); 
      listarPlanilha(); 
      document.getElementById("loginGoogle").style.display = "none"; document.getElementById("userIcon").style.display = "inline-block"; 
    }).catch(err => { console.error("Erro na inicialização/login:", err);

     }); 
    }); 
  }



//Login 
function login() {
  gapi.auth2.getAuthInstance().signIn().then(() => {
    // pós-login
    updateCalendar();
    listarTarefas();
    listarPlanilha();

    // troca botão pelo ícone
    document.getElementById("loginGoogle").style.display = "none";
    document.getElementById("userIcon").style.display = "inline-block";
  }).catch(err => {
    console.error("Erro ao logar:", err);
  });
}

