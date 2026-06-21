document.addEventListener("DOMContentLoaded", vdabHandle());

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

      if (logoImg && isVdabRecruiterLogo(logoImg)) {
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

function vdabHandle() {
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

function isVdabRecruiterName(firstIteration, recruiterNameStrong) {
  return vdabRecruiterNames(firstIteration).some(
    (name) => name === recruiterNameStrong.textContent,
  );
}

function isVdabRecruiterLogo(firstIteration, logoImg) {
  return vdabRecruiterLogoAlts(firstIteration).some(
    (alt) => alt === logoImg.alt,
  );
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

// This section allows recruiter job postings to be hidden or removed the way you want it through the extension popup.
let vdabRecruiterBlockMode = () => {
  let mode = Number.parseInt(localStorage.getItem("vdab-recruiter-block_mode"));

  if (!mode || mode < 0 || mode > 2)
    localStorage.setItem(
      "vdab-recruiter-block_mode",
      vdabDefaultRecruiterBlockMode,
    );
  else return mode;

  return vdabDefaultRecruiterBlockMode;
};

let vdabRecruiterLogoAlts = () => {
  let alts = localStorage.getItem("vdab-recruiter-block_recruiterLogoAlts");

  if (!alts)
    localStorage.setItem(
      "vdab-recruiter-block_recruiterLogoAlts",
      vdabDefaultRecruiterLogoAlts,
    );
  else return alts.split("¬");

  return vdabDefaultRecruiterLogoAlts;
};

let vdabRecruiterNames = () => {
  let names = localStorage.getItem("vdab-recruiter-block_recruiterNames");

  if (!names)
    localStorage.setItem(
      "vdab-recruiter-block_recruiterNames",
      vdabDefaultRecruiterNames,
    );
  else return names.split("¬");

  return vdabDefaultRecruiterNames;
};

/*
  0 = Sort to bottom
  1 = Sort to bottom and dim
  2 = Remove :3
*/
const vdabDefaultRecruiterBlockMode = 1;

const vdabDefaultRecruiterNames = [
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

const vdabDefaultRecruiterLogoAlts = [
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
