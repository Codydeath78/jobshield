const connection =
  document.getElementById(
    "connection",
  );

const analyzer =
  document.getElementById(
    "analyzer",
  );

const baseUrlInput =
  document.getElementById(
    "base-url",
  );

const tokenInput =
  document.getElementById(
    "token",
  );

const saveConnectionButton =
  document.getElementById(
    "save-connection",
  );

const connectionError =
  document.getElementById(
    "connection-error",
  );

const input =
  document.getElementById(
    "input",
  );

const analyzeButton =
  document.getElementById(
    "analyze",
  );

const selectionNote =
  document.getElementById(
    "selection-note",
  );

const loading =
  document.getElementById(
    "loading",
  );

const resultElement =
  document.getElementById(
    "result",
  );

const riskLevel =
  document.getElementById(
    "risk-level",
  );

const riskScore =
  document.getElementById(
    "risk-score",
  );

const summary =
  document.getElementById(
    "summary",
  );

const findings =
  document.getElementById(
    "findings",
  );

const openReportButton =
  document.getElementById(
    "open-report",
  );

const disconnectButton =
  document.getElementById(
    "disconnect",
  );

const selectAreaButton =
  document.getElementById(
    "select-area",
  );


const captureNote =
  document.getElementById(
    "capture-note",
  );


const capturePreview =
  document.getElementById(
    "capture-preview",
  );


const captureImage =
  document.getElementById(
    "capture-image",
  );


const captureMeta =
  document.getElementById(
    "capture-meta",
  );


const retakeAreaButton =
  document.getElementById(
    "retake-area",
  );


const analyzeAreaButton =
  document.getElementById(
    "analyze-area",
  );


let croppedScreenshotBlob =
  null;


let croppedScreenshotUrl =
  null;


let currentReportPath =
  null;

let currentSourceHost =
  null;

let currentCaptureSourceHost =
  null;

let currentCaptureWidth =
  null;


let currentCaptureHeight =
  null;


function normalizeBaseUrl(
  value,
) {
  return value
    .trim()
    .replace(
      /\/+$/,
      "",
    );
}


async function getConfiguration() {
  const data =
    await chrome.storage.local.get([
      "jobshieldBaseUrl",
      "jobshieldToken",
    ]);


  return {
    baseUrl:
      data.jobshieldBaseUrl ??
      "http://localhost:3000",

    token:
      data.jobshieldToken ??
      "",
  };
}


async function updateConnectionUi() {
  const config =
    await getConfiguration();


  baseUrlInput.value =
    config.baseUrl;


  if (config.token) {
    connection.classList.add(
      "hidden",
    );

    analyzer.classList.remove(
      "hidden",
    );


    await consumePendingSelection();
  } else {
    connection.classList.remove(
      "hidden",
    );

    analyzer.classList.add(
      "hidden",
    );
  }
}


saveConnectionButton.addEventListener(
  "click",
  async () => {
    connectionError.textContent =
      "";


    const baseUrl =
      normalizeBaseUrl(
        baseUrlInput.value,
      );


    const token =
      tokenInput.value
        .trim();


    if (
      !/^https?:\/\//i.test(
        baseUrl,
      )
    ) {
      connectionError.textContent =
        "Enter a valid JobShield URL.";

      return;
    }


    if (
      !/^[A-Za-z0-9_-]{43}$/.test(
        token,
      )
    ) {
      connectionError.textContent =
        "The extension token is invalid.";

      return;
    }


    await chrome.storage.local.set({
      jobshieldBaseUrl:
        baseUrl,

      jobshieldToken:
        token,
    });


    tokenInput.value =
      "";


    await updateConnectionUi();
  },
);


disconnectButton.addEventListener(
  "click",
  async () => {
    await chrome.storage.local.remove([
      "jobshieldToken",
    ]);


    resultElement.classList.add(
      "hidden",
    );


    await updateConnectionUi();
  },
);


async function analyzeText(
  text,
  sourceHost =
    null,
) {
  const trimmed =
    text.trim();


  if (
    trimmed.length <
    10
  ) {
    selectionNote.textContent =
      "Select or enter at least 10 characters.";

    return;
  }


  const config =
    await getConfiguration();


  if (!config.token) {
    await updateConnectionUi();

    return;
  }


  analyzeButton.disabled =
    true;

  analyzeButton.textContent =
  "Analyzing...";

  loading.classList.remove(
    "hidden",
  );

  resultElement.classList.add(
    "hidden",
  );

  selectionNote.textContent =
    "";


  try {
    const response =
      await fetch(
        `${config.baseUrl}/api/extension/analyze`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${config.token}`,
          },

          body:
            JSON.stringify({
              input:
                trimmed,

              sourceHost,
            }),
        },
      );


    const data =
      await response.json();


    if (!response.ok) {
      if (
        response.status ===
        401
      ) {
        await chrome.storage.local.remove([
          "jobshieldToken",
        ]);

        throw new Error(
          "This extension connection is invalid or has been revoked. Generate a new token in JobShield.",
        );
      }


      throw new Error(
        data.error ||
        "Analysis failed.",
      );
    }


    currentReportPath =
      data.reportPath;


    renderResult(
      data,
    );
  } catch (error) {
    selectionNote.textContent =
      error instanceof Error
        ? error.message
        : "Could not analyze this selection.";
  } finally {
    analyzeButton.disabled =
      false;

    analyzeButton.innerHTML =
  `
    <span class="button-icon">
      ✦
    </span>
    Analyze with JobShield
  `;

    loading.classList.add(
      "hidden",
    );
  }
}

async function analyzeSelectedArea() {
  if (!croppedScreenshotBlob) {
    captureNote.textContent =
      "Select an area before analyzing it.";

    return;
  }


  const config =
    await getConfiguration();


  if (!config.token) {
    await updateConnectionUi();

    return;
  }


  analyzeAreaButton.disabled =
    true;


  retakeAreaButton.disabled =
    true;


  analyzeAreaButton.textContent =
    "Analyzing...";


  loading.classList.remove(
    "hidden",
  );


  resultElement.classList.add(
    "hidden",
  );


  captureNote.textContent =
    "Analyzing only the selected region...";


  try {
    const formData =
      new FormData();


    /*
     * This is ONLY the cropped PNG.
     * The temporary full viewport capture is
     * never appended or uploaded.
     */
    formData.append(
      "screenshot",
      croppedScreenshotBlob,
      "jobshield-browser-region.png",
    );


    if (
      currentCaptureSourceHost
    ) {
      formData.append(
        "sourceHost",
        currentCaptureSourceHost,
      );
    }

    if (
      Number.isFinite(
        currentCaptureWidth,
    )
    ) {
      formData.append(
        "captureWidth",
        String(
          currentCaptureWidth,
        ),
      );
    }


    if (
      Number.isFinite(
        currentCaptureHeight,
    )
    ) {
      formData.append(
        "captureHeight",
        String(
          currentCaptureHeight,
        ),
      );
    }

    const response =
      await fetch(
        `${config.baseUrl}/api/extension/analyze-screenshot`,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${config.token}`,
          },

          body:
            formData,
        },
      );


    const responseText =
      await response.text();


    let data;


    try {
      data =
        responseText
          ? JSON.parse(
              responseText,
            )
          : {};
    } catch {
      throw new Error(
        `JobShield returned an invalid response (${response.status}).`,
      );
    }


    if (!response.ok) {
      if (
        response.status ===
        401
      ) {
        await chrome.storage.local.remove([
          "jobshieldToken",
        ]);


        throw new Error(
          "This extension connection is invalid or has been revoked. Generate a new token in JobShield.",
        );
      }


      throw new Error(
        data.error ||
        "Screenshot analysis failed.",
      );
    }


    currentReportPath =
      data.reportPath;


    renderResult(
      data,
    );


    captureNote.textContent =
      "Selected region analyzed successfully.";
  } catch (error) {
    console.error(
      "Selected-area analysis failed:",
      error,
    );


    captureNote.textContent =
      error instanceof Error
        ? error.message
        : "Could not analyze the selected region.";
  } finally {
    analyzeAreaButton.disabled =
      !croppedScreenshotBlob;


    retakeAreaButton.disabled =
      false;


    analyzeAreaButton.textContent =
      "Analyze Selected Area";


    loading.classList.add(
      "hidden",
    );
  }
}


function renderResult(
  data,
) {

  const normalizedRisk =
  String(
    data.riskLevel ??
    "low",
  )
    .toLowerCase();


resultElement.classList.remove(
  "risk-low",
  "risk-medium",
  "risk-high",
  "risk-critical",
);


if (
  [
    "low",
    "medium",
    "high",
    "critical",
  ].includes(
    normalizedRisk,
  )
) {
  resultElement.classList.add(
    `risk-${normalizedRisk}`,
  );
}


  riskLevel.textContent =
    `${String(
      data.riskLevel ??
      "unknown",
    ).toUpperCase()} RISK`;


  riskScore.textContent =
    `${data.riskScore ?? 0}/100`;


  summary.textContent =
    data.summary ??
    "No summary available.";


  findings.replaceChildren();


  const topFindings =
    Array.isArray(
      data.topFindings,
    )
      ? data.topFindings
      : [];


  if (
    topFindings.length ===
    0
  ) {
    const paragraph =
      document.createElement(
        "p",
      );


    paragraph.className =
      "muted small";


    paragraph.textContent =
      "No warning findings were produced by the available signals. This does not establish that the opportunity is legitimate.";


    findings.appendChild(
      paragraph,
    );
  }


  for (
    const finding
    of topFindings
  ) {
    const container =
      document.createElement(
        "div",
      );


    container.className =
      "finding";


    const title =
      document.createElement(
        "p",
      );


    title.className =
      "finding-title";


    /*
     * textContent is deliberate.
     * Never inject analysis text using innerHTML. */
    title.textContent =
      finding.title;


    const meta =
      document.createElement(
        "p",
      );


    meta.className =
      "finding-meta";


    meta.textContent =
      `${finding.severity} · ${finding.source}`;


    const description =
      document.createElement(
        "p",
      );


    description.className =
      "finding-description";


    description.textContent =
      finding.explanation;


    container.append(
      title,
      meta,
      description,
    );


    findings.appendChild(
      container,
    );
  }


  resultElement.classList.remove(
    "hidden",
  );
}


analyzeButton.addEventListener(
  "click",
  () => {
    analyzeText(
      input.value,
      currentSourceHost,
    );
  },
);

analyzeAreaButton.addEventListener(
  "click",
  analyzeSelectedArea,
);


openReportButton.addEventListener(
  "click",
  async () => {
    if (
      !currentReportPath
    ) {
      return;
    }


    const config =
      await getConfiguration();


    await chrome.tabs.create({
      url:
        `${config.baseUrl}${currentReportPath}`,
    });
  },
);

async function startAreaSelection() {
  captureNote.textContent =
    "";


  try {
    const [
      tab,
    ] =
      await chrome.tabs.query({
        active:
          true,

        currentWindow:
          true,
      });


    if (
      !tab ||
      typeof tab.id !==
        "number"
    ) {
      throw new Error(
        "Could not find the active browser tab.",
      );
    }


    const tabUrl =
      tab.url ??
      "";


    /* Browser-owned pages cannot accept injected extension scripts. */
    const blockedSchemes = [
      "chrome://",
      "brave://",
      "edge://",
      "about:",
      "chrome-extension://",
      "devtools://",
    ];


    if (
      blockedSchemes.some(
        (
          scheme,
        ) =>
          tabUrl.startsWith(
            scheme,
          ),
      )
    ) {
      throw new Error(
        "JobShield cannot capture browser settings or other browser-owned pages. Open a normal website and try again.",
      );
    }


    let url;


    try {
      url =
        new URL(
          tabUrl,
        );
    } catch {
      throw new Error(
        "JobShield could not determine this page's website address.",
      );
    }


    if (
      url.protocol !==
        "http:" &&
      url.protocol !==
        "https:"
    ) {
      throw new Error(
        "Screenshot selection is available only on normal HTTP or HTTPS webpages.",
      );
    }

    const originPattern =
      `${url.origin}/*`;


    /* Check whether JobShield already has permission for this specific website. */
    let hasHostAccess =
      await chrome.permissions
        .contains({
          origins: [
            originPattern,
          ],
        });


    /* If not, ask only for THIS site's origin rather than all websites. */
    if (!hasHostAccess) {
      captureNote.textContent =
        `JobShield needs permission to select an area on ${url.hostname}.`;


      const granted =
        await chrome.permissions
          .request({
            origins: [
              originPattern,
            ],
          });


      if (!granted) {
        throw new Error(
          `Permission to access ${url.hostname} was not granted.`,
        );
      }


      hasHostAccess =
        true;
    }


    if (!hasHostAccess) {
      throw new Error(
        "JobShield does not have permission to access this webpage.",
      );
    }


    captureNote.textContent =
      "Drag around the suspicious content on the page. Press Esc to cancel.";


    const response =
      await chrome.runtime
        .sendMessage({
          type:
            "JOBSHIELD_START_AREA_SELECTION",

          tabId:
            tab.id,
        });


    if (
      !response?.ok
    ) {
      throw new Error(
        response?.error ||
        "Could not start area selection.",
      );
    }
  } catch (error) {
    console.error(
      "Could not start area selection:",
      error,
    );


    captureNote.textContent =
      error instanceof Error
        ? error.message
        : "Could not start area selection.";
  }
}

selectAreaButton.addEventListener(
  "click",
  startAreaSelection,
);


retakeAreaButton.addEventListener(
  "click",
  async () => {
    if (
      croppedScreenshotUrl
    ) {
      URL.revokeObjectURL(
        croppedScreenshotUrl,
      );
    }


    croppedScreenshotUrl =
      null;

    croppedScreenshotBlob =
      null;

    currentCaptureWidth =
      null;

    currentCaptureHeight =
      null;

    currentCaptureSourceHost =
      null;


    captureImage.removeAttribute(
      "src",
    );


    capturePreview.classList.add(
      "hidden",
    );


    await startAreaSelection();
  },
);

async function cropScreenshot(
  fullCaptureDataUrl,
  selectedArea,
) {
  const response =
    await fetch(
      fullCaptureDataUrl,
    );


  const fullBlob =
    await response.blob();


  const bitmap =
    await createImageBitmap(
      fullBlob,
    );


  try {
    const scaleX =
      bitmap.width /
      selectedArea.viewportWidth;


    const scaleY =
      bitmap.height /
      selectedArea.viewportHeight;


    const sourceX =
      Math.max(
        0,
        Math.round(
          selectedArea.x *
          scaleX,
        ),
      );


    const sourceY =
      Math.max(
        0,
        Math.round(
          selectedArea.y *
          scaleY,
        ),
      );


    const sourceWidth =
      Math.min(
        bitmap.width -
          sourceX,

        Math.max(
          1,
          Math.round(
            selectedArea.width *
            scaleX,
          ),
        ),
      );


    const sourceHeight =
      Math.min(
        bitmap.height -
          sourceY,

        Math.max(
          1,
          Math.round(
            selectedArea.height *
            scaleY,
          ),
        ),
      );


    const canvas =
      document.createElement(
        "canvas",
      );


    canvas.width =
      sourceWidth;


    canvas.height =
      sourceHeight;


    const context =
      canvas.getContext(
        "2d",
        {
          alpha:
            false,
        },
      );


    if (!context) {
      throw new Error(
        "Could not prepare screenshot crop.",
      );
    }


    context.drawImage(
      bitmap,

      sourceX,
      sourceY,

      sourceWidth,
      sourceHeight,

      0,
      0,

      sourceWidth,
      sourceHeight,
    );


    const croppedBlob =
      await new Promise(
        (
          resolve,
          reject,
        ) => {
          canvas.toBlob(
            (
              blob,
            ) => {
              if (!blob) {
                reject(
                  new Error(
                    "Could not create cropped screenshot.",
                  ),
                );

                return;
              }


              resolve(
                blob,
              );
            },

            "image/png",
          );
        },
      );


    return {
      blob:
        croppedBlob,

      width:
        sourceWidth,

      height:
        sourceHeight,
    };
  } finally {
    bitmap.close();
  }
}

chrome.runtime.onMessage.addListener(
  (
    message,
    sender,
  ) => {
    if (
      message?.type ===
      "JOBSHIELD_AREA_CANCELLED"
    ) {
      captureNote.textContent =
        "Area selection cancelled.";

      return;
    }


    if (
      message?.type !==
      "JOBSHIELD_AREA_SELECTED"
    ) {
      return;
    }


    void handleSelectedArea(
      message.selection,
      sender.tab,
    );
  },
);

async function handleSelectedArea(
  selectedArea,
  sourceTab,
) {
  captureNote.textContent =
    "Preparing selected area...";


  try {
    if (
      !sourceTab ||
      typeof sourceTab.id !==
        "number" ||
      typeof sourceTab.windowId !==
        "number"
    ) {
      throw new Error(
        "Could not identify the source tab.",
      );
    }


    try {
  currentCaptureSourceHost =
    sourceTab.url
      ? new URL(
          sourceTab.url,
        ).hostname
      : null;
} catch {
  currentCaptureSourceHost =
    null;
}


    const [
      activeTab,
    ] =
      await chrome.tabs.query({
        active:
          true,

        windowId:
          sourceTab.windowId,
      });


    if (
      !activeTab ||
      activeTab.id !==
        sourceTab.id
    ) {
      throw new Error(
        "The selected browser tab changed before the screenshot could be captured. Try again.",
      );
    }


    /*
     * Chromium captures the current viewport
     * locally. We immediately crop this result
     * and do not upload/store the full image.
     */
    const fullCapture =
      await chrome.tabs
        .captureVisibleTab(
          sourceTab.windowId,
          {
            format:
              "png",
          },
        );


    const cropped =
      await cropScreenshot(
        fullCapture,
        selectedArea,
      );


    if (
      cropped.blob.size >
      8 *
        1024 *
        1024
    ) {
      throw new Error(
        "The selected region exceeds JobShield's 8 MB screenshot limit. Select a smaller area.",
      );
    }


    if (
      croppedScreenshotUrl
    ) {
      URL.revokeObjectURL(
        croppedScreenshotUrl,
      );
    }


    croppedScreenshotBlob =
      cropped.blob;

    currentCaptureWidth =
      cropped.width;


    currentCaptureHeight =
      cropped.height;

    croppedScreenshotUrl =
      URL.createObjectURL(
        cropped.blob,
      );


    captureImage.src =
      croppedScreenshotUrl;


    captureMeta.textContent =
      `${cropped.width} × ${cropped.height} · ${(
        cropped.blob.size /
        1024
      ).toFixed(
        0,
      )} KB`;


    capturePreview.classList.remove(
      "hidden",
    );


    captureNote.textContent =
      "Selection captured. Review the cropped image before analyzing it.";


    /* Enabled in checkpoint B when the screenshot-analysis API is connected. */
    analyzeAreaButton.disabled =
      false;
  } catch (error) {
    console.error(
      "Area capture failed:",
      error,
    );


    captureNote.textContent =
      error instanceof Error
        ? error.message
        : "Could not capture the selected area.";
  }
}


async function consumePendingSelection() {
  const data =
    await chrome.storage.session.get(
      "jobshieldPendingSelection",
    );


  const pending =
    data.jobshieldPendingSelection;


  if (!pending) {
    return;
  }


  /* Once read, remove it so reopening the panel doesn't re-run the analysis. */
  await chrome.storage.session.remove(
    "jobshieldPendingSelection",
  );


  input.value =
    pending.text ??
    "";


  currentSourceHost =
    pending.sourceHost ??
    null;


  if (
    pending.truncated
  ) {
    selectionNote.textContent =
      "The original selection exceeded 50,000 characters and was truncated.";
  }


  await analyzeText(
    input.value,
    currentSourceHost,
  );
}


chrome.storage.onChanged.addListener(
  async (
    changes,
    areaName,
  ) => {
    if (
      areaName ===
        "session" &&
      changes
        .jobshieldPendingSelection
        ?.newValue
    ) {
      await consumePendingSelection();
    }
  },
);


updateConnectionUi();