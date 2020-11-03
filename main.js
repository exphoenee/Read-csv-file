class dataTable {
  constructor(parameters) {
    this.datafile = parameters.datafile;
    this.container = document.querySelector("." + parameters.containerID);
    this.tableController = document.createElement("div");
    this.table = document.createElement("table");
    this.settings = {
      columnsToSummarize: ["munkaertek", "mennyiseg"],
      rowNumberOptions: [10, 25, 50, 100, 200, 500],
      page: 0,
      maxPage: 1,
      showRowNumber: 10,
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
    this.tableData = {
      header: {},
      body: [{}],
      footer: {},
      rowNumber: null,
      rowNumber: null,
    };
  }

  init() {
    let that = this;
    this.sendRequest(
      function (CSVdata) {
        that.generateTableObject(CSVdata);
      },
      this.datafile,
      "GET",
      false
    );
    this.renderTable();
    this.generateController();
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

  generateController() {
    this.tableController.classList.add("tableController");
    this.container.appendChild(this.tableController);
    this.container.insertBefore(this.tableController, this.table);

    let selectContainer = document.createElement("div");
    let controllLabel = document.createElement("label");
    let rowNumberSelect = document.createElement("select");
    let prevButton = document.createElement("button");
    let nextButton = document.createElement("button");

    this.tableController.appendChild(selectContainer);
    selectContainer.appendChild(controllLabel);
    selectContainer.appendChild(rowNumberSelect);
    selectContainer.appendChild(prevButton);
    selectContainer.appendChild(nextButton);

    controllLabel.setAttribute("for", "rowNumberSelect");
    controllLabel.innerHTML = "Sorok száma: ";
    rowNumberSelect.id = "rowNumberSelect";
    prevButton.innerHTML = "Előző";
    prevButton.id = "lastPage";
    nextButton.innerHTML = "Következő";
    nextButton.id = "nextPage";

    for (let rowNumberOption of this.settings.rowNumberOptions) {
      let option = document.createElement("option");
      option.value = rowNumberOption;
      option.text = rowNumberOption + " sor";
      rowNumberSelect.appendChild(option);
    }

    let that = this;
    rowNumberSelect.addEventListener("change", function () {
      that.settings.showRowNumber = this.value;
      that.settings.maxPage = Math.ceil(
        that.tableData.recordNumber / that.settings.showRowNumber
      );
      that.renderTable();
    });
    prevButton.addEventListener("click", function () {
      that.settings.page--;
      if (that.settings.page < 0) {
        that.settings.page = 0;
      }
      that.renderTable();
    });
    nextButton.addEventListener("click", function () {
      that.settings.page++;
      if (that.settings.page > that.settings.maxPage) {
        that.settings.page = that.settings.maxPage;
      }
      that.renderTable();
    });
  }

  generateTableObject(rawData) {
    let that = this;
    let allLines = rawData.split(/\r\n|\n/);
    let dataRows = [];
    let columnNames = [];

    this.tableData.rowNumber = allLines.length;

    for (let [i, line] of allLines.entries()) {
      let record = {};
      let row = line.split(";");

      let rowNr = i;

      let emptyCell = 0;
      for (let [colNr, col] of row.entries()) {
        if (rowNr === 0) {
          let columnName = noSpecChars(col);
          columnNames.push(columnName);

          that.tableData.header[columnName] = {
            order: colNr,
            name: col,
          };
          that.tableData.footer[columnName] = {
            order: colNr,
            name: col,
            summary: false,
          };
        } else {
          col.split("").length == 0 ? emptyCell++ : null;
          let cellData = checkCellValue(col);
          record[columnNames[colNr]] = {
            order: colNr,
            row: rowNr - 1,
            cell: cellData.col,
            value: cellData.cellValue,
            type: cellData.type,
          };
          if (colNr === row.length - 1 && emptyCell < row.length) {
            dataRows.push(record);
          }
          for (let columnsToSummarize of that.settings.columnsToSummarize) {
            if (columnsToSummarize === columnNames[colNr]) {
              that.tableData.footer[columnsToSummarize].summary +=
                record[columnNames[colNr]].value;
            }
          }
          this.tableData.recordNumber = dataRows.length;
          that.settings.maxPage = Math.ceil(
            that.tableData.recordNumber / that.settings.showRowNumber
          );
        }
      }
    }
    that.tableData.body = dataRows;

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
              class="value${isNaN(cellValue) !== "number" ? "-error" : ""}"
              data-value="${cellValue}"
              data-type="${typeof cellValue}"
            >${cellValue}</span>`;
          return {
            type: "number",
            col: col,
            cellValue: cellValue,
          };
        }
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

    console.log(this.tableData);
  }

  renderTable() {
    let table = "";
    table += `<thead>`;

    let headerCells = [];
    for (let headerCell in this.tableData.header) {
      let cell = this.tableData.header[headerCell];
      let order = cell.order;
      headerCells[order] = `<th>${this.tableData.header[headerCell].name}</th>`;
    }
    table += `<tr>${headerCells.join("")}</tr>`;

    table += `</thead>`;
    table += `<tbody>`;

    let row = [];
    console.log(this.settings.page * this.settings.showRowNumber);
    console.log((this.settings.page + 1) * this.settings.showRowNumber);
    for (let [rowNr, record] of this.tableData.body.entries()) {
      let rowId;
      if (
        this.settings.page * this.settings.showRowNumber <= rowNr &&
        (this.settings.page + 1) * this.settings.showRowNumber - 1 >= rowNr
      ) {
        console.log(rowNr);
        let cells = [];
        for (let column in record) {
          let order = record[column].order;
          let value = record[column].value;
          let type = record[column].type;
          let cell = record[column].cell;

          rowId = record[column].row;
          cells[order] = `<td
            class="${column}"
            ${value !== null ? `data-value="${value}"` : ``}
            data-type="${type}">${cell}</td>`;
        }
        row[rowNr] = `<tr
          id="${rowId}"
          class="${record.datum.value}">${cells.join("")}</tr>`;
        if (
          rowNr ==
          this.settings.initialRow + this.settings.showRowNumber - 1
        ) {
          break;
        }
      }
    }
    table += row.join("");

    table += `</tbody`;

    table += `<tfooter`;
    let footerCells = [];
    for (let footerCell in this.tableData.header) {
      let cell = this.tableData.footer[footerCell];
      let order = cell.order;
      let summary = this.tableData.footer[footerCell].summary;

      footerCells[order] = `<th>${this.tableData.header[footerCell].name}${
        summary ? ` összesen: ${summary}` : ``
      }</th>`;
    }
    table += `<tr>${footerCells.join("")}</tr>`;
    table += `</tfooter`;

    this.container.appendChild(this.table);
    this.table.innerHTML = table;
  }
}

let booking = new dataTable({
  containerID: "table-container",
  datafile: "booking.csv",
});
booking.init();
