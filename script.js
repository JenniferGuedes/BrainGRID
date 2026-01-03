//Calendar

const today = new Date(); 
let currentMonth = today.getMonth(); 
let currentYear = today.getFullYear();

function updateCalendar(month, year) {
  generateCalendar(month, year);
  listarEventos(month, year);
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  updateCalendar(currentMonth, currentYear);
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  updateCalendar(currentMonth, currentYear);
}


function generateCalendar(month, year) {
  const table = document.getElementById("calendar");

  // Remove old rows
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let dayOfWeek = firstDay.getDay();

  let row = table.insertRow();

  for (let i = 0; i < dayOfWeek; i++) {
    row.insertCell();
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    if (dayOfWeek === 7) {
      row = table.insertRow();
      dayOfWeek = 0;
    }
    const cell = row.insertCell();
    cell.textContent = day;
    cell.id = `day-${day}`;
    dayOfWeek++;
  }

  // Atualiza o título do mês/ano
  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                      "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  document.getElementById("monthYear").textContent = `${monthNames[month]} ${year}`;
}



//Google APIs

function listarEventos(month, year) {
  const firstDay = new Date(year, month, 1).toISOString();
  const lastDay = new Date(year, month + 1, 0).toISOString();

  gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: firstDay,
    timeMax: lastDay,
    showDeleted: false,
    singleEvents: true,
    orderBy: 'startTime'
  }).then(response => {
    const events = response.result.items;

    // Limpa lista lateral
    const agenda = document.getElementById("agenda");
    agenda.innerHTML = "";

    // Limpa eventos antigos do calendário
    const cells = document.querySelectorAll("#calendar td");
    cells.forEach(cell => {
      cell.querySelectorAll(".event").forEach(e => e.remove());
    });

    events.forEach(event => {
      const when = event.start.dateTime || event.start.date;
      const date = new Date(when);

      // Adiciona na lista lateral
      const li = document.createElement("li");
      li.textContent = `${date.toLocaleDateString()} - ${event.summary}`;
      agenda.appendChild(li);

      // Adiciona no calendário
      const day = date.getDate();
      const cell = document.getElementById(`day-${day}`);
      if (cell) {
        const div = document.createElement("div");
        div.classList.add("event");
        div.textContent = event.summary;
        cell.appendChild(div);
      }
    });
  });
}

//Login 

function start() { 
  gapi.load('client:auth2', () => { 
    gapi.client.init({ 
      apiKey: 'AIzaSyBjT_rmiPSV-2BA67gN1ISLy1W03wB3Euo',
      clientId: '768357838488-p3pba4gjh8bbr6s4gr0u3bk3ih77a79q.apps.googleusercontent.com',
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"], 
      scope: "https://www.googleapis.com/auth/calendar.readonly"
    }).then(() => { 
      gapi.auth2.getAuthInstance().signIn().then(() => {
        listarEventos(currentMonth, currentYear);
      });
    });
  });
}

// start when page load
window.onload = () => { updateCalendar(currentMonth, currentYear); start(); };