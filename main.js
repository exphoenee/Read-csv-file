class dataTable {
  constructor(parameters) {
    this.datafile = parameters.datafile;
    this.rawData = "";
    this.dataCSV = "text/plain";
    this.dataJSON = "application/json";
    this.table = {
      header: [],
      rowNumber: null,
      rows: [],
    };
  }

  init() {
    let that = this;
    this.sendRequest(
      function (CSVdata) {
        //console.log(CSVdata);
        that.rawData = CSVdata;
      },
      this.datafile,
      "GET",
      false
    );
    this.processData(this.rawData);
  }

  sendRequest(
    callback,
    url,
    method = "GET",
    async = true,
    body = null,
    header = "text/plain"
  ) {
    let xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        callback(xhr.responseText);
      }
    };
    xhr.open(method, url, async);
    xhr.setRequestHeader("Content-Type", header);
    xhr.send(body);
  }

  processData() {
    let allLines = this.rawData.split(/\r\n|\n/);
    let header = allLines.shift().split(";");

    this.table.header = header;
    this.table.rowNumber = allLines.length;

    for (let line of allLines) {
      this.table.rows.push(line.split(";"));
    }

    this.visualizeData(this.table.header, this.table.rows);
  }

  replaceAll(string, search, replace) {
    return string.split(search).join(replace);
  }

  visualizeData(header, rows) {
    let table = this.createTable();
    this.createHeader(table, header);
    this.createRows(table, rows, header);
  }

  noSpecChars(text, lowercase = true) {
    const specChars = [
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
      "E",
      "A",
      "U",
      "O",
      "U",
      "U",
      "O",
      "O",
      "I",
    ];
    for (let [i, char] of specChars.entries()) {
      text = this.replaceAll(text, char, equalChars[i]);
    }
    return lowercase ? text.toLowerCase() : text;
  }

  createTable() {
    const table = document.createElement("table");
    table.classList.add("dataTable");
    document.body.appendChild(table);
    return table;
  }

  createHeader(table, header) {
    const tblHead = document.createElement("tr");
    tblHead.classList.add("header");
    table.appendChild(tblHead);
    for (let [i, col] of header.entries()) {
      let headerRow = document.createElement("th");
      let colName = this.noSpecChars(col);
      headerRow.classList.add(colName);
      headerRow.innerHTML = col;
      tblHead.appendChild(headerRow);
    }
  }

  createRows(table, rows, header) {
    for (let [i, row] of rows.entries()) {
      let tblRow = document.createElement("tr");
      //console.log(row + ": " + i);
      tblRow.classList.add("row-" + i);
      table.appendChild(tblRow);
      for (let [j, col] of row.entries()) {
        let tblCol = document.createElement("td");
        let colName = this.noSpecChars(header[j]);
        tblCol.classList.add(colName);
        tblCol.innerHTML = col;
        tblRow.appendChild(tblCol);
      }
    }
  }
}

let booking = new dataTable({ datafile: "booking.csv" });
booking.init();
//console.log(booking);
