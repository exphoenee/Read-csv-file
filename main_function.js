function readTextFile(file, whatToDo) {
  fetch(file).then(function (response) {
    response.text().then(function (text) {
      whatToDo(text);
    });
  });
}

function sendRequest(
  callback,
  url,
  method = "GET",
  async = true,
  body = null,
  header = null
) {
  let xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      let data = xhr.responseText;
      callback(data);
    }
  };

  xhr.open(method, url, async);
  xhr.send(body);
}

//readTextFile("booking.csv", processData);

sendRequest(processData, "booking.csv");

function processData(allText) {
  let allLines = allText.split(/\r\n|\n/);
  let header = allLines.shift().split(";");

  let linesNr = allLines.length;

  let rows = [];

  for (let line of allLines) {
    rows.push(line.split(";"));
  }
  visualizeData(header, rows);
}

function replaceAll(string, search, replace) {
  return string.split(search).join(replace);
}

function visualizeData(header, rows) {
  let table = createTable();
  createHeader(table, header);
  createRows(table, rows, header);
}

function noSpecChars(text, lowercase = true) {
  const SpecChars = [
    "é",
    "á",
    "ű",
    "ő",
    "ú",
    "ü",
    "ó",
    "ö",
    "í",
    " ",
    "  ",
    "É",
    "Á",
    "Ű",
    "Ö",
    "Ú",
    "Ü",
    "Ó",
    "Ö",
    "Í",
  ];
  const equalChars = [
    "e",
    "a",
    "u",
    "o",
    "u",
    "u",
    "o",
    "o",
    "i",
    "_",
    " ",
    "E",
    "A",
    "U",
    "O",
    "U",
    "U",
    "O",
    "O",
    "I",
    "_",
    " ",
  ];
  for (let i = 0; i < SpecChars.length; i++) {
    text = replaceAll(text, SpecChars[i], equalChars[i]);
  }
  return lowercase ? text.toLowerCase() : text;
}

function createTable() {
  const table = document.createElement("table");
  table.classList.add("dataTable");
  document.body.appendChild(table);
  return table;
}

function createHeader(table, header) {
  const tblHead = document.createElement("tr");
  tblHead.classList.add("header");
  table.appendChild(tblHead);
  i = 0;
  for (let col of header) {
    let headerRow = document.createElement("th");
    let colName = noSpecChars(col);
    headerRow.classList.add(colName);
    headerRow.innerHTML = col;
    tblHead.appendChild(headerRow);
    i++;
  }
}

function createRows(table, rows, header) {
  let i = 0;
  for (let row of rows) {
    let tblRow = document.createElement("tr");
    tblRow.classList.add("row-" + i);
    table.appendChild(tblRow);
    i++;
    j = 0;
    for (let col of row) {
      let tblCol = document.createElement("td");
      let colName = noSpecChars(header[j]);
      tblCol.classList.add(colName);
      tblCol.innerHTML = col;
      tblRow.appendChild(tblCol);
      j++;
    }
  }
}
