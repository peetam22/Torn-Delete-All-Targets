// ==UserScript==
// @name         Torn - Delete All Targets
// @namespace    https://www.torn.com/
// @version      2.1.1
// @description  Safely scan and delete all players from the Torn Targets List.
// @author       peeta22 [2268033]
// @license      MIT
// @match        https://www.torn.com/page.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const REMOVE_SELECTOR =
        'button[aria-label="Remove player from the list"]';

    const ROW_SELECTOR =
        'li.tableRowWrapper___gBiJV';

    const PANEL_ID =
        'torn-target-control-panel';

    let processing = false;

    // ------------------------------------------------------------
    // Utility
    // ------------------------------------------------------------

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getRows() {
        return Array.from(
            document.querySelectorAll(ROW_SELECTOR)
        );
    }

    function getRemoveButtons() {
        return Array.from(
            document.querySelectorAll(REMOVE_SELECTOR)
        );
    }

    function getTargetInfo(row) {
        const profile =
            row.querySelector(
                'a[aria-label^="View profile of "]'
            );

        const name =
            profile?.getAttribute('aria-label')
                ?.replace(/^View profile of\s*/i, '')
                ?.trim() ||
            profile?.textContent?.trim() ||
            'Unknown';

        let playerId = null;

        if (profile?.href) {
            const match =
                profile.href.match(/[?&]XID=(\d+)/i);

            if (match) {
                playerId = match[1];
            }
        }

        const level =
            row.querySelector('.level___lxwCB')
                ?.textContent?.trim() || '';

        const description =
            row.querySelector(
                '[aria-label^="Description "]'
            )
                ?.getAttribute('aria-label')
                ?.replace(/^Description\s*/i, '')
                ?.trim() || '';

        const status =
            row.querySelector('.status___j5hHk')
                ?.textContent?.trim() || '';

        return {
            name,
            playerId,
            level,
            description,
            status
        };
    }

    // ------------------------------------------------------------
    // Find the Targets List area
    // ------------------------------------------------------------

    function findTargetsArea() {

        // Preferred method:
        // Find the search box used by the Targets List.
        const searchInput =
            document.querySelector(
                'input[placeholder="Search targets list"]'
            );

        if (searchInput) {

            // Walk upward until we find a reasonable
            // container surrounding the search/list area.
            let element = searchInput.parentElement;

            while (
                element &&
                element !== document.body
            ) {
                const rows =
                    element.querySelectorAll(
                        ROW_SELECTOR
                    );

                const noUsers =
                    Array.from(element.querySelectorAll('*'))
                        .some(el =>
                            el.textContent?.trim() ===
                            'No users were added yet'
                        );

                if (
                    rows.length > 0 ||
                    noUsers
                ) {
                    return element;
                }

                element = element.parentElement;
            }
        }

        // Fallback when targets exist.
        const firstRow =
            document.querySelector(ROW_SELECTOR);

        if (firstRow) {
            let element = firstRow.parentElement;

            while (
                element &&
                element !== document.body
            ) {
                if (
                    element.querySelectorAll(
                        ROW_SELECTOR
                    ).length >= 1
                ) {
                    return element;
                }

                element = element.parentElement;
            }
        }

        return null;
    }

    // ------------------------------------------------------------
    // Insert Panel
    // ------------------------------------------------------------

    function insertPanel() {

        if (
            document.getElementById(PANEL_ID)
        ) {
            return document.getElementById(PANEL_ID);
        }

        const searchInput =
            document.querySelector(
                'input[placeholder="Search targets list"]'
            );

        if (!searchInput) {
            return null;
        }

        /*
         * The search box sits immediately above the
         * Targets List table.
         *
         * We locate the table/list wrapper and insert
         * our panel immediately before it.
         */

        let tableWrapper = null;

        // First try to locate the table from a target row.
        const firstRow =
            document.querySelector(ROW_SELECTOR);

        if (firstRow) {
            tableWrapper =
                firstRow.closest(
                    'div.tableWrapper___nEVBZ'
                );

            if (!tableWrapper) {
                tableWrapper =
                    firstRow.parentElement;
            }
        }

        /*
         * When there are ZERO targets, there is no row.
         *
         * Find the "No users were added yet" element
         * instead.
         */
        if (!tableWrapper) {

            const noUsers =
                Array.from(
                    document.querySelectorAll('*')
                ).find(el =>
                    el.children.length === 0 &&
                    el.textContent?.trim() ===
                    'No users were added yet'
                );

            if (noUsers) {
                tableWrapper =
                    noUsers.closest(
                        'div.tableWrapper___nEVBZ'
                    );

                if (!tableWrapper) {
                    tableWrapper =
                        noUsers.parentElement;
                }
            }
        }

        /*
         * Additional fallback:
         * Locate the container containing both the
         * column headers and search/list content.
         */
        if (!tableWrapper) {

            let element =
                searchInput.parentElement;

            while (
                element &&
                element !== document.body
            ) {

                const text =
                    element.textContent || '';

                if (
                    text.includes('Name') &&
                    text.includes('Level') &&
                    text.includes('Description') &&
                    text.includes('Status')
                ) {
                    tableWrapper = element;
                    break;
                }

                element = element.parentElement;
            }
        }

        if (
            !tableWrapper ||
            !tableWrapper.parentElement
        ) {
            return null;
        }

        const panel =
            document.createElement('div');

        panel.id = PANEL_ID;

        panel.style.cssText = `
            width:100%;
            box-sizing:border-box;
            margin:10px 0;
            padding:14px 16px;
            background:linear-gradient(
                rgb(38,50,59),
                rgb(29,39,47)
            );
            border:1px solid rgb(61,81,94);
            border-radius:4px;
            color:rgb(232,237,240);
            font-family:Arial,Helvetica,sans-serif;
            box-shadow:
                rgba(0,0,0,0.25) 0 2px 6px;
        `;

        panel.innerHTML = `

            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:15px;
                margin-bottom:12px;
            ">

                <div>

                    <div style="
                        font-size:18px;
                        font-weight:bold;
                        margin-bottom:3px;
                    ">
                        Target List Manager
                    </div>

                    <div style="
                        font-size:12px;
                        color:#aeb8be;
                    ">
                        Delete all targets from your list.
                    </div>

                </div>

                <button
                    id="torn-target-action"
                    type="button"
                    style="
                        border:1px solid #4ba4d5;
                        border-radius:4px;
                        background:
                            linear-gradient(
                                #3d8fbd,
                                #286d94
                            );
                        color:white;
                        font-weight:bold;
                        padding:9px 15px;
                        cursor:pointer;
                        white-space:nowrap;
                    "
                >
                    Delete All Targets
                </button>

            </div>

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(5,1fr);
                border-top:
                    1px solid #40515d;
                border-bottom:
                    1px solid #40515d;
            ">

                <div style="
                    text-align:center;
                    padding:9px 5px;
                    border-right:
                        1px solid #40515d;
                ">
                    <div style="
                        font-size:11px;
                        color:#aeb8be;
                    ">
                        Targets Found
                    </div>

                    <div
                        id="torn-found"
                        style="
                            font-size:18px;
                            font-weight:bold;
                            margin-top:3px;
                        "
                    >
                        0
                    </div>
                </div>

                <div style="
                    text-align:center;
                    padding:9px 5px;
                    border-right:
                        1px solid #40515d;
                ">
                    <div style="
                        font-size:11px;
                        color:#aeb8be;
                    ">
                        Loaded Rows
                    </div>

                    <div
                        id="torn-loaded"
                        style="
                            font-size:18px;
                            font-weight:bold;
                            margin-top:3px;
                        "
                    >
                        0
                    </div>
                </div>

                <div style="
                    text-align:center;
                    padding:9px 5px;
                    border-right:
                        1px solid #40515d;
                ">
                    <div style="
                        font-size:11px;
                        color:#aeb8be;
                    ">
                        Targets Removed
                    </div>

                    <div
                        id="torn-removed"
                        style="
                            font-size:18px;
                            font-weight:bold;
                            margin-top:3px;
                        "
                    >
                        0
                    </div>
                </div>

                <div style="
                    text-align:center;
                    padding:9px 5px;
                    border-right:
                        1px solid #40515d;
                ">
                    <div style="
                        font-size:11px;
                        color:#aeb8be;
                    ">
                        Remaining
                    </div>

                    <div
                        id="torn-remaining"
                        style="
                            font-size:18px;
                            font-weight:bold;
                            margin-top:3px;
                        "
                    >
                        0
                    </div>
                </div>

                <div style="
                    text-align:center;
                    padding:9px 5px;
                ">
                    <div style="
                        font-size:11px;
                        color:#aeb8be;
                    ">
                        Status
                    </div>

                    <div
                        id="torn-status"
                        style="
                            font-size:18px;
                            font-weight:bold;
                            margin-top:3px;
                        "
                    >
                        READY
                    </div>
                </div>

            </div>

            <div
                id="torn-message"
                style="
                    margin-top:10px;
                    font-size:12px;
                    font-weight:bold;
                    color:#ffd400;
                "
            >
                Ready.
            </div>
        `;

        /*
         * Insert directly before the table/list.
         */
        tableWrapper.parentElement.insertBefore(
            panel,
            tableWrapper
        );

        panel.querySelector(
            '#torn-target-action'
        ).addEventListener(
            'click',
            beginScan
        );

        return panel;
    }

    // ------------------------------------------------------------
    // Panel Updates
    // ------------------------------------------------------------

    function updatePanel({
        found,
        loaded,
        removed,
        remaining,
        status,
        message
    }) {

        const panel =
            document.getElementById(PANEL_ID);

        if (!panel) {
            return;
        }

        if (found !== undefined) {
            panel.querySelector(
                '#torn-found'
            ).textContent = found;
        }

        if (loaded !== undefined) {
            panel.querySelector(
                '#torn-loaded'
            ).textContent = loaded;
        }

        if (removed !== undefined) {
            panel.querySelector(
                '#torn-removed'
            ).textContent = removed;
        }

        if (remaining !== undefined) {
            panel.querySelector(
                '#torn-remaining'
            ).textContent = remaining;
        }

        if (status !== undefined) {
            panel.querySelector(
                '#torn-status'
            ).textContent = status;
        }

        if (message !== undefined) {
            panel.querySelector(
                '#torn-message'
            ).textContent = message;
        }
    }

    // ------------------------------------------------------------
    // Action Button
    // ------------------------------------------------------------

    function setActionButton(
        text,
        disabled = false,
        red = false
    ) {

        const button =
            document.querySelector(
                '#torn-target-action'
            );

        if (!button) {
            return;
        }

        button.textContent = text;
        button.disabled = disabled;

        button.style.cursor =
            disabled
                ? 'default'
                : 'pointer';

        if (red) {

            button.style.background =
                'linear-gradient(#e24d42,#b72e27)';

            button.style.borderColor =
                '#c43d32';

        } else {

            button.style.background =
                'linear-gradient(#3d8fbd,#286d94)';

            button.style.borderColor =
                '#4ba4d5';
        }
    }

    // ------------------------------------------------------------
    // Scan
    // ------------------------------------------------------------

    async function scanTargets() {

        const targets = new Map();

        let previousHeight = 0;
        let stableCycles = 0;

        updatePanel({
            status: 'SCANNING',
            message:
                'Loading all targets...'
        });

        while (stableCycles < 3) {

            const rows = getRows();

            rows.forEach(row => {

                const info =
                    getTargetInfo(row);

                const key =
                    info.playerId ||
                    info.name;

                if (key) {
                    targets.set(
                        key,
                        info
                    );
                }
            });

            updatePanel({
                found: targets.size,
                loaded: rows.length,
                remaining: targets.size,
                message:
                    `Scanning... ${targets.size} targets found.`
            });

            window.scrollTo({
                top:
                    document.documentElement
                        .scrollHeight,
                behavior: 'auto'
            });

            await sleep(1000);

            const currentHeight =
                document.documentElement
                    .scrollHeight;

            if (
                currentHeight ===
                previousHeight
            ) {
                stableCycles++;
            } else {
                stableCycles = 0;
            }

            previousHeight =
                currentHeight;
        }

        window.scrollTo({
            top:0,
            behavior:'auto'
        });

        await sleep(500);

        return targets;
    }

    // ------------------------------------------------------------
    // First Confirmation
    // ------------------------------------------------------------

    function showFirstConfirmation(
        targetCount
    ) {

        return new Promise(resolve => {

            const overlay =
                document.createElement('div');

            overlay.style.cssText = `
                position:fixed;
                inset:0;
                background:
                    rgba(0,0,0,0.72);
                z-index:999999;
                display:flex;
                align-items:center;
                justify-content:center;
            `;

            const box =
                document.createElement('div');

            box.style.cssText = `
                width:420px;
                max-width:90%;
                box-sizing:border-box;
                padding:24px;
                background:
                    linear-gradient(
                        rgb(38,50,59),
                        rgb(29,39,47)
                    );
                border:1px solid #526674;
                border-radius:5px;
                box-shadow:
                    0 8px 30px
                    rgba(0,0,0,0.55);
                color:#e8edf0;
                font-family:
                    Arial,Helvetica,sans-serif;
                text-align:center;
            `;

            box.innerHTML = `

                <div style="
                    font-size:30px;
                    margin-bottom:8px;
                ">
                    ⚠️
                </div>

                <div style="
                    font-size:20px;
                    font-weight:bold;
                    margin-bottom:10px;
                ">
                    Prepare to Delete All Targets
                </div>

                <div style="
                    font-size:14px;
                    margin-bottom:6px;
                ">
                    The scan found
                    <strong>
                        ${targetCount}
                    </strong>
                    targets.
                </div>

                <div style="
                    font-size:14px;
                    margin-bottom:14px;
                ">
                    No targets have been removed yet.
                </div>

                <div style="
                    color:#ffd400;
                    font-size:13px;
                    margin-bottom:20px;
                ">
                    The next step will prepare
                    the final deletion confirmation.
                </div>

                <div style="
                    display:flex;
                    justify-content:center;
                    gap:10px;
                ">

                    <button
                        id="torn-confirm-cancel"
                        type="button"
                        style="
                            padding:9px 20px;
                            border:
                                1px solid #68747b;
                            border-radius:4px;
                            background:#3c464c;
                            color:white;
                            font-weight:bold;
                            cursor:pointer;
                        "
                    >
                        Cancel
                    </button>

                    <button
                        id="torn-confirm-continue"
                        type="button"
                        style="
                            padding:9px 20px;
                            border:
                                1px solid #4ba4d5;
                            border-radius:4px;
                            background:#286d94;
                            color:white;
                            font-weight:bold;
                            cursor:pointer;
                        "
                    >
                        Continue
                    </button>

                </div>
            `;

            overlay.appendChild(box);
            document.body.appendChild(
                overlay
            );

            box.querySelector(
                '#torn-confirm-cancel'
            ).addEventListener(
                'click',
                () => {
                    overlay.remove();
                    resolve(false);
                }
            );

            box.querySelector(
                '#torn-confirm-continue'
            ).addEventListener(
                'click',
                () => {
                    overlay.remove();
                    resolve(true);
                }
            );
        });
    }

    // ------------------------------------------------------------
    // Final Confirmation
    // ------------------------------------------------------------

    function showFinalConfirmation(
        targetCount
    ) {

        return new Promise(resolve => {

            const button =
                document.querySelector(
                    '#torn-target-action'
                );

            if (!button) {
                resolve(false);
                return;
            }

            setActionButton(
                `CONFIRM DELETE ALL ${targetCount} TARGETS`,
                false,
                true
            );

            updatePanel({
                status:'READY',
                remaining:targetCount,
                message:
                    `Ready to delete ${targetCount} targets.`
            });

            const handler = () => {

                button.removeEventListener(
                    'click',
                    handler
                );

                resolve(true);
            };

            button.addEventListener(
                'click',
                handler
            );
        });
    }

    // ------------------------------------------------------------
    // Wait for Yes
    // ------------------------------------------------------------

    async function waitForYesButton(
        row,
        timeout = 5000
    ) {

        const start =
            Date.now();

        while (
            Date.now() - start <
            timeout
        ) {

            if (
                row &&
                row.isConnected
            ) {

                const buttons =
                    Array.from(
                        row.querySelectorAll(
                            'button'
                        )
                    );

                const yesButton =
                    buttons.find(
                        button =>
                            button.textContent
                                .trim()
                                .toLowerCase() ===
                            'yes'
                    );

                if (yesButton) {
                    return yesButton;
                }
            }

            const candidates =
                Array.from(
                    document.querySelectorAll(
                        'button'
                    )
                );

            const yesButton =
                candidates.find(
                    button => {

                        const text =
                            button.textContent
                                .trim()
                                .toLowerCase();

                        if (text !== 'yes') {
                            return false;
                        }

                        const style =
                            window.getComputedStyle(
                                button
                            );

                        return (
                            style.display !== 'none' &&
                            style.visibility !==
                                'hidden'
                        );
                    }
                );

            if (yesButton) {
                return yesButton;
            }

            await sleep(100);
        }

        return null;
    }

    // ------------------------------------------------------------
    // Wait for actual removal
    // ------------------------------------------------------------

    async function waitForRemoval(
        row,
        timeout = 6000
    ) {

        const start =
            Date.now();

        while (
            Date.now() - start <
            timeout
        ) {

            if (!row.isConnected) {
                return true;
            }

            const removeButton =
                row.querySelector(
                    REMOVE_SELECTOR
                );

            if (!removeButton) {
                return true;
            }

            await sleep(100);
        }

        return false;
    }

    // ------------------------------------------------------------
    // Delete Targets
    // ------------------------------------------------------------

    async function deleteTargets(
        expectedCount
    ) {

        let removed = 0;
        let safetyIterations = 0;

        setActionButton(
            'Deleting Targets...',
            true,
            true
        );

        updatePanel({
            status:'DELETING...',
            message:
                `Deleting... 0 of approximately ${expectedCount} targets removed.`
        });

        while (
            removed < expectedCount
        ) {

            safetyIterations++;

            if (
                safetyIterations >
                expectedCount * 3
            ) {

                console.error(
                    '[Torn Target Manager] Safety limit reached.'
                );

                break;
            }

            const buttons =
                getRemoveButtons();

            if (buttons.length === 0) {

                await sleep(1000);

                if (
                    getRemoveButtons()
                        .length === 0
                ) {
                    break;
                }

                continue;
            }

            const removeButton =
                buttons[0];

            const row =
                removeButton.closest(
                    ROW_SELECTOR
                );

            if (!row) {

                console.error(
                    '[Torn Target Manager] Could not identify target row.'
                );

                break;
            }

            const targetInfo =
                getTargetInfo(row);

            row.scrollIntoView({
                behavior:'auto',
                block:'center'
            });

            await sleep(150);

            // Step 1:
            // Click Torn's X/Delete button.
            removeButton.click();

            // Step 2:
            // Wait for Torn's Yes/No prompt.
            const yesButton =
                await waitForYesButton(row);

            if (!yesButton) {

                console.error(
                    '[Torn Target Manager] Yes confirmation did not appear.',
                    targetInfo
                );

                updatePanel({
                    status:'STOPPED',
                    message:
                        `Stopped: confirmation for ${targetInfo.name} did not appear.`
                });

                break;
            }

            await sleep(100);

            // Step 3:
            // Click Yes.
            yesButton.click();

            // Step 4:
            // Verify removal.
            const successfullyRemoved =
                await waitForRemoval(row);

            if (!successfullyRemoved) {

                console.error(
                    '[Torn Target Manager] Target did not disappear after Yes.',
                    targetInfo
                );

                updatePanel({
                    status:'STOPPED',
                    message:
                        `Stopped: ${targetInfo.name} did not disappear after confirmation.`
                });

                break;
            }

            removed++;

            const remaining =
                Math.max(
                    expectedCount - removed,
                    0
                );

            updatePanel({
                removed,
                remaining,
                status:'Deleting...',
                message:
                    `Deleting... ${removed} of approximately ${expectedCount} targets removed.`
            });

            await sleep(500);
        }

        window.scrollTo({
            top:0,
            behavior:'auto'
        });

        await sleep(1000);

        const remainingButtons =
            getRemoveButtons().length;

        const completed =
            removed >= expectedCount &&
            remainingButtons === 0;

        if (completed) {

            updatePanel({
                removed,
                remaining:0,
                status:'Complete',
                message:
                    `Complete! ${removed} targets were removed.`
            });

            setActionButton(
                'Deletion Complete',
                true,
                false
            );

            alert(
                `Deletion complete!\n\n` +
                `${removed} targets were removed.`
            );

        } else {

            updatePanel({
                removed,
                remaining:remainingButtons,
                status:'STOPPED',
                message:
                    `Stopped after removing ${removed} of approximately ${expectedCount} targets.`
            });

            setActionButton(
                'Deletion Stopped',
                true,
                false
            );

            alert(
                `Deletion stopped.\n\n` +
                `Targets removed: ${removed}\n` +
                `Targets still visible: ${remainingButtons}`
            );
        }

        processing = false;
    }

    // ------------------------------------------------------------
    // Main Workflow
    // ------------------------------------------------------------

    async function beginScan() {

        if (processing) {
            return;
        }

        processing = true;

        setActionButton(
            'Scanning Targets...',
            true,
            false
        );

        updatePanel({
            found:0,
            loaded:0,
            removed:0,
            remaining:0,
            status:'SCANNING',
            message:'Starting scan...'
        });

        const targets =
            await scanTargets();

        const targetCount =
            targets.size;

        updatePanel({
            found:targetCount,
            loaded:getRows().length,
            remaining:targetCount
        });

        if (targetCount === 0) {

            updatePanel({
                status:'COMPLETE',
                message:
                    'No targets were found.'
            });

            setActionButton(
                'No Targets Found',
                true,
                false
            );

            processing = false;
            return;
        }

        const firstConfirmed =
            await showFirstConfirmation(
                targetCount
            );

        if (!firstConfirmed) {

            updatePanel({
                status:'CANCELLED',
                remaining:targetCount,
                message:
                    'Deletion cancelled. No targets were removed.'
            });

            setActionButton(
                'Delete All Targets',
                false,
                false
            );

            processing = false;
            return;
        }

        const finalConfirmed =
            await showFinalConfirmation(
                targetCount
            );

        if (!finalConfirmed) {

            updatePanel({
                status:'CANCELLED',
                remaining:targetCount,
                message:
                    'Deletion cancelled. No targets were removed.'
            });

            setActionButton(
                'Delete All Targets',
                false,
                false
            );

            processing = false;
            return;
        }

        await deleteTargets(
            targetCount
        );
    }

    // ------------------------------------------------------------
    // Panel Watcher
    // ------------------------------------------------------------

    const observer =
        new MutationObserver(() => {

            if (
                !processing &&
                !document.getElementById(
                    PANEL_ID
                )
            ) {
                insertPanel();
            }
        });

    observer.observe(
        document.body,
        {
            childList:true,
            subtree:true
        }
    );

    // ------------------------------------------------------------
    // Initialize
    // ------------------------------------------------------------

    function initialize() {

        if (
            document.querySelector(
                'input[placeholder="Search targets list"]'
            )
        ) {

            insertPanel();
            return;
        }

        setTimeout(
            initialize,
            1000
        );
    }

    initialize();

})();
