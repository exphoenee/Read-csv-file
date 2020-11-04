class renderElement {
  constructor(prop) {
    this.prop = {
      type: prop.type || null,
      targetParent: prop.targetParent || null,
      beforeSibling: prop.beforeSibling || null,
      classes: prop.classes || null,
      id: prop.id || null,
      value: prop.value || null,
      eventStarter: prop.eventStarter || null,
      eventFunction: prop.eventFunction || null,
      text: prop.text || null,
      innerContent: prop.innerContent || null,
      labelFor: prop.labelFor || null,
      inputType: prop.inputType || null,
      checked: prop.checked || null,
    };
    this.element = document.createElement(prop.type) || null;
  }

  create() {
    if (this.prop.type === "input") {
      this.element.type = this.prop.inputType;
      if (this.element.type === "checkbox") {
        this.element.checked = this.prop.checked;
      }
    }
    if (this.prop.targetParent) {
      if (typeof this.prop.targetParent === "string") {
        this.prop.targetParent = document.querySelector(this.prop.targetParent);
      } else if (typeof this.prop.targetParent === "node") {
        null;
      }
      this.prop.targetParent.appendChild(this.element);
    }
    if (this.prop.beforeSibling) {
      if (typeof this.prop.targetParent === "string") {
        this.prop.targetParent = document.querySelector(prop.beforeSibling);
      } else if (typeof this.prop.targetParent === "node") {
        null;
      }
      this.prop.targetParent.insertBefore(
        this.element,
        this.prop.beforeSibling
      );
    }
    if (this.prop.classes) {
      this.element.classList.add(this.prop.classes);
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
    this.tableController = null;
    this.table = document.createElement("table");
    this.settings = {
      columnShow: {},
      dateFilters: {
        beginDate: -Infinity,
        endDate: Infinity,
        firstRecordDate: -Infinity,
        LastRecordDate: Infinity,
      },
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
    this.tableController = new renderElement({
      type: "div",
      classes: "tableController",
      targetParent: this.container,
      beforeSibling: this.table,
    });
    this.tableController.create();

    this.renderPageControl();
    this.dateFilter();
    this.renderColumnControl();
  }

  dateFilter() {
    let that = this;

    let dateFilterContainer = new renderElement({
      type: "div",
      classes: "dateFilterContainer",
      id: "dateFilterContainer",
      targetParent: this.tableController.element,
    });
    dateFilterContainer.create();

    let beginDate = new renderElement({
      type: "input",
      inputType: "date",
      classes: "beginDate",
      id: "beginDate",
      targetParent: dateFilterContainer.element,
      eventStarter: "change",
      eventFunction: function (e) {
        e.preventDefault();
        let newDateValue = Number(this.value.split("-").join(""));
        let oldEndDateValue = that.settings.dateFilters.endDate;

        let beginDateValue = Math.min(newDateValue, oldEndDateValue);
        let endDateValue = Math.max(newDateValue, oldEndDateValue);

        beginDateValue < that.settings.dateFilters.firstRecordDate
          ? (beginDateValue = that.settings.dateFilters.firstRecordDate)
          : null;

        endDateValue > that.settings.dateFilters.lastRecordDate
          ? (endDateValue = that.settings.dateFilters.lastRecordDate)
          : null;

        that.settings.dateFilters.beginDate = beginDateValue;
        that.settings.dateFilters.endDate = endDateValue;

        generateFilterText();
        that.renderTable();
      },
    });
    beginDate.create();

    let endDate = new renderElement({
      type: "input",
      inputType: "date",
      classes: "endDate",
      id: "endDate",
      targetParent: dateFilterContainer.element,
      eventStarter: "change",
      eventFunction: function (e) {
        e.preventDefault();
        let newDateValue = Number(this.value.split("-").join(""));
        let oldBeginDateValue = that.settings.dateFilters.beginDate;

        let beginDateValue = Math.min(newDateValue, oldBeginDateValue);
        let endDateValue = Math.max(newDateValue, oldBeginDateValue);

        beginDateValue < that.settings.dateFilters.firstRecordDate
          ? (beginDateValue = that.settings.dateFilters.firstRecordDate)
          : null;

        endDateValue > that.settings.dateFilters.lastRecordDate
          ? (endDateValue = that.settings.dateFilters.lastRecordDate)
          : null;

        that.settings.dateFilters.beginDate = beginDateValue;
        that.settings.dateFilters.endDate = endDateValue;

        generateFilterText();
        that.renderTable();
      },
    });
    endDate.create();

    let filterText = new renderElement({
      type: "p",
      classes: "filterText",
      id: "filterText",
      targetParent: dateFilterContainer.element,
      innerContent: generateFilterText(),
    });
    filterText.create();
    that.settings.dateFilters.filterText = filterText.element;
    console.log(that.settings.dateFilters.filterText);

    function generateFilterText() {
      let filterText =
        "Dátumszűrés: " +
        that.settings.dateFilters.beginDate +
        " - " +
        that.settings.dateFilters.endDate;
      if (that.settings.dateFilters.filterText) {
        that.settings.dateFilters.filterText.innerHTML = filterText;
      }
      return filterText;
    }
  }

  renderColumnControl() {
    let that = this;

    let checkBoxesContainer = new renderElement({
      type: "div",
      classes: "checkBoxesContainer",
      id: "checkBoxesContainer",
      targetParent: this.tableController.element,
    });
    checkBoxesContainer.create();

    for (let column in this.tableData.header) {
      let checkBoxLabel = new renderElement({
        type: "label",
        innerContent: this.tableData.header[column].name,
        labelFor: column,
        targetParent: checkBoxesContainer.element,
      });

      let checkBox = new renderElement({
        type: "input",
        id: column,
        inputType: "checkbox",
        checked: that.settings.columnShow[column],
        targetParent: checkBoxesContainer.element,
        eventStarter: "click",
        eventFunction: function () {
          let selecetdColumn = that.table.querySelectorAll("." + this.id);
          that.settings.columnShow[this.id] = checkBox.element.checked;
          selecetdColumn.forEach(function (cell) {
            if (!checkBox.element.checked) {
              cell.classList.add("hide");
            } else {
              cell.classList.remove("hide");
            }
          });
        },
      });

      checkBox.create();
      checkBoxLabel.create();
    }
  }

  renderPageControl() {
    let that = this;

    let selectContainer = new renderElement({
      type: "div",
      classes: "selectContainer",
      targetParent: this.tableController.element,
    });
    selectContainer.create();

    let controllLabel = new renderElement({
      type: "label",
      classes: "rowControlLabel",
      targetParent: selectContainer.element,
      labelFor: "rowNumberSelect",
      innerContent: "Sorok száma: ",
    });
    controllLabel.create();

    let rowNumberSelect = new renderElement({
      type: "select",
      id: "rowNumberSelect",
      targetParent: selectContainer.element,
      eventStarter: "change",
      eventFunction: function (e) {
        e.preventDefault();
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
      targetParent: selectContainer.element,
      innerContent: "Előző: ",
      eventStarter: "click",
      eventFunction: function (e) {
        e.preventDefault();
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
      targetParent: selectContainer.element,
      innerContent: "Következő: ",
      eventStarter: "click",
      eventFunction: function (e) {
        e.preventDefault();
        that.settings.page++;
        if (that.settings.page > that.settings.maxPage) {
          that.settings.page = that.settings.maxPage;
        }
        that.renderTable();
      },
    });
    nextButton.create();

    this.settings.rowNumberOptions.push(this.tableData.recordNumber);

    for (let rowNumberOption of this.settings.rowNumberOptions) {
      if (rowNumberOption <= this.tableData.recordNumber) {
        let text =
          rowNumberOption !== this.tableData.recordNumber
            ? rowNumberOption
            : "összes";
        text += " sor";

        let option = new renderElement({
          type: "option",
          value: rowNumberOption,
          targetParent: rowNumberSelect.element,
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
            let date = checkCellValues.join("");
            let dateUTC = new Date(date);
            col = `<span
            class="recordDate"
            data-year="${checkCellValues[0]}"
            data-month="${checkCellValues[1]}"
            data-day="${checkCellValues[2]}"
            data-type="recordDate"
            data-dateUTC="${dateUTC}"
            >${col}</span>`;
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
  }

  renderTableHeader() {
    let header = "";
    header += `<thead>`;

    let headerCells = [];
    for (let headerCell in this.tableData.header) {
      let cell = this.tableData.header[headerCell];
      let order = cell.order;

      this.settings.columnShow[headerCell] === undefined
        ? (this.settings.columnShow[headerCell] = true)
        : null;

      headerCells[order] = `<th class="${headerCell}${
        this.settings.columnShow[headerCell] ? "" : " hide"
      }">${this.tableData.header[headerCell].name}</th>`;
    }
    header += `<tr>${headerCells.join("")}</tr>`;

    header += `</thead>`;
    return header;
  }

  renderTableBody() {
    let body = "";
    let row = [];
    let recordDates = [];
    this.tableData.recordNumber = 0;

    body += `<tbody>`;

    for (let [rowNr, record] of this.tableData.body.entries()) {
      let rowId;
      let dateFilterPassed = false;
      if (
        Number(record.datum.value) <= this.settings.dateFilters.endDate &&
        this.settings.dateFilters.beginDate <= Number(record.datum.value)
      ) {
        dateFilterPassed = true;
        this.tableData.recordNumber++;
        this.setMaxPages();
      }

      if (
        this.settings.page * this.settings.showRowNumber <= rowNr &&
        (this.settings.page + 1) * this.settings.showRowNumber - 1 >= rowNr &&
        dateFilterPassed
      ) {
        let cells = [];

        for (let column in record) {
          let order = record[column].order;
          let value = record[column].value;
          let type = record[column].type;
          let cell = record[column].cell;
          rowId = record[column].row;

          cells[order] = `<td
            class="${column}${this.settings.columnShow[column] ? "" : " hide"}"
            ${value !== null ? `data-value="${value}"` : ``}
            data-type="${type}">${cell}</td>`;
        }

        row[rowNr] = `<tr
          id="${rowId}"
          class="${record.datum.value}">${cells.join("")}</tr>`;

        recordDates.push(record.datum.value);

        if (
          rowNr ==
          this.settings.initialRow + this.settings.showRowNumber - 1
        ) {
          break;
        }
      }
    }
    if (this.settings.dateFilters.beginDate === -Infinity) {
      this.settings.dateFilters.firstRecordDate = Math.min(...recordDates);
    }
    if (this.settings.dateFilters.endDate === Infinity) {
      this.settings.dateFilters.LastRecordDate = Math.max(...recordDates);
    }
    body += row.join("");

    body += `</tbody>`;
    return body;
  }

  renderTableFooter() {
    let footer = "";
    footer += `<tfoot>`;
    let footerCells = [];
    for (let footerCell in this.tableData.header) {
      let cell = this.tableData.footer[footerCell];
      let order = cell.order;
      let summary = this.tableData.footer[footerCell].summary;

      footerCells[order] = `<td class="${footerCell}
      ${this.settings.columnShow[footerCell] ? "" : " hide"}
      ">${this.tableData.header[footerCell].name}${
        summary ? ` összesen: ${summary}` : ``
      }</td>`;
    }
    footer += `<tr>${footerCells.join("")}</tr>`;
    footer += `</tfoot>`;
    return footer;
  }

  renderTable() {
    let table = "";

    table += this.renderTableHeader();
    table += this.renderTableBody();
    table += this.renderTableFooter();

    this.container.appendChild(this.table);
    this.table.innerHTML = table;
  }
}

let booking = new dataTable({
  containerID: "table-container",
  datafile: "booking.csv",
});
booking.init();
