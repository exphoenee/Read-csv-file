class dataTable {
  constructor(parameters) {
    this.datafile = parameters.datafile;
    this.container = document.querySelector("." + parameters.containerID);
    this.settings = {
      columnsToSummarize: ["munkaertek", "mennyiseg"],
      currencyNames: ["Ft", "EUR", "USD", "HUF", "CHF"],
      specialChars: {
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
      },
    };
    this.table = {
      header: {},
      body: [{}],
      footer: {},
      rowNumber: null,
      rows: {},
    };
  }

  init() {
    let that = this;
    this.sendRequest(
      function (CSVdata) {
        //that.creatTable(CSVdata);
        that.generateTableObject(CSVdata);
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

  generateTableObject(rawData) {
    let that = this;
    let allLines = rawData.split(/\r\n|\n/);

    let header = allLines.shift().split(";");
    let rowNumber = allLines.length;
    let rows = [];

    for (let line of allLines) {
      rows.push(line.split(";"));
    }

    renderTable(header, rows);

    function renderTable(header, rows) {
      let columnNames = [];
      let summary = [];
      let table = `
        <table class="dataDatble">
          <thead>
            <tr class="headerRow">`;

      /* Generate header */
      for (let [i, col] of header.entries()) {
        let columnName = noSpecChars(col + "-" + i);

        for (let columnToSummarize of that.settings.columnsToSummarize) {
          that.table.header[columnName] = {
            order: i,
            name: col,
          };
          that.table.footer[columnName] = {
            order: i,
            name: col,
            summarize: columnName.includes(columnToSummarize),
            summary: 0,
          };
          break;
        }

        table += `
        <th class="${columnName}${
          that.table.headersummarize ? " summarize" : ""
        }">${col}`;

        columnNames.push(columnName);
      }

      table += `
          </tr>
          </thead>`;

      /* Generate body */
      table += `
          <tbody>`;

      let dataRows = [];
      for (let [i, row] of rows.entries()) {
        let recordDate = null;
        let tableRows = "";
        let emptyCell = 0;
        let record = {};
        let tableCell = "";
        for (let [j, col] of row.entries()) {
          col.length == 0 ? emptyCell++ : emptyCell;

          let cellData = checkCellValue(col);

          cellData.type === "date" ? (recordDate = cellData.cellValue) : null;

          tableCell += `
            <td class="${columnNames[j]} ${cellData.type}">${cellData.col}</td>`;

          record[columnNames[j]] = {
            order: j,
            value: cellData.cellValue,
            type: cellData.type,
          };
        }
        dataRows.push(record);

        tableRows += `
            <tr class="${"row-" + i}" data-record-date="${recordDate}">`;

        tableRows += tableCell;

        tableRows += `
            </tr>`;

        if (emptyCell !== header.length) {
          table += tableRows;
        }

        /********************** */
        /********************** */
        /********************** */
        /********************** */
        /********************** */
        /********************** */
        /********************** */
      }
      that.table.body = dataRows;
      //that.table.footer = footerSummary;

      table += `
          </tbody>`;

      /* Generate footer */
      table += `
          <tfoot>
            <tr class="headerFoot">`;
      for (let [j, col] of header.entries()) {
        table += `
            <td class="${columnNames[j]}">${col}: ${summary[j]}</td>`;
      }
      table += `
            </tr>
          </tfoot>
        </table>`;
      that.container.innerHTML = table;
    }

    function checkCellValue(col) {
      let value;

      value = checkDate(col);
      if (value) {
        return value;
      }

      value = checkTime(col);
      if (value) {
        return value;
      }

      value = checkNumber(col);
      if (value) {
        return value;
      }

      value = checkCurrency(col);
      if (value) {
        return value;
      }

      return { type: "string", col: col, cellValue: null };
    }

    function checkTime(col) {
      let cellValue;
      if (col.includes(":")) {
        cellValue = replaceAll(col, " ", "");
        col = `
            <span
              class="timeStamp"
              data-value="${cellValue}"
              data-type="timeStamp"
            >${cellValue}</span>`;
        return { type: "timeStamp", col: col, cellValue: cellValue };
      }
      return null;
    }

    function checkDate(col) {
      let cellValue;
      let dateLenghtsCheck = [4, 2, 2];
      if (col.includes(".")) {
        cellValue = replaceAll(col, " ", "");
        let checkCellValues = cellValue.split(".");
        if (checkCellValues.length === 3) {
          let checker = 0;
          for (let [i, value] of checkCellValues.entries()) {
            value.length === dateLenghtsCheck[i] ? checker++ : null;
          }
          if ((checker = 3)) {
            let date = checkCellValues.join("-");
            let dateUTC = new Date(date);
            col = `
            <span
            class="recordDate"
            data-year="${checkCellValues[0]}"
            data-month="${checkCellValues[1]}"
            data-day="${checkCellValues[2]}"
            data-type="recordDate"
            data-dateUTC="${dateUTC}"
            >${date}</span>`;
            return { type: "date", col: col, cellValue: date };
          }
        }
      }
      return null;
    }

    function checkNumber(col) {
      let cellValue;
      if (col.includes(",") || col.includes(".")) {
        cellValue = replaceAll(col, " ", "");
        cellValue = Number(col.replace(",", "."));
        if (typeof cellValue === "number" && !isNaN(cellValue)) {
          col = `
            <span
              class="value${typeof cellValue !== "number" ? "-error" : ""}"
              data-value="${cellValue}"
              data-type="${typeof cellValue}"
            >${cellValue}</span>`;
        }
        return { type: "number", col: col, cellValue: cellValue };
      }
      return null;
    }

    function checkCurrency(col) {
      for (let currencyName of that.settings.currencyNames) {
        let cellValue;
        if (col.includes(currencyName)) {
          col = col.replace(currencyName, "");
          col = replaceAll(col, " ", "");
          cellValue = Number(col);
          col = `
            <span
              class="value${typeof cellValue !== "number" ? "-error" : ""}"
              data-currency="${currencyName}"
              data-value="${cellValue}"
              data-type="${typeof cellValue}"
            >${cellValue}</span>
            <span class="currency">${currencyName}</span>`;
          if (typeof cellValue !== "number") {
            cellValue = 0;
          }
          return { type: "currency", col: col, cellValue: cellValue };
        }
      }
      return null;
    }

    function replaceAll(string, search, replace) {
      return string.split(search).join(replace);
    }

    function noSpecChars(text, lowercase = true) {
      for (let char in that.settings.specialChars) {
        text = replaceAll(text, char, that.settings.specialChars[char]);
      }
      return lowercase ? text.toLowerCase() : text;
    }

    console.log(this.table);
  }

  creatTable(rawData) {
    let that = this;
    let allLines = rawData.split(/\r\n|\n/);

    this.table.header = allLines.shift().split(";");
    this.table.rowNumber = allLines.length;

    for (let line of allLines) {
      this.table.rows.push(line.split(";"));
    }

    renderTable(this.table.header, this.table.rows);

    function renderTable(header, rows) {
      let columnNames = [];
      let summarizeCol = [];
      let summary = [0];
      let table = `
        <table class="dataDatble">
          <thead>
            <tr class="headerRow">`;

      /* Generate header */
      for (let [i, col] of header.entries()) {
        let columnName = noSpecChars(col + "-" + i);

        let summarize = false;
        for (let columnToSummarize of that.settings.columnsToSummarize) {
          if (columnName.includes(columnToSummarize)) {
            summarize = true;
            break;
          }
        }
        summary[i] = 0;
        summarizeCol.push(summarize);

        table += `
        <th class="${columnName}${summarize ? " summarize" : ""}">${col}`;

        columnNames.push(columnName);
      }

      table += `
          </tr>
          </thead>`;

      /* Generate body */
      table += `
          <tbody>`;
      for (let [i, row] of rows.entries()) {
        let recordDate = null;
        let tableRows = "";
        let emptyCell = 0;

        let tableCell = "";
        for (let [j, col] of row.entries()) {
          col.length == 0 ? emptyCell++ : emptyCell;

          let cellData = checkCellValue(col);

          summarizeCol[j] ? (summary[j] += cellData.cellValue) : null;

          cellData.type === "date" ? (recordDate = cellData.cellValue) : null;

          tableCell += `
            <td class="${columnNames[j]} ${cellData.type}">${cellData.col}</td>`;
        }

        tableRows += `
            <tr class="${"row-" + i}" data-record-date="${recordDate}">`;

        tableRows += tableCell;

        tableRows += `
            </tr>`;

        if (emptyCell !== header.length) {
          table += tableRows;
        }
      }
      table += `
          </tbody>`;

      /* Generate footer */
      table += `
          <tfoot>
            <tr class="headerFoot">`;
      for (let [j, col] of header.entries()) {
        table += `
            <td class="${columnNames[j]}">${col}: ${summary[j]}</td>`;
      }
      table += `
            </tr>
          </tfoot>
        </table>`;
      that.container.innerHTML = table;
    }

    function checkCellValue(col) {
      let value;

      value = checkDate(col);
      if (value) {
        return value;
      }

      value = checkTime(col);
      if (value) {
        return value;
      }

      value = checkNumber(col);
      if (value) {
        return value;
      }

      value = checkCurrency(col);
      if (value) {
        return value;
      }

      return { type: "string", col: col, cellValue: null };
    }

    function checkTime(col) {
      let cellValue;
      if (col.includes(":")) {
        cellValue = replaceAll(col, " ", "");
        col = `
            <span
              class="timeStamp"
              data-value="${cellValue}"
              data-type="timeStamp"
            >${cellValue}</span>`;
        return { type: "timeStamp", col: col, cellValue: cellValue };
      }
      return null;
    }

    function checkDate(col) {
      let cellValue;
      let dateLenghtsCheck = [4, 2, 2];
      if (col.includes(".")) {
        cellValue = replaceAll(col, " ", "");
        let checkCellValues = cellValue.split(".");
        if (checkCellValues.length === 3) {
          let checker = 0;
          for (let [i, value] of checkCellValues.entries()) {
            value.length === dateLenghtsCheck[i] ? checker++ : null;
          }
          if ((checker = 3)) {
            let date = checkCellValues.join("-");
            let dateUTC = new Date(date);
            col = `
            <span
            class="recordDate"
            data-year="${checkCellValues[0]}"
            data-month="${checkCellValues[1]}"
            data-day="${checkCellValues[2]}"
            data-type="recordDate"
            data-dateUTC="${dateUTC}"
            >${date}</span>`;
            return { type: "date", col: col, cellValue: date };
          }
        }
      }
      return null;
    }

    function checkNumber(col) {
      let cellValue;
      if (col.includes(",") || col.includes(".")) {
        cellValue = replaceAll(col, " ", "");
        cellValue = Number(col.replace(",", "."));
        if (typeof cellValue === "number" && !isNaN(cellValue)) {
          col = `
            <span
              class="value${typeof cellValue !== "number" ? "-error" : ""}"
              data-value="${cellValue}"
              data-type="${typeof cellValue}"
            >${cellValue}</span>`;
        }
        return { type: "number", col: col, cellValue: cellValue };
      }
      return null;
    }

    function checkCurrency(col) {
      for (let currencyName of that.settings.currencyNames) {
        let cellValue;
        if (col.includes(currencyName)) {
          col = col.replace(currencyName, "");
          col = replaceAll(col, " ", "");
          cellValue = Number(col);
          col = `
            <span
              class="value${typeof cellValue !== "number" ? "-error" : ""}"
              data-currency="${currencyName}"
              data-value="${cellValue}"
              data-type="${typeof cellValue}"
            >${cellValue}</span>
            <span class="currency">${currencyName}</span>`;
          if (typeof cellValue !== "number") {
            cellValue = 0;
          }
          return { type: "currency", col: col, cellValue: cellValue };
        }
      }
      return null;
    }

    function replaceAll(string, search, replace) {
      return string.split(search).join(replace);
    }

    function noSpecChars(text, lowercase = true) {
      for (let char in that.settings.specialChars) {
        text = replaceAll(text, char, that.settings.specialChars[char]);
      }
      return lowercase ? text.toLowerCase() : text;
    }
  }
}

let booking = new dataTable({
  containerID: "table-conteiner",
  datafile: "booking.csv",
});
booking.init();
