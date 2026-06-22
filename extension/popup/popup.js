/*
  0 = Sort to bottom
  1 = Sort to bottom and dim
  2 = Remove :3
*/
const vdabPopupDefaultRecruiterBlockMode = 1;

const vdabPopupDefaultRecruiterNames = [
  "Madison Recruitment",
  "Kingfisher Recruitment",
  "LGA IT",
  "ITZU Jobs",
  "ITZU",
  "Passion Works!",
  "Vivaldis Interim",
  "AGO Jobs & HR",
  "UNIQUE",
  "JOB TALENT",
];

const vdabPopupDefaultRecruiterLogoAlts = [
  "Logo Editx",
  "Logo LGA IT",
  "Logo ITZU",
  "Logo Vivaldis Interim",
  "Logo Jobat",
  "Logo AGO Jobs & HR",
  "Logo Tempo-Team",
  "Logo Unique",
  "Logo Job Talent",
];

applyMode.addEventListener("click", () => {
  for (const radio of modeRadiosContainer.getElementsByTagName("input")) {
    if (radio.checked) {
      localStorage.setItem("vdab-recruiter-block_mode", checkedRadio.value);
      break;
    }
  }
});

addRecruiterName.addEventListener("click", () => {
  let name = newRecruiterName.value().trim();

  if (!name) return;

  for (const option of recruiterNames) {
    if (option.value === name) return;
  }

  let activeRecruiterNames = localStorage.getItem(
    "vdab-recruiter-block_recruiterNames",
  );

  localStorage.setItem(
    "vdab-recruiter-block_recruiterNames",
    activeRecruiterNames.concat(
      `${activeRecruiterNames.length === 0 ? "" : "¬"}${name}`,
    ),
  );
  addOptionToSelect(name, name, recruiterNames);
});

removeRecruiterName.addEventListener("click", () => {
  removeSubStringFromLocalStorageStringList(
    recruiterNames.value,
    "vdab-recruiter-block_recruiterNames",
  );

  recruiterNames.item(recruiterNames.selectedIndex).remove();
});

addRecruiterLogoAlt.addEventListener("click", () => {
  let alt = newRecruiterLogoAlt.value().trim();

  if (!alt) return;

  for (const option of recruiterLogoAlts) {
    if (option.value === alt) return;
  }

  let activeRecruiterLogoAlts = localStorage.getItem(
    "vdab-recruiter-block_recruiterLogoAlts",
  );

  localStorage.setItem(
    "vdab-recruiter-block_recruiterLogoAlts",
    activeRecruiterLogoAlts.concat(
      `${activeRecruiterLogoAlts.length === 0 ? "" : "¬"}${alt}`,
    ),
  );
  addOptionToSelect(alt, alt, recruiterLogoAlts);
});

removeRecruiterLogoAlt.addEventListener("click", () => {
  removeSubStringFromLocalStorageStringList(
    recruiterLogoAlts.value,
    "vdab-recruiter-block_recruiterLogoAlts",
  );

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

function removeSubStringFromLocalStorageStringList(
  stringToRemove,
  localStorageKey,
) {
  let localStorageEntry = localStorage.getItem(localStorageKey);
  let localStorageEntryIndex = localStorageEntry.search(stringToRemove);
  let charsPrefixxed = 0;

  // If not the first character, this means there's another entry before it, and we have to include the separation character
  if (localStorageEntryIndex > 0) {
    localStorageEntryIndex--;
    charsPrefixxed = 1;
  }

  localStorage.setItem(
    localStorageKey,
    localStorageEntry
      .substring(0, localStorageEntryIndex)
      .concat(
        localStorageEntry.substring(
          localStorageEntryIndex + stringToRemove.length + charsPrefixxed,
        ),
      ),
  );
}

function addOptionToSelect(optionValue, optionInnerText, selectElement) {
  let option = document.createElement("option");
  option.setAttribute("value", optionValue);
  option.appendChild(document.createTextNode(optionInnerText));

  selectElement.appendChild(option);
}

// This section allows recruiter job postings to be hidden or removed the way you want it through the extension popup.
function vdabPopupRecruiterBlockMode() {
  let mode = Number.parseInt(localStorage.getItem("vdab-recruiter-block_mode"));

  if (!mode || mode < 0 || mode > 2)
    localStorage.setItem(
      "vdab-recruiter-block_mode",
      vdabPopupDefaultRecruiterBlockMode,
    );
  else return mode;

  return vdabPopupDefaultRecruiterBlockMode;
}

function vdabPopupRecruiterLogoAlts() {
  let alts = localStorage.getItem("vdab-recruiter-block_recruiterLogoAlts");

  if (!alts)
    localStorage.setItem(
      "vdab-recruiter-block_recruiterLogoAlts",
      vdabPopupDefaultRecruiterLogoAlts.join("¬"),
    );
  else return alts.split("¬");

  return vdabPopupDefaultRecruiterLogoAlts;
}

function vdabPopupRecruiterNames() {
  let names = localStorage.getItem("vdab-recruiter-block_recruiterNames");

  if (!names)
    localStorage.setItem(
      "vdab-recruiter-block_recruiterNames",
      vdabPopupDefaultRecruiterNames.join("¬"),
    );
  else return names.split("¬");

  return vdabPopupDefaultRecruiterNames;
}

async function sendData(tab) {
  await browser.tabs.sendMessage(tab.id, {});
}
