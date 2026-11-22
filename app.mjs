import { checkDimensions, measureStl } from "./measure.mjs";

const form = document.querySelector("#check-form");
const fileInput = document.querySelector("#file");
const dropZone = document.querySelector("#drop-zone");
const unitInput = document.querySelector("#unit");
const status = document.querySelector("#status");
const report = document.querySelector("#report");
const rawHeading = document.querySelector("#raw-heading");
const tableBody = report.querySelector("tbody");
const comparisonHeaders = report.querySelectorAll("[data-comparison]");
const hint = document.querySelector("#scale-hint");
const expectedInputs = ["x", "y", "z"].map(axis => form.elements.namedItem(axis));
const toleranceInput = form.elements.namedItem("tolerance");
let revision = 0;

function setStatus(message, result = "") {
  status.textContent = message;
  status.dataset.result = result;
}

function resetResult(message, result) {
  revision += 1;
  report.hidden = true;
  tableBody.replaceChildren();
  hint.hidden = true;
  setStatus(message, result);
  return revision;
}

function inputsChanged() {
  const file = fileInput.files[0];
  resetResult(file ? "Ready to check " + file.name : "Choose a local STL to begin.");
}

function display(value) {
  return String(Number(value.toPrecision(10)));
}

function showReport(spans, unit, expected, check) {
  rawHeading.textContent = "Raw span (" + unit + ")";
  for (const header of comparisonHeaders) header.hidden = !expected;

  for (const [index, axis] of ["X", "Y", "Z"].entries()) {
    const row = tableBody.insertRow();
    const label = document.createElement("th");
    label.scope = "row";
    label.textContent = axis;
    row.append(label);
    row.insertCell().textContent = display(spans[index]);
    row.insertCell().textContent = display(check.mm[index]);

    if (expected) {
      const delta = check.delta[index];
      row.insertCell().textContent = display(expected[index]);
      row.insertCell().textContent = (delta > 0 ? "+" : "") + display(delta);
      const result = row.insertCell();
      result.textContent = check.within[index] ? "Pass" : "Fail";
      result.dataset.result = check.within[index] ? "pass" : "fail";
    }
  }

  if (check.scale) {
    hint.textContent = "Each axis measures about " + check.scale
      + "× its expected size. Check the selected unit and the export settings.";
    hint.hidden = false;
  }
  report.hidden = false;
}

form.addEventListener("input", inputsChanged);

dropZone.addEventListener("dragover", event => {
  event.preventDefault();
  dropZone.classList.add("dragging");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
dropZone.addEventListener("drop", event => {
  event.preventDefault();
  dropZone.classList.remove("dragging");
  const files = event.dataTransfer.files;
  if (files.length !== 1) {
    fileInput.value = "";
    resetResult("Drop one STL file at a time.", "error");
    return;
  }
  fileInput.files = files;
  inputsChanged();
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const ticket = resetResult("Reading STL…");
  const file = fileInput.files[0];
  const unit = unitInput.value;
  if (!file || !unit) {
    setStatus(!file ? "Choose a local STL file." : "Choose the STL coordinate unit.", "error");
    return;
  }

  const expected = expectedInputs.every(input => input.value === "" && !input.validity.badInput)
    ? undefined
    : expectedInputs.map(input => input.valueAsNumber);
  const tolerance = toleranceInput.valueAsNumber;

  try {
    const buffer = await file.arrayBuffer();
    if (ticket !== revision) return;
    const { spans, format } = measureStl(buffer);
    const check = checkDimensions(spans, unit, expected, tolerance);
    showReport(spans, unit, expected, check);
    const result = expected ? (check.within.every(Boolean) ? "pass" : "fail") : "measured";
    const label = expected ? result.toUpperCase() : "Measured";
    setStatus(label + " · " + format + " STL · " + file.name, result);
  } catch (error) {
    if (ticket === revision) setStatus(file.name + " · " + error.message, "error");
  }
});
