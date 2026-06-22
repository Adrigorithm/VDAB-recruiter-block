let vdabRecruiterBlockMode = undefined;
let vdabRecruiterNames = undefined;
let vdabRecruiterLogoAlts = undefined;

applyMode.addEventListener("click", async () => {
  for (const radio of modeRadiosContainer.getElementsByTagName("input")) {
    if (radio.checked) {
      try {
        const [tab] = await getBrowserTabAsync();
        await changeBlockModeAsync(tab, radio.value);
        setVdabRecruiterBlockMode(radio.value);
      } catch {
        console.log("content script call failed.");
      }

      break;
    }
  }
});

addRecruiterName.addEventListener("click", async () => {
  let name = newRecruiterName.value.trim();

  if (!name) return;

  try {
    const [tab] = await getBrowserTabAsync();
    await handleRecruiterNameAsync(tab, name, "+");
    addOptionToSelect(name, name, recruiterNames);
  } catch {
    console.log("content script call failed.");
  }
});

removeRecruiterName.addEventListener("click", async () => {
  let name = recruiterNames.value;

  try {
    const [tab] = await getBrowserTabAsync();
    await handleRecruiterNameAsync(tab, name, "-");
    recruiterNames.item(recruiterNames.selectedIndex).remove();
  } catch {
    console.log("content script call failed.");
  }
});

addRecruiterLogoAlt.addEventListener("click", async () => {
  let logoAlt = newRecruiterLogoAlt.value.trim();

  if (!logoAlt) return;

  try {
    const [tab] = await getBrowserTabAsync();
    await handleRecruiterLogoAltAsync(tab, logoAlt, "+");
    addOptionToSelect(logoAlt, logoAlt, recruiterLogoAlts);
  } catch {
    console.log("content script call failed.");
  }
});

removeRecruiterLogoAlt.addEventListener("click", async () => {
  let logoAlt = recruiterLogoAlts.value;

  try {
    const [tab] = await getBrowserTabAsync();
    await handleRecruiterLogoAltAsync(tab, logoAlt, "-");
    recruiterLogoAlts.item(recruiterLogoAlts.selectedIndex).remove();
  } catch {
    console.log("content script call failed.");
  }
});

loadDefaults();

function loadDefaults() {
  vdabRecruiterBlockMode = localStorage.getItem(LocalStorage.BlockMode);
  vdabRecruiterNames = localStorage.getItem(LocalStorage.Names);
  vdabRecruiterLogoAlts = localStorage.getItem(LocalStorage.LogoAlts);

  const finalValues = resetLocalStorageDefaults(
    vdabRecruiterBlockMode === null,
    vdabRecruiterNames === null,
    vdabRecruiterLogoAlts === null,
  );

  vdabRecruiterBlockMode = finalValues.BlockMode;
  vdabRecruiterNames = finalValues.Names.split(StringListSeparator);
  vdabRecruiterLogoAlts = finalValues.LogoAlts.split(StringListSeparator);

  for (const radio of modeRadiosContainer.getElementsByTagName("input")) {
    // Type coercion intended. Value from localStorage is a string, while form HTML is an integer.
    if (radio.getAttribute("value") == activeBlockMode)
      radio.setAttribute("checked", "");
  }

  activeRecruiterNames.forEach((name) => {
    addOptionToSelect(
      name,
      name,
      VdabDefaultRecruiterNames.includes(name),
      recruiterNames,
    );
  });

  activeRecruiterLogoAlts.forEach((alt) => {
    addOptionToSelect(
      alt,
      alt,
      VdabDefaultRecruiterLogoAlts.includes(alt),
      recruiterLogoAlts,
    );
  });
}

/**
 * Resets the specified values (whose parameters are `true`) in localStorage.
 * @param {boolean} blockMode
 * @param {boolean} names
 * @param {boolean} logoAlts
 * @returns The (resetted) parameters.
 */
function resetLocalStorageDefaults(blockMode, names, logoAlts) {
  if (blockMode) {
    localStorage.setItem(LocalStorage.BlockMode, VdabDefaultRecruiterBlockMode);
    blockMode = VdabDefaultRecruiterBlockMode;
  }

  if (names) {
    localStorage.setItem(LocalStorage.Names, VdabDefaultRecruiterNames);
    names = VdabDefaultRecruiterNames;
  }

  if (logoAlts) {
    localStorage.setItem(LocalStorage.LogoAlts, VdabDefaultRecruiterLogoAlts);
    logoAlts = VdabDefaultRecruiterLogoAlts;
  }

  return { BlockMode: blockMode, Names: names, LogoAlts: logoAlts };
}

function addOptionToSelect(
  optionValue,
  optionInnerText,
  isDisabled,
  selectElement,
) {
  let option = document.createElement("option");
  option.setAttribute("value", optionValue);
  option.appendChild(document.createTextNode(optionInnerText));

  if (isDisabled) option.setAttribute("disabled", "");

  selectElement.appendChild(option);
}

async function getBrowserTabAsync() {
  return await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
}

async function changeBlockModeAsync(tab, blockMode) {
  await browser.tabs.sendMessage(tab.id, {
    command: "changeBlockMode",
    data: blockMode,
  });
}

async function handleRecruiterNameAsync(tab, name, mode) {
  await browser.tabs.sendMessage(tab.id, {
    command: "handleRecruiterName",
    mode: mode,
    data: name,
  });
}

async function handleRecruiterLogoAltAsync(tab, logoAlt, mode) {
  await browser.tabs.sendMessage(tab.id, {
    command: "handleRecruiterLogoAlt",
    mode: mode,
    data: logoAlt,
  });
}

function setVdabRecruiterBlockMode(mode) {
  localStorage.setItem(LocalStorage.BlockMode, mode);
  vdabRecruiterBlockMode = mode;
}

// Doesn't check for whitespace (popup does this), it does however check if it is not already present in localStorage.
function addVdabRecruiterLogoAlt(alt) {
  if (isInLocalStorageStringList(alt, LocalStorage.LogoAlts)) return;

  addValueToLocalStorageStringList(alt, LocalStorage.LogoAlts);
  vdabRecruiterLogoAlts.push(alt);
}

// Doesn't check for whitespace (popup does this), it does however check if it is not already present in localStorage.
function addVdabRecruiterName(name) {
  if (isInLocalStorageStringList(name, LocalStorage.Names)) return;

  addValueToLocalStorageStringList(name, LocalStorage.Names);
  vdabRecruiterNames.push(name);
}

function removeVdabRecruiterName(name) {
  removeValueFromListAndLocalStorageStringList(
    name,
    vdabRecruiterNames,
    LocalStorage.Names,
  );
}

function removeVdabRecruiterLogoAlt(alt) {
  removeValueFromListAndLocalStorageStringList(
    alt,
    vdabRecruiterLogoAlts,
    LocalStorage.LogoAlts,
  );
}

/**
 * Removes a value from a list and localStorage list.
 * @param {string} value Value to remove.
 * @param {*} list List from which the value should be removed.
 * @param {*} key Key used to remove it from the `value` from `localStorage` list as well.
 */
function removeValueFromListAndLocalStorageStringList(value, list, key) {
  let index = 0;

  while (index < list.length) {
    if (list[index] === value) {
      removeSubStringFromLocalStorageStringList(value, key);
      list.splice(index, 1);

      break;
    }

    index++;
  }
}

function addValueToLocalStorageStringList(string, key) {
  let entry = localStorage.getItem(key);
  localStorage.setItem(key, `${entry}${StringListSeparator}${string}`);
}

function isInLocalStorageStringList(string, key) {
  return localStorage.getItem(key).includes(string);
}

function removeSubStringFromLocalStorageStringList(
  stringToRemove,
  localStorageKey,
) {
  let localStorageEntry = localStorage.getItem(localStorageKey);

  // -1 is needed to include the separation character
  let localStorageEntryIndex = localStorageEntry.search(stringToRemove) - 1;

  localStorage.setItem(
    localStorageKey,
    localStorageEntry
      .substring(0, localStorageEntryIndex)
      .concat(
        localStorageEntry.substring(
          localStorageEntryIndex + stringToRemove.length,
        ),
      ),
  );
}

const VdabDefaultRecruiterBlockMode = 1;
const VdabDefaultRecruiterNames =
  "Madison Recruitment¬Kingfisher Recruitment¬LGA IT¬ITZU Jobs¬ITZU¬Passion Works!¬Vivaldis Interim¬AGO Jobs & HR¬UNIQUE¬JOB TALENT";
const VdabDefaultRecruiterLogoAlts =
  "Logo Editx¬Logo LGA IT¬Logo ITZU¬Logo Vivaldis Interim¬Logo Jobat¬Logo AGO Jobs & HR¬Logo Tempo-Team¬Logo Unique¬Logo Job Talent";

const LocalStorage = {
  BlockMode: "vdab-recruiter-block_mode",
  Names: "vdab-recruiter-block_recruiterNames",
  LogoAlts: "vdab-recruiter-block_recruiterLogoAlts",
};

const StringListSeparator = "¬";
