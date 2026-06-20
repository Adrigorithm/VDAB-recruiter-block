# vdab-recruiter-block

A lightweight browser userscript or extension that reorders job listings on the VDAB website (`www.vdab.be`) to de-prioritize vacancies posted by third-party recruitment agencies, bringing direct employer listings to the top.

Please note that I bear no ill will towards recruiters personally, but rather to the work they do (if it's not a LLM doing the work for them). I made this because almost all recruitment agencies I've interacted with either don't respond at all or weeks later with "vacancy has already been filled - yeah no shit???". Additionally, I have stumbed upon many duplicates or already filled roles as well. In the rare instances I do get interviewed (for IT positions), they display no interest or knowledge in either the company they are hiring for or anything about IT in general. This is awful and makes the **FIRST** step in the hiring process a pointless social interaction where the best yapper wins.

## 🚀 Features

* **Automatic Reordering:** Detects job listings from specific known recruitment agencies and moves them to the bottom of the vacancy list.
* **Visual Dimming:** Reduces opacity of prioritized agency listings to make them visually distinct.
* **Dynamic Monitoring:** Actively watches for page updates (such as filtering, pagination, or AJAX loading) and re-applies sorting automatically without needing a page refresh.
* **Logo & Name Detection:** Identifies recruiters using both their logo alt-text and their displayed names in the metadata section.
* **DOM Stability Handling:** Includes logic to handle Drupal-based rendering delays, ensuring scripts only run when the DOM is fully stable.

## 🚀 Planned Features

* **Job Suggestions:** The job suggestions page includes a second vacancies list (made by AI (unfortunately))
* **Automatically fetch recruitment agencies:** Manually editing a file can get tiring quickly. This may not be possible to automate but we'll have to see what is possible.
* **Configurability:** An extension menu that allows you to configure what is to be done with the low priority job vacancies. A few options could be sort to bottom with or without dimming and maybe removing with a toggle button or entirely. 

## ⚙️ How It Works

The script targets the `.c-vacature-container` element on VDAB search result pages. Upon detecting a change or initial load, it:

1. **Polls for Stability:** Waits until the vacancy list stops loading new items to avoid race conditions.
2. **Iterates Listings:** Loops through each vacancy item.
3. **Checks Criteria:**
   - **Logo Check:** Looks for an image with a specific `alt` attribute found in the `vdabRecruiterLogoAlts` list.
   - **Name Check:** Checks the recruiter name (`<strong>` tag) against the `vdabRecruiterNames` list.
4. **Repositions:** If a match is found, the listing is moved after the last child of the container and styled with `opacity: 0.25`.
5. **Watches for Changes:** Sets up an interval watcher to detect if the "sorted" marker is removed (indicating a user action like pagination), triggering a re-sort.

## 🛠 Installation

### Option A: Userscript (Recommended)
At this time I have not tested this but it should work.

### Option B: Extension
Search for this extension on the browser extension market place. If you're not sure you found the correct one, match against information in `manifest.json`.

## ⚠️ Limitations & Maintenance

* **Site Structure Dependence:** This script relies heavily on specific CSS classes (`.c-vacature-container`, `.c-vacature__logo`, etc.) and HTML structure used by VDAB. If VDAB updates their frontend framework, this script may break or stop detecting vacancies.
* **Drupal Specifics:** The script includes aggressive polling logic specifically designed to counteract Drupal's rendering behavior.
* **Manual Updates Required:** To block new agencies, you must manually update the `vdabRecruiterNames` and `vdabRecruiterLogoAlts` arrays in the code.

## 🔧 Configuration

To modify the list of blocked recruiters, open the script source and edit:

```javascript
const vdabRecruiterNames = [
  // Add new names here
];

const vdabRecruiterLogoAlts = [
  // Add new logo alt texts here
];
```

---

Disclaimer: This tool is intended for personal convenience and does not constitute an official integration with VDAB.
