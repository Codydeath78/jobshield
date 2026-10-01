(() => {
  if (
    window.__jobshieldAreaSelectorActive
  ) {
    return;
  }


  window.__jobshieldAreaSelectorActive =
    true;


  const MIN_SELECTION_SIZE =
    24;


  let startX =
    0;

  let startY =
    0;

  let selecting =
    false;


  const overlay =
    document.createElement(
      "div",
    );


  overlay.id =
    "jobshield-area-selector-overlay";


  Object.assign(
    overlay.style,
    {
      position:
        "fixed",

      inset:
        "0",

      zIndex:
        "2147483647",

      cursor:
        "crosshair",

      background:
        "rgba(0, 0, 0, 0.28)",

      userSelect:
        "none",

      touchAction:
        "none",
    },
  );


  const selection =
    document.createElement(
      "div",
    );


  Object.assign(
    selection.style,
    {
      position:
        "fixed",

      display:
        "none",

      border:
        "2px solid #8b5cf6",

      borderRadius:
        "8px",

      background:
        "rgba(124, 92, 255, 0.08)",

      boxShadow:
        [
          "0 0 0 99999px rgba(0, 0, 0, 0.48)",
          "0 0 24px rgba(124, 92, 255, 0.55)",
        ].join(
          ", ",
        ),

      pointerEvents:
        "none",
    },
  );


  const instructions =
    document.createElement(
      "div",
    );


  instructions.textContent =
    "JobShield — drag around the suspicious content · Esc to cancel";


  Object.assign(
    instructions.style,
    {
      position:
        "fixed",

      top:
        "20px",

      left:
        "50%",

      transform:
        "translateX(-50%)",

      maxWidth:
        "calc(100vw - 40px)",

      padding:
        "11px 16px",

      border:
        "1px solid rgba(255,255,255,0.18)",

      borderRadius:
        "12px",

      background:
        "rgba(8, 9, 13, 0.94)",

      boxShadow:
        "0 14px 40px rgba(0,0,0,0.45)",

      color:
        "#ffffff",

      fontFamily:
        [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ].join(
          ", ",
        ),

      fontSize:
        "13px",

      fontWeight:
        "650",

      lineHeight:
        "1.4",

      textAlign:
        "center",

      pointerEvents:
        "none",
    },
  );


  overlay.append(
    selection,
    instructions,
  );


  document.documentElement.appendChild(
    overlay,
  );


  function cleanup() {
    overlay.remove();


    window.__jobshieldAreaSelectorActive =
      false;


    window.removeEventListener(
      "keydown",
      onKeyDown,
      true,
    );
  }


  function cancel() {
    cleanup();


    chrome.runtime
      .sendMessage({
        type:
          "JOBSHIELD_AREA_CANCELLED",
      })
      .catch(
        () => {},
      );
  }


  function onKeyDown(
    event,
  ) {
    if (
      event.key ===
      "Escape"
    ) {
      event.preventDefault();
      event.stopPropagation();

      cancel();
    }
  }


  window.addEventListener(
    "keydown",
    onKeyDown,
    true,
  );


  overlay.addEventListener(
    "mousedown",
    (
      event,
    ) => {
      if (
        event.button !==
        0
      ) {
        return;
      }


      event.preventDefault();


      selecting =
        true;


      startX =
        event.clientX;

      startY =
        event.clientY;


      selection.style.display =
        "block";


      selection.style.left =
        `${startX}px`;

      selection.style.top =
        `${startY}px`;

      selection.style.width =
        "0px";

      selection.style.height =
        "0px";
    },
    true,
  );


  overlay.addEventListener(
    "mousemove",
    (
      event,
    ) => {
      if (!selecting) {
        return;
      }


      event.preventDefault();


      const currentX =
        event.clientX;

      const currentY =
        event.clientY;


      const left =
        Math.min(
          startX,
          currentX,
        );

      const top =
        Math.min(
          startY,
          currentY,
        );

      const width =
        Math.abs(
          currentX -
          startX,
        );

      const height =
        Math.abs(
          currentY -
          startY,
        );


      selection.style.left =
        `${left}px`;

      selection.style.top =
        `${top}px`;

      selection.style.width =
        `${width}px`;

      selection.style.height =
        `${height}px`;
    },
    true,
  );


  overlay.addEventListener(
    "mouseup",
    (
      event,
    ) => {
      if (
        !selecting ||
        event.button !==
          0
      ) {
        return;
      }


      event.preventDefault();


      selecting =
        false;


      const endX =
        event.clientX;

      const endY =
        event.clientY;


      const x =
        Math.max(
          0,
          Math.min(
            startX,
            endX,
          ),
        );

      const y =
        Math.max(
          0,
          Math.min(
            startY,
            endY,
          ),
        );

      const width =
        Math.min(
          window.innerWidth -
            x,

          Math.abs(
            endX -
            startX,
          ),
        );

      const height =
        Math.min(
          window.innerHeight -
            y,

          Math.abs(
            endY -
            startY,
          ),
        );


      if (
        width <
          MIN_SELECTION_SIZE ||
        height <
          MIN_SELECTION_SIZE
      ) {
        selection.style.display =
          "none";

        return;
      }


      const payload = {
        type:
          "JOBSHIELD_AREA_SELECTED",

        selection: {
          x,
          y,
          width,
          height,

          /*
           * We use the actual captured image
           * dimensions later to calculate scale.
           *
           * This is safer than assuming
           * devicePixelRatio because browser zoom
           * and display scaling can differ.
           */
          viewportWidth:
            window.innerWidth,

          viewportHeight:
            window.innerHeight,
        },
      };


      /* Remove JobShield's overlay BEFORE the screenshot is captured. */
      cleanup();


      /* Give the browser two paint frames to remove our overlay completely. */
      requestAnimationFrame(
        () => {
          requestAnimationFrame(
            () => {
              chrome.runtime
                .sendMessage(
                  payload,
                )
                .catch(
                  () => {},
                );
            },
          );
        },
      );
    },
    true,
  );
})();