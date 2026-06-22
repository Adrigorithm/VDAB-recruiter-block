applyMode.addEventListener("click", () => {
  for (const radio of modeRadiosContainer.getElementsByTagName("input")) {
    if (radio.checked) {
      break;
    }
  }
});

addRecruiterName.addEventListener("click", () => {
  let name = newRecruiterName.value().trim();

  if (!name) return;

  addOptionToSelect(name, name, recruiterNames);
});

removeRecruiterName.addEventListener("click", () => {
  recruiterNames.item(recruiterNames.selectedIndex).remove();
});

addRecruiterLogoAlt.addEventListener("click", () => {
  let alt = newRecruiterLogoAlt.value().trim();

  if (!alt) return;

  addOptionToSelect(alt, alt, recruiterLogoAlts);
});

removeRecruiterLogoAlt.addEventListener("click", () => {
  recruiterLogoAlts.item(recruiterLogoAlts.selectedIndex).remove();
});

loadValues();

function loadValues() {
  let activeBlockMode = vdabPopupRecruiterBlockMode();
  let activeRecruiterNames = vdabPopupRecruiterNames();
  let activeRecruiterLogoAlts = vdabPopupRecruiterLogoAlts();

  for (const radio of modeRadiosContainer.getElementsByTagName("input")) {
    // Type coercion intended. Value from localStorage is a string, while form HTML is an integer.
    if (radio.getAttribute("value") == activeBlockMode)
      radio.setAttribute("checked", "");
  }

  activeRecruiterNames.forEach((name) => {
    addOptionToSelect(name, name, recruiterNames);
  });

  activeRecruiterLogoAlts.forEach((alt) => {
    addOptionToSelect(alt, alt, recruiterLogoAlts);
  });
}

function addOptionToSelect(optionValue, optionInnerText, selectElement) {
  let option = document.createElement("option");
  option.setAttribute("value", optionValue);
  option.appendChild(document.createTextNode(optionInnerText));

  selectElement.appendChild(option);
}

// This section allows recruiter job postings to be hidden or removed the way you want it through the extension popup.
function vdabPopupRecruiterBlockMode() {}

function vdabPopupRecruiterLogoAlts() {}

function vdabPopupRecruiterNames() {}

async function changeBlockMode(tab, blockMode) {
  await browser.tabs.sendMessage(tab.id, {
    command: "changeBlockMode",
    data: blockMode,
  });
}

async function handleRecruiterName(tab, name, mode) {
  await browser.tabs.sendMessage(tab.id, {
    command: "handleRecruiterName",
    mode: mode,
    data: name,
  });
}

async function handleRecruiterLogoAlt(tab, logoAlt, mode) {
  await browser.tabs.sendMessage(tab.id, {
    command: "handleRecruiterLogoAlt",
    mode: mode,
    data: logoAlt,
  });
}
