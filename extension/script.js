/*
  0 = Sort to bottom
  1 = Sort to bottom and dim
  2 = Remove :3
*/
let vdabRecruiterBlockMode = undefined;

let vdabRecruiterNames = undefined;
let vdabRecruiterLogoAlts = undefined;

document.addEventListener("DOMContentLoaded", vdabHandle());
browser.runtime.onMessage.addListener((message) => {
  if (message.command === "changeBlockMode")
    setVdabRecruiterBlockMode(message.data);
  else if (message.command === "handleRecruiterName")
    if (message.mode === "+") addVdabRecruiterName(message.data);
    else if (message.mode === "-") remove;
    else if (message.command === "handleRecruiterLogoAlt") return;
});

function vdabPrioritiseVacancies() {
  if (vdabFetchLiveVacanciesUl().children.length === 0) {
    console.warn(
      "vdab-recruiter-block couldn't find any vacancies (no jobs? or did the website update?).",
    );
    return;
  }

  let index = 0;

  for (let i = 0; i < vdabFetchLiveVacanciesUl().children.length; i++) {
    const vacancyLi = vdabFetchLiveVacanciesUl().children.item(index);

    // This Element does exist but doesn't have children when the vacancy doesn't have a logo.
    const logoDiv = vacancyLi.getElementsByClassName("c-vacature__logo")[0];

    if (logoDiv && logoDiv.style.display !== "none") {
      const logoImg = logoDiv.getElementsByTagName("img")[0];

      if (logoImg && isVdabRecruiterLogoAlt(logoImg)) {
        vdabApplyLowPriorityVacancy(vacancyLi);
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
        vdabApplyLowPriorityVacancy(vacancyLi);
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
  vdabFetchLiveVacanciesUl()
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

  const finalValues = resetLocalStorageDefaults(
    vdabRecruiterBlockMode === null,
    vdabRecruiterNames === null,
    vdabRecruiterLogoAlts === null,
  );

  vdabRecruiterBlockMode = finalValues.BlockMode;
  vdabRecruiterNames = finalValues.Names.split(StringListSeparator);
  vdabRecruiterLogoAlts = finalValues.LogoAlts.split(StringListSeparator);
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

function vdabHandle() {
  loadDefaults();

  // Drupal websites are horrible. We need to poll until a specific element exists first.
  let vacanciesUl = undefined;
  let pollingAttempt = 0;
  let poller = setInterval(() => {
    vacanciesUl = vdabFetchLiveVacanciesUl();
    pollingAttempt++;

    if (vacanciesUl) {
      clearInterval(poller);

      // The vacancies container exists but the chilren elements are still being loaded in, so it is "unstable" and we must wait for it to be done.
      vdabWaitForVacancyListStability(() => {
        vdabPrioritiseVacancies();

        // The list can be updated without refreshing (through filters and pagination, we need to track these changes in the vacancy list as well and re-prioritise.)
        vdabEnableVacancyPriorityWatcher();
      }, 500);
    } else if (pollingAttempt >= 100) {
      clearInterval(poller);
      console.error(
        "vdab-recruiter-block couldn't find the vacancy list because of a timeout (did the website update or is there a network error?).",
      );
      return;
    }
  }, 500);
}

function isVdabRecruiterName(recruiterNameStrong) {
  return vdabRecruiterNames.some(
    (name) => name === recruiterNameStrong.textContent,
  );
}

function isVdabRecruiterLogoAlt(logoImg) {
  return vdabRecruiterLogoAlts.some((alt) => alt === logoImg.alt);
}

function vdabApplyLowPriorityVacancy(vacancyLi) {
  if (vdabRecruiterBlockMode === 2) {
    vacancyLi.remove();
    return;
  }

  vdabFetchLiveVacanciesUl().children[
    vdabFetchLiveVacanciesUl().children.length - 1
  ].after(vacancyLi);

  if (vdabRecruiterBlockMode === 1) vacancyLi.style.opacity = 0.25;
}

function vdabWaitForVacancyListStability(callback, stabilityThresholdMs) {
  let stabilityPoller = setInterval(() => {
    let loading =
      vdabFetchLiveVacanciesUl().getElementsByClassName("has-loading");

    if (loading.length === 0) {
      clearInterval(stabilityPoller);
      callback();
    }
  }, stabilityThresholdMs);
}

function vdabEnableVacancyPriorityWatcher() {
  let watcher = setInterval(() => {
    if (
      vdabFetchLiveVacanciesUl()
        .querySelector(["li:last-of-type"])
        .getAttribute("rb-sorted")
    )
      vdabWaitForVacancyListStability(() => {
        vdabPrioritiseVacancies();
      }, 250);
  }, 250);
}

function vdabFetchLiveVacanciesUl() {
  return document.getElementsByClassName("c-vacature-container")[0];
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
