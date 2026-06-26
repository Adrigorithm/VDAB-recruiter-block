const VdabDefaultRecruiterBlockMode = 1;
const VdabDefaultRecruiterNames =
  "Madison Recruitment¬Kingfisher Recruitment¬LGA IT¬ITZU Jobs¬ITZU¬Passion Works!¬Vivaldis Interim¬AGO Jobs & HR¬UNIQUE¬JOB TALENT¬Kwery¬Accent¬Passion Works!";
const VdabDefaultRecruiterLogoAlts =
  "Logo Editx¬Logo LGA IT¬Logo ITZU¬Logo Vivaldis Interim¬Logo Jobat¬Logo AGO Jobs & HR¬Logo Tempo-Team¬Logo Unique¬Logo Job Talent¬Logo ictjob¬Logo Kwery¬Logo Accent Construct";

const LocalStorage = {
  BlockMode: "vdab-recruiter-block_mode",
  Names: "vdab-recruiter-block_recruiterNames",
  LogoAlts: "vdab-recruiter-block_recruiterLogoAlts",
};

const StringListSeparator = "¬";

/*
  0 = Sort to bottom
  1 = Sort to bottom and dim
  2 = Remove :3
*/
let vdabRecruiterBlockMode = undefined;

let vdabRecruiterNames = undefined;
let vdabRecruiterLogoAlts = undefined;

let logoClassname = "c-vacature-meta -location";

document.addEventListener("DOMContentLoaded", vdabHandle());

browser.runtime.onMessage.addListener((message) => {
  if (message.command === "changeBlockMode") {
    setVdabRecruiterBlockMode(message.data);
    vdabPrioritiseVacancies();
  } else if (message.command === "handleRecruiterName") {
    if (message.mode === "+") addVdabRecruiterName(message.data);
    else if (message.mode === "-") removeVdabRecruiterName(message.data);
    vdabPrioritiseVacancies();
  } else if (message.command === "handleRecruiterLogoAlt") {
    if (message.mode === "+") addVdabRecruiterLogoAlt(message.data);
    else if (message.mode === "-") removeVdabRecruiterLogoAlt(message.data);
    vdabPrioritiseVacancies();
  } else if (message.command === "hardReset") {
    hardReset();
    vdabPrioritiseVacancies();
  } else if (message.command === "removeData") {
    removeData();
  }
});

function vdabPrioritiseVacancies(vacanciesListUlIndex) {
  if (vdabFetchLiveVacanciesUl(vacanciesListUlIndex).children.length === 0) {
    console.warn(
      "vdab-recruiter-block couldn't find any vacancies (no jobs? or did the website update?).",
    );
    return;
  }

  let index = 0;

  for (
    let i = 0;
    i < vdabFetchLiveVacanciesUl(vacanciesListUlIndex).children.length;
    i++
  ) {
    const vacancyLi =
      vdabFetchLiveVacanciesUl(vacanciesListUlIndex).children.item(index);

    // This Element does exist but doesn't have children when the vacancy doesn't have a logo.
    const logoDiv = vacancyLi.getElementsByClassName("c-vacature__logo")[0];

    if (logoDiv && logoDiv.style.display !== "none") {
      const logoImg = logoDiv.getElementsByTagName("img")[0];

      if (logoImg && isVdabRecruiterLogoAlt(logoImg)) {
        vdabApplyLowPriorityVacancy(vacanciesListUlIndex, vacancyLi);
        continue;
      }
    } else {
      console.warn(
        "vdab-recruiter-block couldn't find a logo container (did the website update?).",
      );
    }

    const recruiterNameStrong = vacancyLi
      .getElementsByClassName("c-vacature-meta -location")[0]
      ?.getElementsByTagName("span")[0]
      ?.getElementsByTagName("strong")[0];

    if (recruiterNameStrong) {
      if (isVdabRecruiterName(recruiterNameStrong)) {
        vdabApplyLowPriorityVacancy(vacanciesListUlIndex, vacancyLi);
        continue;
      }
    } else {
      console.warn(
        "vdab-recruiter-block couldn't find a recruiter name (did the website update?).",
      );
    }

    index++;
  }

  // This attribute is used to indicate the list has changed (it will be removed if that's the case). This of course doesn't apply to the initial page load.
  vdabFetchLiveVacanciesUl(vacanciesListUlIndex)
    .querySelector(["li:last-of-type"])
    .setAttribute("rb-sorted", true);
}

/**
 * Initialises application critical variables from `localStorage`, falling back to default values.
 */
function loadDefaults() {
  vdabRecruiterBlockMode = localStorage.getItem(LocalStorage.BlockMode);
  vdabRecruiterNames = localStorage.getItem(LocalStorage.Names);
  vdabRecruiterLogoAlts = localStorage.getItem(LocalStorage.LogoAlts);

  resetLocalStorageDefaults(
    vdabRecruiterBlockMode === null,
    vdabRecruiterNames === null,
    vdabRecruiterLogoAlts === null,
  );
}

function hardReset() {
  resetLocalStorageDefaults(true, true, true);
}

function removeData() {
  localStorage.removeItem(LocalStorage.BlockMode);
  localStorage.removeItem(LocalStorage.Names);
  localStorage.removeItem(LocalStorage.LogoAlts);
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

function vdabHandle() {
  setPageSettings();
  loadDefaults();

  // Drupal websites are horrible. We need to poll until a specific element exists first.
  let vacancyUls = undefined;
  let isBusy = false;

  setInterval(() => {
    if (isBusy) return;

    isBusy = true;

    // Can be null when either no vacancy search happened or when the page wasn't loaded yet.
    vacancyUls = vdabFetchLiveVacancyContainers();

    if (vacancyUls.length === 0) isBusy = false;
    else {
      // The vacancies container exists but the chilren elements are still being loaded in, so it is "unstable" and we must wait for it to be done.
      vdabWaitForVacancyListStability((success) => {
        if (success) {
          let unsortedVacanciesUlIndices = vdabFetchLiveUnsortedVacanciesUl();

          if (unsortedVacanciesUlIndices.length > 0)
            unsortedVacanciesUlIndices.forEach((index) =>
              vdabPrioritiseVacancies(index),
            );
        }

        isBusy = false;
      });
    }
  }, 500);
}

function setPageSettings() {
  if (location.pathname === "/vindeenjob/prive/suggesties")
    logoClassname = "c-vacature-meta__location";
}

function isVdabRecruiterName(recruiterNameStrong) {
  return vdabRecruiterNames.some(
    (name) => name === recruiterNameStrong.textContent,
  );
}

function isVdabRecruiterLogoAlt(logoImg) {
  return vdabRecruiterLogoAlts.some((alt) => alt === logoImg.alt);
}

function vdabApplyLowPriorityVacancy(vacanciesListUlIndex, vacancyLi) {
  vdabFetchLiveVacanciesUl(vacanciesListUlIndex).children[
    vdabFetchLiveVacanciesUl(vacanciesListUlIndex).children.length - 1
  ].after(vacancyLi);

  if (vdabRecruiterBlockMode == 0) {
    vacancyLi.style.opacity = "";
    vacancyLi.style.display = "";
  } else if (vdabRecruiterBlockMode == 1) {
    vacancyLi.style.opacity = 0.25;
    vacancyLi.style.display = "";
  } else if (vdabRecruiterBlockMode == 2) {
    vacancyLi.style.display = "none";
  }
}

function vdabWaitForVacancyListStability(callback) {
  let isBusy = false;

  let stabilityPoller = setInterval(() => {
    if (isBusy) return;

    isBusy = true;

    let vacancyContainers = vdabFetchLiveVacancyContainers();

    if (vacancyContainers.length > 0) {
      for (let container of vacancyContainers)
        if (container.getElementsByClassName("has-loading").length > 0) {
          isBusy = false;

          return;
        }

      clearInterval(stabilityPoller);
      callback(true);
    } else {
      // Sometimes, when the user changes the search parameters, it can happen that vdabFetchLiveVacanciesUl() returns null
      // - mainly due to the interval taking 250ms.
      // The caller is notified and will handle this event as well as it can.

      clearInterval(stabilityPoller);
      callback(false);
    }
  }, 250);
}

function vdabFetchLiveVacancyContainers() {
  return document.getElementsByClassName("c-vacature-container");
}

function vdabFetchLiveUnsortedVacanciesUl() {
  let indices = [];
  let counter = 0;

  for (let ul of vdabFetchLiveVacancyContainers()) {
    if (
      ul.querySelector(["li:last-of-type"]).getAttribute("rb-sorted") === null
    )
      indices.push(counter);

    counter++;
  }

  return indices;
}

function vdabFetchLiveVacanciesUl(index) {
  return vdabFetchLiveVacancyContainers()[index];
}

// Since this comes from the popup, invalid values should never happen.
function setVdabRecruiterBlockMode(mode) {
  localStorage.setItem(LocalStorage.BlockMode, mode);
  vdabRecruiterBlockMode = mode;
}

// Doesn't check for whitespace or duplicates (popup does this).
function addVdabRecruiterLogoAlt(alt) {
  addValueToLocalStorageStringList(alt, LocalStorage.LogoAlts);
  vdabRecruiterLogoAlts.push(alt);
}

// Doesn't check for whitespace or duplicates (popup does this).
function addVdabRecruiterName(name) {
  addValueToLocalStorageStringList(name, LocalStorage.Names);
  vdabRecruiterNames.push(name);
}

function removeVdabRecruiterName(name) {
  removeValueFromListAndLocalStorageStringList(
    name,
    vdabRecruiterNames,
    VdabDefaultRecruiterNames,
    LocalStorage.Names,
  );
}

function removeVdabRecruiterLogoAlt(alt) {
  removeValueFromListAndLocalStorageStringList(
    alt,
    vdabRecruiterLogoAlts,
    VdabDefaultRecruiterLogoAlts,
    LocalStorage.LogoAlts,
  );
}

/**
 * Removes a value from a list and localStorage list unless it is found in the blacklist provided.
 * @param {string} value Value to remove.
 * @param {*} list List from which the value should be removed.
 * @param {*} blacklist Prevent `value` from being removed if it is therein.
 * @param {*} key Key used to remove it from the `value` from `localStorage` list as well.
 */
function removeValueFromListAndLocalStorageStringList(
  value,
  list,
  blacklist,
  key,
) {
  let index = 0;

  while (index < list.length) {
    if (list[index] === value && !blacklist.includes(value)) {
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
