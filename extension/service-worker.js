const MENU_ID =
  "jobshield-analyze-selection";


async function configureExtension() {
  try {
    await chrome.sidePanel
      .setPanelBehavior({
        openPanelOnActionClick:
          true,
      });
  } catch (error) {
    console.error(
      "Could not configure side panel:",
      error,
    );
  }


  /* Don't expose the bearer token to content-script contexts. */
  try {
    await chrome.storage.local
      .setAccessLevel({
        accessLevel:
          "TRUSTED_CONTEXTS",
      });
  } catch (error) {
    console.error(
      "Could not restrict storage access:",
      error,
    );
  }
}


chrome.runtime.onInstalled.addListener(
  async () => {
    await configureExtension();


    chrome.contextMenus.removeAll(
      () => {
        chrome.contextMenus.create({
          id:
            MENU_ID,

          title:
            "Analyze selection with JobShield",

          contexts: [
            "selection",
          ],
        });
      },
    );
  },
);


chrome.runtime.onStartup.addListener(
  configureExtension,
);


/* Also configure immediately whenever the service worker starts. */
configureExtension();


chrome.contextMenus.onClicked.addListener(
  (
    info,
    tab,
  ) => {
    if (
      info.menuItemId !==
      MENU_ID
    ) {
      return;
    }


    const originalText =
      (
        info.selectionText ??
        ""
      ).trim();


    if (!originalText) {
      return;
    }


    const truncated =
      originalText.length >
      50_000;


    const text =
      originalText.slice(
        0,
        50_000,
      );


    let sourceHost =
      null;


    try {
      if (info.pageUrl) {
        sourceHost =
          new URL(
            info.pageUrl,
          ).hostname;
      }
    } catch {
      sourceHost =
        null;
    }


    /*
     * IMPORTANT:
     *
     * Open the side panel immediately while
     * it is still inside the context-menu
     * user gesture.
     *
     * Do NOT await storage before this.
     */
    if (tab?.id) {
      chrome.sidePanel
        .open({
          tabId:
            tab.id,
        })
        .catch(
          (error) => {
            console.error(
              "Could not open JobShield side panel:",
              error,
            );
          },
        );
    } else if (
      tab?.windowId
    ) {
      chrome.sidePanel
        .open({
          windowId:
            tab.windowId,
        })
        .catch(
          (error) => {
            console.error(
              "Could not open JobShield side panel:",
              error,
            );
          },
        );
    }


    /*
     * Save the selected text separately.
     *
     * If the panel loads first, sidepanel.js
     * already has a storage change listener.
     *
     * If storage finishes first, the panel
     * reads the pending selection when it loads.
     */
    chrome.storage.session
      .set({
        jobshieldPendingSelection: {
          text,

          sourceHost,

          truncated,

          receivedAt:
            Date.now(),
        },
      })
      .catch(
        (error) => {
          console.error(
            "Could not store JobShield selection:",
            error,
          );
        },
      );
  },
);

chrome.runtime.onMessage.addListener(
  (
    message,
    sender,
    sendResponse,
  ) => {
    if (
      message?.type !==
      "JOBSHIELD_START_AREA_SELECTION"
    ) {
      return;
    }


    void (
      async () => {
        try {
          const tabId =
            message.tabId;


          if (
            typeof tabId !==
            "number"
          ) {
            throw new Error(
              "A valid browser tab was not provided.",
            );
          }


          if (
            !chrome.scripting ||
            typeof chrome.scripting
              .executeScript !==
              "function"
          ) {
            throw new Error(
              "The JobShield scripting permission is unavailable. Reload the extension from brave://extensions.",
            );
          }


          await chrome.scripting
            .executeScript({
              target: {
                tabId,
              },

              files: [
                "area-selector.js",
              ],
            });


          sendResponse({
            ok:
              true,
          });
        } catch (error) {
          console.error(
            "JobShield area-selector injection failed:",
            error,
          );


          sendResponse({
            ok:
              false,

            error:
              error instanceof Error
                ? error.message
                : "Could not start area selection.",
          });
        }
      }
    )();

    /* Keep the message channel alive while executeScript() is awaiting. */
    return true;
  },
);