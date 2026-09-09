# Torn - Delete All Targets

A Torn City userscript that safely scans and deletes all players from your Targets List.

The script adds a **Target List Manager** directly to Torn's Targets List page, allowing you to clear your entire target list while providing multiple confirmation and safety checks.

---

## Features

- Automatically detects dynamically loaded targets.
- Scans the complete Targets List before deleting anything.
- Displays the number of targets found.
- Displays loaded rows, removed targets, and remaining targets.
- Requires **two separate confirmations** before deletion begins.
- Automatically handles Torn's individual **Delete → Yes** confirmation.
- Verifies that each target was actually removed before continuing.
- Stops automatically if Torn's interface behaves unexpectedly.
- Works when the Targets List is empty.
- Returns the page to the top after scanning and deletion.
- Does not use external APIs or services.
- Does not collect, transmit, or store user data.

---

## Screenshots

### Target List Manager

The script adds a management panel directly above the Targets List.

![Target List Manager](https://raw.githubusercontent.com/peetam22/Torn-Delete-All-Targets/main/Target%20List%20Manager%20-%20Start.png)

### Preparing to Delete

After scanning the complete list, the script displays the number of targets found and asks for confirmation.

![Prepare to Delete](https://raw.githubusercontent.com/peetam22/Torn-Delete-All-Targets/main/Target%20List%20Manager%20-%20Prepare%20to%20Delete%20Popup.png)

### Final Confirmation

A second confirmation is required before the deletion process begins.

![Confirm Target Delete](https://raw.githubusercontent.com/peetam22/Torn-Delete-All-Targets/main/Target%20List%20Manager%20-%20Confirm%20Target%20Delete.png)

### Deletion in Progress

The manager tracks the deletion progress while each target is removed.

![Deletion in Progress](https://raw.githubusercontent.com/peetam22/Torn-Delete-All-Targets/main/Target%20List%20Manager%20-%20While%20Delete.png)

### Completed

Once all targets have been successfully removed, the manager displays the completed status.

![Deletion Complete](https://raw.githubusercontent.com/peetam22/Torn-Delete-All-Targets/main/Target%20List%20Manager%20-%20Post%20Script.png)

---

## How It Works

1. Open your **Torn Targets List**.
2. Click **Delete All Targets** in the Target List Manager.
3. The script automatically loads the complete target list.
4. The total number of targets found is displayed.
5. The first confirmation asks whether you want to continue.
6. A final confirmation must be clicked before deletion begins.
7. For each target, the script clicks Torn's normal **Remove** button.
8. The script waits for Torn's **Yes / No** confirmation.
9. The script clicks **Yes** to confirm the removal.
10. The script verifies that the target was actually removed.
11. The process continues until all scanned targets have been removed.

---

## Safety

> ⚠️ **Important:** This script permanently removes targets from your Torn Targets List.

Make sure you actually want to clear your target list before confirming the deletion.

### Multiple Safety Checks

The script is designed to avoid accidental deletion:

- **Scanning happens before deletion.**
- The number of targets is displayed before deletion begins.
- A first confirmation is required.
- A final confirmation is required.
- Torn's normal individual deletion confirmation is still handled.
- Each target must disappear from the page before the script counts it as successfully removed.
- The script stops if an expected confirmation or removal does not occur.

**No targets are removed during the initial scan.**

---

## Requirements

- [Torn City](https://www.torn.com/)
- A userscript manager such as [Tampermonkey](https://www.tampermonkey.net/)
- A modern web browser

---

## Installation

### Tampermonkey

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Install **Torn - Delete All Targets** from the **Install** button on the Greasy Fork page.
3. Confirm the installation in Tampermonkey.
4. Open your Torn Targets List.

The **Target List Manager** should appear above your target list.

### Manual Installation

If you prefer to install the script manually, the source code is available in this repository:

[`Torn-Delete-All-Targets.user.js`](https://github.com/peetam22/Torn-Delete-All-Targets/blob/main/Torn-Delete-All-Targets.user.js)

---

## Target List Manager

The manager displays five pieces of information:

| Display | Description |
|---|---|
| **Targets Found** | Total unique targets discovered during the scan |
| **Loaded Rows** | Number of target rows currently loaded on the page |
| **Targets Removed** | Number of targets successfully deleted |
| **Remaining** | Estimated number of targets still remaining |
| **Status** | Current state of the operation |

---

## Privacy

This userscript:

- Does not collect personal information.
- Does not transmit data to external servers.
- Does not use external APIs.
- Does not use analytics or tracking.
- Does not store target information outside the current page.

All processing takes place locally in your browser.

---

## Version History

### 2.1.1 — Initial Public Release

- Added Target List Manager panel.
- Added dynamic target scanning.
- Added target count tracking.
- Added two-step deletion confirmation.
- Added automatic handling of Torn's **Delete → Yes** confirmation.
- Added removal verification.
- Added deletion progress tracking.
- Added support for empty target lists.
- Added persistent panel placement after page refresh.

---

## Disclaimer

This is an unofficial Torn userscript.

It is **not affiliated with, endorsed by, or sponsored by Torn**.

Use the script at your own discretion.

---

## Author

**peeta22 [2268033]**

Created for the Torn City community.
