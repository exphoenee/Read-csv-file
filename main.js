class renderElement {
  constructor(prop) {
    this.element = document.createElement(prop.type) || null;
    this.targetParent = document.querySelector(prop.targetParent) || null;
    this.prop = {
      type: prop.type || null,
      targetParentNode: prop.targetParentNode || null,
      classes: prop.classes || null,
      id: prop.id || null,
      value: prop.value || null,
      eventStarter: prop.eventStarter || null,
      eventFunction: prop.eventFunction || null,
      text: prop.text || null,
      innerContent: prop.innerContent || null,
      labelFor: prop.labelFor || null,
    };
  }

  create() {
    if (this.targetParent) {
      this.targetParent.appendChild(this.element);
    } else if (this.prop.targetParentNode) {
      this.prop.targetParentNode.appendChild(this.element);
    } else {
      document.appendChild(this.element);
    }
    if (this.prop.classes) {
      this.element.classList.add(this.prop.classes);
    }
    if (this.prop.id) {
      this.element.id = this.prop.id;
    }
    if (this.prop.innerContent) {
      this.element.innerHTML = this.prop.innerContent;
    }
    if (this.prop.value) {
      this.element.value = this.prop.value;
    }
    if (this.prop.labelFor) {
      this.element.setAttribute("for", this.prop.labelFor);
    }
    if (this.prop.eventStarter && this.prop.eventFunction) {
      this.element.addEventListener(
        this.prop.eventStarter,
        this.prop.eventFunction
      );
    }
  }
}

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
      maxPage: null,
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
        that.buildTableObject(CSVdata);
      },
      this.datafile,
      "GET",
      false
    );
    this.renderTable();
    this.renderController();
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

  renderController() {
    this.tableController.classList.add("tableController");
    this.container.appendChild(this.tableController);
    this.container.insertBefore(this.tableController, this.table);
    this.renderPageControl();
    this.renderColumnControl();
  }

  renderColumnControl() {
    let checkBoxesContainer = document.createElement("div");

    for (let column in this.tableData.header) {
      let checkBoxContainer = document.createElement("div");
      let controllLabel = document.createElement("label");
      let columnControl = document.createElement("checkbox");
    }
  }

  renderPageControl() {
    let that = this;
    let selectContainer = document.createElement("div");
    this.tableController.appendChild(selectContainer);

    let controllLabel = new renderElement({
      type: "label",
      classes: "rowControlLabel",
      targetParentNode: selectContainer,
      labelFor: "rowNumberSelect",
      innerContent: "Sorok száma: ",
    });
    controllLabel.create();

    let rowNumberSelect = new renderElement({
      type: "select",
      id: "rowNumberSelect",
      targetParentNode: selectContainer,
      eventStarter: "change",
      eventFunction: function () {
        let currentRow = that.settings.showRowNumber * that.settings.page;
        that.settings.showRowNumber = this.value;
        that.settings.page = Math.ceil(
          currentRow / that.settings.showRowNumber
        );
        that.setMaxPages();
        that.renderTable();
      },
    });
    rowNumberSelect.create();

    let prevButton = new renderElement({
      type: "button",
      id: "prevPage",
      targetParentNode: selectContainer,
      innerContent: "Előző: ",
      eventStarter: "click",
      eventFunction: function () {
        that.settings.page--;
        if (that.settings.page < 0) {
          that.settings.page = 0;
        }
        that.renderTable();
      },
    });
    prevButton.create();

    let nextButton = new renderElement({
      type: "button",
      id: "nextPage",
      targetParentNode: selectContainer,
      innerContent: "Következő: ",
      eventStarter: "click",
      eventFunction: function () {
        that.settings.page++;
        if (that.settings.page > that.settings.maxPage) {
          that.settings.page = that.settings.maxPage;
        }
        that.renderTable();
      },
    });
    nextButton.create();

    this.settings.rowNumberOptions.push(this.tableData.recordNumber);

    /*

    this.settings.rowNumberOptions.push(this.tableData.recordNumber);
    for (let rowNumberOption of this.settings.rowNumberOptions) {
      if (rowNumberOption <= this.tableData.recordNumber) {
        let option = document.createElement("option");
        option.value = rowNumberOption;
        option.text =
          rowNumberOption !== this.tableData.recordNumber
            ? rowNumberOption
            : "összes";
        option.text += " sor";
        rowNumberSelect.appendChild(option);
      }
    }

    let that = this;
    rowNumberSelect.addEventListener("change", function () {
      let currentRow = that.settings.showRowNumber * that.settings.page;

      that.settings.showRowNumber = this.value;
      that.settings.page = Math.ceil(
        currentRow / that.settings.showRowNumber
      );
      that.setMaxPages();
      that.renderTable();
    });
    }*/

    for (let rowNumberOption of this.settings.rowNumberOptions) {
      if (rowNumberOption <= this.tableData.recordNumber) {
        let text =
          rowNumberOption !== this.tableData.recordNumber
            ? rowNumberOption
            : "összes";
        text += " sor";

        console.log(text);

        let option = new renderElement({
          type: "option",
          value: rowNumberOption,
          targetParentNode: rowNumberSelect.element,
          innerContent: text,
        });
        option.create();
      }
    }
  }

  setMaxPages() {
    this.settings.maxPage =
      Math.ceil(this.tableData.recordNumber / this.settings.showRowNumber) - 1;
  }

  buildTableObject(rawData) {
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
          this.setMaxPages();
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

    //console.log(this.tableData);
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
    for (let [rowNr, record] of this.tableData.body.entries()) {
      let rowId;
      if (
        this.settings.page * this.settings.showRowNumber <= rowNr &&
        (this.settings.page + 1) * this.settings.showRowNumber - 1 >= rowNr
      ) {
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
