//Google APIs

function start() {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      apiKey: 'SUA_API_KEY',
      clientId: 'SEU_CLIENT_ID.apps.googleusercontent.com',
      discoveryDocs: [
        "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest",
        "https://sheets.googleapis.com/$discovery/rest?version=v4"
      ],
      scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/spreadsheets.readonly"
    }).then(() => {
      gapi.auth2.getAuthInstance().signIn().then(listarEventos);
    });
  });
}

function listarEventos() {
  gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin': (new Date()).toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'orderBy': 'startTime'
  }).then(response => {
    const events = response.result.items;
    const agenda = document.getElementById("agenda");
    agenda.innerHTML = "";
    events.forEach(event => {
      const li = document.createElement("li");
      li.textContent = `${event.start.dateTime} - ${event.summary}`;
      agenda.appendChild(li);
    });
  });
}

// start when page load
window.onload = start;

