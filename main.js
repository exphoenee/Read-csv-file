class dataTable {
  constructor(parameters) {
    this.datafile = parameters.datafile;
    this.container = document.querySelector("." + parameters.containerID);
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
        that.creatTable(CSVdata);
      },
      this.datafile,
      "GET",
      false
    );
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

  creatTable(rawData) {
    let allLines = rawData.split(/\r\n|\n/);
    let header = allLines.shift().split(";");

    this.table.header = header;
    this.table.rowNumber = allLines.length;

    for (let line of allLines) {
      this.table.rows.push(line.split(";"));
    }

    visualizeData(this.table.header, this.table.rows);

    function replaceAll(string, search, replace) {
      return string.split(search).join(replace);
    }

    function visualizeData(header, rows) {
      let table = createTable();
      createHeader(table, header);
      createRows(table, rows, header);
    }

    function noSpecChars(text, lowercase = true) {
      const charLookup = {
        é: "e",
        á: "a",
        ó: "o",
        ö: "o",
        ő: "o",
        ú: "u",
        ü: "u",
        ű: "u",
        í: "i",
        " ": "_",
        É: "E",
        Á: "A",
        Ó: "O",
        Ö: "O",
        Ő: "O",
        Ú: "U",
        Ü: "U",
        Ű: "U",
        Í: "I",
      };
      for (let char in charLookup) {
        text = replaceAll(text, char, charLookup[char]);
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
      for (let [i, col] of header.entries()) {
        let headerRow = document.createElement("th");
        let colName = noSpecChars(col);
        headerRow.classList.add(colName);
        headerRow.innerHTML = col;
        tblHead.appendChild(headerRow);
      }
    }

    function createRows(table, rows, header) {
      for (let [i, row] of rows.entries()) {
        let tblRow = document.createElement("tr");
        //console.log(row + ": " + i);
        tblRow.classList.add("row-" + i);
        table.appendChild(tblRow);
        for (let [j, col] of row.entries()) {
          let tblCol = document.createElement("td");
          let colName = noSpecChars(header[j]);
          tblCol.classList.add(colName);
          tblCol.innerHTML = col;
          tblRow.appendChild(tblCol);
        }
      }
    }
  }
}

let booking = new dataTable({
  containerID: "table-conteiner",
  datafile: "booking.csv",
});
booking.init();
//console.log(booking);
