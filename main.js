class dataTable {
  constructor(parameters) {
    this.datafile = parameters.datafile;
    this.container = document.querySelector("." + parameters.containerID);
    this.table = {
      header: [],
      rowNumber: null,
      rows: [],
      columnsToSummarize: ["munkaertek", "mennyiseg"],
      currencyNames: ["Ft", " EUR", "USD", "HUF", "CHF"],
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
    let that = this;
    let allLines = rawData.split(/\r\n|\n/);

    this.table.header = allLines.shift().split(";");
    this.table.rowNumber = allLines.length;

    for (let line of allLines) {
      this.table.rows.push(line.split(";"));
    }

    renderTable(this.table.header, this.table.rows);

    function renderTable(header, rows) {
      let headerClass = [];
      let summarizeCol = [];
      let summary = [0];
      let table = `
        <table class="dataDatble">
          <thead>
            <tr class="headerRow">`;

      for (let [i, col] of header.entries()) {
        let colName = noSpecChars(col + "-" + i);

        let summarize = false;
        for (let columnToSummarize of that.table.columnsToSummarize) {
          if (colName.includes(columnToSummarize)) {
            summarize = true;
            break;
          }
        }
        summary[i] = 0;
        summarizeCol.push(summarize);

        table += `
              <th class="${colName}${summarize ? " summarize" : ""}">${col}`;

        headerClass.push(colName);
      }

      table += `
            </tr>
          </thead>
          <tbody>`;

      for (let [i, row] of rows.entries()) {
        let tableRows = "";

        tableRows += `
            <tr class="${"row-" + i}">`;

        let emptyCell = 0;

        for (let [j, col] of row.entries()) {
          col.length == 0 ? emptyCell++ : emptyCell;

          let cellData = checkCellValue(col);
          console.log(col, cellData);

          summarizeCol[j] ? (summary[j] += cellData.cellValue) : null;

          tableRows += `
            <td class="${headerClass[j]} ${cellData.type}">${cellData.col}</td>`;
        }

        tableRows += `
            </tr>`;

        if (emptyCell !== header.length) {
          table += tableRows;
        }
      }

      table += `
          </tbody>
          <tfoot>
            <tr class="headerFoot">`;
      for (let [j, col] of header.entries()) {
        table += `
            <td class="${headerClass[j]}">${col}: ${summary[j]}</td>`;
      }
      table += `
            </tr>
          </tfoot>
        </table>`;
      that.container.innerHTML = table;
    }

    function checkCellValue(col) {
      let value;

      value = checkCurrency(col);
      if (value) {
        console.log(col, value);
        return value;
      }

      value = checkNumber(col);
      if (value) {
        console.log(col, value);
        return value;
      }

      return { type: "unknown", col: col, cellValue: cellValue };
    }

    function checkNumber(col) {
      let cellData;
      if (col.includes(",") || col.includes(".")) {
        cellData = replaceAll(col, " ", "");
        cellData = Number(col.replace(",", "."));
        if (typeof cellData === "number" && !isNaN(cellData)) {
          col = `
            <span
              class="value${typeof cellData !== "number" ? "-error" : ""}"
              data-value="${cellData}"
              data-type="${typeof cellData}"
            >${cellData}</span>`;
        }
      }
      return { type: "number", col: col, cellData: cellData };
    }

    function checkCurrency(col) {
      for (let currencyName of that.table.currencyNames) {
        let cellData;
        if (col.includes(currencyName)) {
          col = col.replace(currencyName, "");
          col = replaceAll(col, " ", "");
          cellData = Number(col);
          col = `
            <span
              class="value${typeof cellData !== "number" ? "-error" : ""}"
              data-currency="${currencyName}"
              data-value="${cellData}"
              data-type="${typeof cellData}"
            >${cellData}</span>
            <span class="currency">${currencyName}</span>`;
          if (typeof cellData !== "number") {
            cellData = 0;
          }
          return { type: "currency", col: col, cellData: cellData };
        }
      }
      return null;
    }

    function replaceAll(string, search, replace) {
      return string.split(search).join(replace);
    }

    function noSpecChars(text, lowercase = true) {
      for (let char in that.table.specialChars) {
        text = replaceAll(text, char, that.table.specialChars[char]);
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
