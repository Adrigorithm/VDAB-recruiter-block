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

let vdabRecruiterBlockMode = undefined;
let vdabRecruiterNames = undefined;
let vdabRecruiterLogoAlts = undefined;
let errorHeight = -1;

applyMode.addEventListener("click", async () => {
  for (const radio of modeRadiosContainer.getElementsByTagName("input")) {
    if (radio.checked) {
      let changed = isVdabRecruiterBlockModeChanged(radio.value);

      if (!changed) return;

      try {
        const [tab] = await getBrowserTabAsync();
        await changeBlockModeAsync(tab, radio.value);
        setVdabRecruiterBlockMode(radio.value);
      } catch {
        checkRadioButton(vdabRecruiterBlockMode);
        displayError("Couldn't find VDAB vacancies page.");
      }

      break;
    }
  }
});

addRecruiterName.addEventListener("click", async () => {
  let name = newRecruiterName.value.trim();

  if (!name) return;

  let isDuplicate = isVdabRecruiterNameDuplicate(name);

  if (isDuplicate) return;

  try {
    const [tab] = await getBrowserTabAsync();
    await handleRecruiterNameAsync(tab, name, "+");
    addVdabRecruiterName(name);
    addOptionToSelect(name, name, false, recruiterNames);
  } catch {
    displayError("Couldn't find VDAB vacancies page.");
  }
});

addRecruiterLogoAlt.addEventListener("click", async () => {
  let logoAlt = newRecruiterLogoAlt.value.trim();

  if (!logoAlt) return;

  let isDuplicate = isVdabRecruiterLogoAltDuplicate(logoAlt);

  if (isDuplicate) return;

  try {
    const [tab] = await getBrowserTabAsync();
    await handleRecruiterLogoAltAsync(tab, logoAlt, "+");
    addVdabRecruiterLogoAlt(logoAlt);
    addOptionToSelect(logoAlt, logoAlt, false, recruiterLogoAlts);
  } catch {
    displayError("Couldn't find VDAB vacancies page.");
  }
});

removeRecruiterName.addEventListener("click", async () => {
  let name = recruiterNames.value;

  try {
    const [tab] = await getBrowserTabAsync();
    await handleRecruiterNameAsync(tab, name, "-");
    recruiterNames.item(recruiterNames.selectedIndex).remove();
    removeValueFromListAndLocalStorageStringList(name, vdabRecruiterNames, key);
  } catch {
    displayError("Couldn't find VDAB vacancies page.");
  }
});

removeRecruiterLogoAlt.addEventListener("click", async () => {
  let logoAlt = recruiterLogoAlts.value;

  try {
    const [tab] = await getBrowserTabAsync();
    await handleRecruiterLogoAltAsync(tab, logoAlt, "-");
    recruiterLogoAlts.item(recruiterLogoAlts.selectedIndex).remove();
  } catch {
    displayError("Couldn't find VDAB vacancies page.");
  }
});

doHardReset.addEventListener("click", async () => {
  try {
    const [tab] = await getBrowserTabAsync();
    await hardResetAsync(tab);
    hardReset();
    reload(true);
  } catch {
    displayError("Couldn't find VDAB vacancies page.");
  }
});

doRemoveData.addEventListener("click", async () => {
  try {
    const [tab] = await getBrowserTabAsync();
    await removeDataAsync(tab);
    removeData();
  } catch {
    displayError("Couldn't find VDAB vacancies page.");
  }
});

/**
 * Checks a specific radio button.
 * @param {string | number} mode A string or integer representing the radio button by value.
 */
function checkRadioButton(mode) {
  for (const radio of modeRadiosContainer.getElementsByTagName("input")) {
    // Type coercion intended. Value from localStorage is a string, while form HTML is an integer.
    if (radio.getAttribute("value") == mode) {
      radio.setAttribute("checked", "");
      break;
    }
  }
}

initialise();

function initialise() {
  errorHeight = error.clientHeight;

  hideError();

  vdabRecruiterBlockMode = localStorage.getItem(LocalStorage.BlockMode);
  vdabRecruiterNames = localStorage.getItem(LocalStorage.Names);
  vdabRecruiterLogoAlts = localStorage.getItem(LocalStorage.LogoAlts);

  resetLocalStorageDefaults(
    vdabRecruiterBlockMode === null,
    vdabRecruiterNames === null,
    vdabRecruiterLogoAlts === null,
  );

  reload();
}

function hideError() {
  error.style.marginTop = `-${errorHeight}px`;
}

function displayError(errorMessage) {
  error.innerHtml = errorMessage;
  error.style.visibility = "visible";
  error.style.marginTop = 0;
  setTimeout(() => {
    hideError();
  }, 500);
}

function hardReset() {
  resetLocalStorageDefaults(true, true, true);
}

function removeData() {
  localStorage.clear();
}

function reload(onlyDefaults) {
  checkRadioButton(vdabRecruiterBlockMode);

  vdabRecruiterNames.forEach((name) => {
    addOptionToSelect(
      name,
      name,
      onlyDefaults ? true : VdabDefaultRecruiterNames.includes(name),
      recruiterNames,
    );
  });

  vdabRecruiterLogoAlts.forEach((alt) => {
    addOptionToSelect(
      alt,
      alt,
      onlyDefaults ? true : VdabDefaultRecruiterLogoAlts.includes(alt),
      recruiterLogoAlts,
    );
  });
}

/**
 * Resets the specified values (whose parameters are `true`) in localStorage.
 * @param {boolean} blockMode
 * @param {boolean} names
 * @param {boolean} logoAlts
 */
function resetLocalStorageDefaults(blockMode, names, logoAlts) {
  if (blockMode) {
    localStorage.setItem(LocalStorage.BlockMode, VdabDefaultRecruiterBlockMode);
    vdabRecruiterBlockMode = VdabDefaultRecruiterBlockMode;
  }

  if (names) {
    localStorage.setItem(LocalStorage.Names, VdabDefaultRecruiterNames);
    vdabRecruiterNames = VdabDefaultRecruiterNames.split(StringListSeparator);
  } else {
    vdabRecruiterNames = vdabRecruiterNames.split(StringListSeparator);
  }

  if (logoAlts) {
    localStorage.setItem(LocalStorage.LogoAlts, VdabDefaultRecruiterLogoAlts);
    vdabRecruiterLogoAlts =
      VdabDefaultRecruiterLogoAlts.split(StringListSeparator);
  } else {
    vdabRecruiterLogoAlts = vdabRecruiterLogoAlts.split(StringListSeparator);
  }
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

async function hardResetAsync(tab) {
  await browser.tabs.sendMessage(tab.id, {
    command: "hardReset",
  });
}

async function removeDataAsync(tab) {
  await browser.tabs.sendMessage(tab.id, {
    command: "removeData",
  });
}

/**
 * Checks whether `mode` is the same as the currently active mode.
 * @param {string | number} mode The mode to be checked.
 * @returns {boolean} A boolean indicating whether `mode` is changed.
 */
function isVdabRecruiterBlockModeChanged(mode) {
  // Type coercion intended
  return !vdabRecruiterBlockMode == mode;
}

/**
 * Checks if `logoAlt` is not already present in localStorage. Doesn't check for whitespace (event handler does this).
 * @param {string} logoAlt The logoAlt to be checked.
 * @returns {boolean} A boolean indicating whether `logoAlt` is a duplicate.
 */
function isVdabRecruiterLogoAltDuplicate(logoAlt) {
  return vdabRecruiterLogoAlts.some((l) => l === logoAlt);
}

/**
 * Checks if `name` is not already present in localStorage. Doesn't check for whitespace (event handler does this).
 * @param {string} name The name to be checked.
 * @returns {boolean} A boolean indicating whether `name` is a duplicate.
 */
function isVdabRecruiterNameDuplicate(name) {
  return vdabRecruiterNames.some((n) => n === name);
}

// Since this comes from the popup, invalid values should never happen.
function setVdabRecruiterBlockMode(mode) {
  localStorage.setItem(LocalStorage.BlockMode, mode);
  vdabRecruiterBlockMode = mode;
}

function addVdabRecruiterName(name) {
  addValueToLocalStorageStringList(name, LocalStorage.Names);
  vdabRecruiterNames.push(name);
}

function addVdabRecruiterLogoAlt(logoAlt) {
  addValueToLocalStorageStringList(logoAlt, LocalStorage.LogoAlts);
  vdabRecruiterLogoAlts.push(logoAlt);
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
