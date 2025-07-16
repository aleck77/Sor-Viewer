import "./css/style.css";
import { SorReader } from "./js/sor";
import { Gui } from "./js/gui";

//echarts
let externalScript = document.createElement("script");
externalScript.setAttribute(
  "src",
  "https://cdnjs.cloudflare.com/ajax/libs/echarts/4.6.0/echarts-en.common.min.js"
);
document.head.appendChild(externalScript);

const config = {
  browserMode: true,
};
const UserInterface = new Gui();
const button = document.getElementById("btnLoad");
const fileInput = <HTMLInputElement>document.getElementById("fileinput");
const fileChosen = document.getElementById("file-chosen");

fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files.length > 0) {
    fileChosen!.textContent = fileInput.files[0].name;
  } else {
    fileChosen!.textContent = "Файл не вибрано";
  }
});

button?.addEventListener("click", function handleClick() {
  console.log("Load button clicked.");
  if (!checkBrowserCompatibility(fileInput)) {
    console.error("Browser compatibility check failed.");
    return;
  }

  UserInterface.clearDivs();
  const file = fileInput.files![0];
  console.log(`File selected: ${file.name}`);
  const reader = new FileReader();

  if (file.name.includes(".sor")) {
    reader.onload = (res) => {
      if (res != null && res.target) {
        let result = res.target.result;
        console.log("File read successfully.");
        parseFile(result, file.name); // Pass filename to parseFile
      } else {
        console.error("File read result is null.");
      }
    };

    reader.onerror = (err) => console.error("FileReader error:", err);
    reader.readAsArrayBuffer(file);
  } else {
    console.warn("Invalid file type selected.");
    flashMessage("Only SOR Files allowed", "Warning");
  }
});

function parseFile(result: any, filename: string): void {
  console.log(`Parsing file: ${filename}`);
  let sor = new SorReader(undefined, config, result);
  let data = sor.parse();
  data.then((result) => {
    console.log("Parsing complete. Showing results.");
    UserInterface.showResults(result, filename); // Pass filename to showResults
  });
}

function checkBrowserCompatibility(
  input: HTMLInputElement | null
): input is HTMLInputElement {
  if (typeof window.FileReader !== "function") {
    flashMessage("The file API isn't supported on this browser yet.");
    return false;
  }
  if (!input) {
    flashMessage("Couldn't find the fileinput element.");
    return false;
  }
  if (!input.files) {
    flashMessage(
      "This browser doesn't seem to support the `files` property of file inputs."
    );
    return false;
  }
  if (input.files.length === 0) {
    flashMessage("Please select a file before clicking 'Load'", "Warning");
    return false;
  }
  return true;
}

function flashMessage(message: string, type: string = "Alert") {
  const parentMessageDiv = document.getElementById("flashMessage");
  if (!parentMessageDiv) return;
  parentMessageDiv.style.display = "block";
  parentMessageDiv.className = "flashMessage"; // Reset classes
  if (type) {
    parentMessageDiv.classList.add("message" + type);
  }
  const messageDiv = document.getElementById("message");
  if (messageDiv) {
    messageDiv.innerHTML = message;
  }
}
