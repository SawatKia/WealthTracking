//NOTE - Load the JSON data
document.addEventListener("DOMContentLoaded", function () {
  fetch("./checkedData.json")
    .then((response) => response.json())
    .then((data) => {
      Object.keys(data).forEach((key) => {
        const checkbox = document.getElementById(key);
        if (checkbox) {
          checkbox.checked = data[key];
        }
      });
      console.log("Checked data loaded successfully:", data);
    })
    .catch((error) => {
      console.error("Error loading checkedData.json:", error);
      const checkboxes = document.querySelectorAll("input[type='checkbox']");
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
      console.log("All keys set to false");
    });
});

//NOTE - Back to top button
//NOTE - need to place the script at the end of the body tag, so that the button is available in the DOM when the script runs
const backToTopButton = document.getElementById("backToTop");

window.onscroll = function () {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    backToTopButton.classList.add("visible");
  } else {
    backToTopButton.classList.remove("visible");
  }
};

backToTopButton.onclick = function () {
  // Add smooth scroll animation
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

//NOTE - Save button
function saveData() {
  console.log("Save button clicked");
  const checkboxes = document.querySelectorAll("input[type='checkbox']");
  const data = {};
  checkboxes.forEach((checkbox) => {
    data[checkbox.id] = checkbox.checked;
  });
  // Convert the data object to JSON string
  const jsonData = JSON.stringify(data);

  // Send the JSON data to the server to save it in a file
  // You can use AJAX or fetch to send the data to the server
  // Here, I'm using a simple console.log to simulate the server request
  console.log(jsonData);

  // Create a Blob object with the JSON data
  const blob = new Blob([jsonData], { type: "application/json" });

  // Create a temporary anchor element
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "checkedData.json";

  // Programmatically click the anchor element to trigger the download
  anchor.click();
}

function saveDiagram(topic, diagramId) {
  const diagramContainer = document.getElementById(diagramId).parentElement;
  let targetElement =
    diagramContainer.querySelector("svg") ||
    diagramContainer.querySelector("img");

  if (!targetElement) {
    console.error("No SVG or IMG element found for download");
    return;
  }

  // If it's an SVG element, convert it to PNG using dom-to-image
  if (targetElement.tagName.toLowerCase() === "svg") {
    const viewBox = targetElement.getAttribute("viewBox").split(" ");
    const width = parseInt(viewBox[2]);
    const height = parseInt(viewBox[3]);

    domtoimage
      .toPng(targetElement, {
        width: width,
        height: height,
      })
      .then(function (dataUrl) {
        const anchor = document.createElement("a");
        anchor.href = dataUrl;
        anchor.download = `${topic}_${diagramId}.png`;
        anchor.click();
      })
      .catch(function (error) {
        console.error("Error generating image:", error);
      });

    // If it's an IMG element, just download the image directly
  } else if (targetElement.tagName.toLowerCase() === "img") {
    const imgSrc = targetElement.src;
    const anchor = document.createElement("a");
    anchor.href = imgSrc;
    anchor.download = `${topic}_${diagramId}.png`;
    anchor.click();
  }
}

//NOTE - Toggle the menu
document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("menu-toggle");
  const fullMenu = document.querySelector(".full-menu");
  const compactMenu = document.querySelector(".compact-menu");
  const fullMenuAnchor = fullMenu.querySelectorAll("a");

  toggleButton.addEventListener("click", function () {
    fullMenu.classList.toggle("expanded");

    if (fullMenu.classList.contains("expanded")) {
      compactMenu.style.display = "none";
      toggleButton.textContent = "×";
    } else {
      compactMenu.style.display = "block";
      toggleButton.textContent = "☰";
    }
  });
  // Collapse full menu when any link inside the full menu is clicked
  fullMenuAnchor.forEach(function (link) {
    link.addEventListener("click", function () {
      fullMenu.classList.remove("expanded");
      compactMenu.style.display = "block";
      toggleButton.textContent = "☰"; // Change button back to menu icon
    });
  });
});

//NOTE - Load the Mermaid diagrams
document.addEventListener("DOMContentLoaded", async function () {
  // Initialize Mermaid
  mermaid.initialize({ startOnLoad: true });
  if (typeof mermaid !== "object") {
    console.error("Mermaid not loaded.");
  }
  console.log("Mermaid loaded successfully.");
  // Array of diagram paths, including fallback SVG paths
  const diagrams = [
    {
      no: 1,
      id: "softwareArchitectureDiagram",
      mmdPath: "../newClassesDesign/SoftwareArchitectureDiagram.mmd",
      loadingId: "loadingSoftwareArchitecture",
      svgPath: "../newClassesDesign/SoftwareArchitectureDiagram.svg",
    },
    {
      no: 2,
      id: "userFlowDiagram",
      mmdPath: "../newClassesDesign/UserFlow.mmd",
      loadingId: "loadingUserFlow",
      svgPath: "../newClassesDesign/UserFlow.svg",
    },
    {
      no: 3,
      id: "SimpilyfyDiagram",
      mmdPath: "../newClassesDesign/Simpilyfy.mmd",
      loadingId: "loadingSimpilyfy",
      svgPath: "../newClassesDesign/Simpilyfy.svg",
    },
    {
      no: 4,
      id: "UMLDiagram",
      mmdPath: "../newClassesDesign/Classes.mmd",
      loadingId: "loadingUML",
      svgPath: "../newClassesDesign/Classes.svg",
    },
    {
      no: 5,
      id: "userCreateDiagram",
      mmdPath: "../newClassesDesign/UserManagement/create.mmd",
      loadingId: "loadingUserCreate",
      svgPath: "../newClassesDesign/UserManagement/create.svg",
    },
    {
      no: 6,
      id: "userReadDiagram",
      mmdPath: "../newClassesDesign/UserManagement/read.mmd",
      loadingId: "loadingUserRead",
      svgPath: "../newClassesDesign/UserManagement/read.svg",
    },
    {
      no: 7,
      id: "userUpdateDiagram",
      mmdPath: "../newClassesDesign/UserManagement/update.mmd",
      loadingId: "loadingUserUpdate",
      svgPath: "../newClassesDesign/UserManagement/update.svg",
    },
    {
      no: 8,
      id: "userDeleteDiagram",
      mmdPath: "../newClassesDesign/UserManagement/delete.mmd",
      loadingId: "loadingUserDelete",
      svgPath: "../newClassesDesign/UserManagement/delete.svg",
    },
    {
      no: 9,
      id: "bankAddDiagram",
      mmdPath: "../newClassesDesign/BankAccountManagement/create.mmd",
      loadingId: "loadingBankAdd",
      svgPath: "../newClassesDesign/BankAccountManagement/create.svg",
    },
    {
      no: 10,
      id: "bankReadAllDiagram",
      mmdPath: "../newClassesDesign/BankAccountManagement/ReadAll.mmd",
      loadingId: "loadingBankReadAll",
      svgPath: "../newClassesDesign/BankAccountManagement/ReadAll.svg",
    },
    {
      no: 11,
      id: "bankReadOneDiagram",
      mmdPath: "../newClassesDesign/BankAccountManagement/ReadOne.mmd",
      loadingId: "loadingBankReadOne",
      svgPath: "../newClassesDesign/BankAccountManagement/ReadOne.svg",
    },
    {
      no: 12,
      id: "bankUpdateDiagram",
      mmdPath: "../newClassesDesign/BankAccountManagement/update.mmd",
      loadingId: "loadingBankUpdate",
      svgPath: "../newClassesDesign/BankAccountManagement/update.svg",
    },
    {
      no: 13,
      id: "bankDeleteDiagram",
      mmdPath: "../newClassesDesign/BankAccountManagement/Delete.mmd",
      loadingId: "loadingBankDelete",
      svgPath: "../newClassesDesign/BankAccountManagement/Delete.svg",
    },
    {
      no: 14,
      id: "IeCreateDiagram",
      mmdPath: "../newClassesDesign/IncomeExpenseManagement/IeCreate.mmd",
      loadingId: "loadingIeCreate",
      svgPath: "../newClassesDesign/IncomeExpenseManagement/IeCreate.svg",
    },
    {
      no: 15,
      id: "IeDeleteDiagram",
      mmdPath: "../newClassesDesign/IncomeExpenseManagement/IeDelete.mmd",
      loadingId: "loadingIeDelete",
      svgPath: "../newClassesDesign/IncomeExpenseManagement/IeDelete.svg",
    },
    {
      no: 16,
      id: "IeReadAllDiagram",
      mmdPath: "../newClassesDesign/IncomeExpenseManagement/IeReadAll.mmd",
      loadingId: "loadingIeReadAll",
      svgPath: "../newClassesDesign/IncomeExpenseManagement/IeReadAll.svg",
    },
    {
      no: 17,
      id: "IeReadOneDiagram",
      mmdPath: "../newClassesDesign/IncomeExpenseManagement/IeReadOne.mmd",
      loadingId: "loadingIeReadOne",
      svgPath: "../newClassesDesign/IncomeExpenseManagement/IeReadOne.svg",
    },
    {
      no: 18,
      id: "IeUpdateDiagram",
      mmdPath: "../newClassesDesign/IncomeExpenseManagement/IeUpdate.mmd",
      loadingId: "loadingIeUpdate",
      svgPath: "../newClassesDesign/IncomeExpenseManagement/IeUpdate.svg",
    },
    {
      no: 19,
      id: "debtCreateDiagram",
      mmdPath: "../newClassesDesign/DebtManagement/Create.mmd",
      loadingId: "loadingDebtCreate",
      svgPath: "../newClassesDesign/DebtManagement/Create.svg",
    },
    {
      no: 20,
      id: "debtReadAllDiagram",
      mmdPath: "../newClassesDesign/DebtManagement/ReadAll.mmd",
      loadingId: "loadingDebtReadAll",
      svgPath: "../newClassesDesign/DebtManagement/ReadAll.svg",
    },
    {
      no: 21,
      id: "debtReadOneDiagram",
      mmdPath: "../newClassesDesign/DebtManagement/ReadOne.mmd",
      loadingId: "loadingDebtReadOne",
      svgPath: "../newClassesDesign/DebtManagement/ReadOne.svg",
    },
    {
      no: 22,
      id: "debtUpdateDiagram",
      mmdPath: "../newClassesDesign/DebtManagement/Update.mmd",
      loadingId: "loadingDebtUpdate",
      svgPath: "../newClassesDesign/DebtManagement/Update.svg",
    },
    {
      no: 23,
      id: "debtDeleteDiagram",
      mmdPath: "../newClassesDesign/DebtManagement/Delete.mmd",
      loadingId: "loadingDebtDelete",
      svgPath: "../newClassesDesign/DebtManagement/Delete.svg",
    },
    {
      no: 24,
      id: "quotaCheckDiagram",
      mmdPath: "../newClassesDesign/api/QuotaCheck.mmd",
      loadingId: "loadingQuotaCheck",
      svgPath: "../newClassesDesign/api/QuotaCheck.svg",
    },
    {
      no: 25,
      id: "slipDataDiagram",
      mmdPath: "../newClassesDesign/api/SlipData.mmd",
      loadingId: "loadingSlipData",
      svgPath: "../newClassesDesign/api/SlipData.svg",
    },
  ];

  const totalDiagrams = diagrams.length;
  let loadedDiagrams = 0;

  // Show all loading indicators first
  diagrams.forEach((diagram) => {
    const skeleton = document.getElementById(diagram.loadingId);
    skeleton.style.display = "flex";
  });

  // Function to update loading progress
  function updateLoadingProgress(diagram) {
    const loadingText = document.getElementById("loadingText");
    const loadingBar = document.getElementById("loadingBar");
    const loadingProgress = document.getElementById("loadingProgress");
    loadedDiagrams++;

    // Calculate progress
    const progress = (loadedDiagrams / totalDiagrams) * 100;
    loadingBar.style.width = `${progress}%`;

    // Update loading text
    loadingText.textContent = `${Math.round(
      progress
    )}% [${loadedDiagrams}/${totalDiagrams}] ${diagram.id
      } loaded and rendered successfully.`;

    // Check if all diagrams are loaded
    if (loadedDiagrams === totalDiagrams) {
      // Ensure the progress bar reaches 100%
      loadingBar.style.width = "100%";
      loadingText.textContent =
        "100% All diagrams loaded and rendered successfully.";

      // Add a delay before starting the fade-out animation
      setTimeout(() => {
        loadingProgress.style.opacity = "0"; // Trigger the fade-out

        // After the opacity transition (1 second), hide the element
        setTimeout(() => {
          loadingProgress.style.display = "none";
        }, 1000); // Matches the CSS transition duration (1s)
      }, 500); // Delay before starting fade-out (500ms to show the final progress)
    }

    // Change the font weight of the loading text after 50% progress
    if (progress >= 50) {
      loadingText.style.fontWeight = 700;
    }
  }

  // Add a small delay before starting to load diagrams
  await new Promise((resolve) => setTimeout(resolve, 100));

  async function loadDiagram(diagram) {
    const skeleton = document.getElementById(diagram.loadingId);
    const container = document.getElementById(diagram.id);

    try {
      // First attempt: Try Mermaid rendering
      const mermaidResponse = await fetch(diagram.mmdPath);
      if (mermaidResponse.ok) {
        const text = await mermaidResponse.text();
        container.textContent = text;

        await mermaid.init(undefined, `#${diagram.id}`);
        const renderedSvg = container.querySelector('svg');

        if (renderedSvg) {
          console.log(`${diagram.no})${diagram.id} loaded and rendered successfully.`);
          return; // Exit if successful
        }
        console.warn(`${diagram.id}: Mermaid rendered but no SVG produced, trying SVG fallback`);
      }

      // Second attempt: SVG fallback
      const svgResponse = await fetch(diagram.svgPath);
      if (svgResponse.ok) {
        const svgText = await svgResponse.text();
        container.innerHTML = svgText; // Directly insert the SVG markup

        // Apply white background to the SVG (to match Mermaid rendered SVGs)
        const svg = container.querySelector('svg');
        if (svg) {
          svg.style.backgroundColor = '#ffffff';
        }

        console.log(`${diagram.id} successfully loaded using SVG fallback`);
        return; // Exit if successful
      }

      // If both attempts fail, throw error
      throw new Error("Both Mermaid and SVG fallback failed");

    } catch (error) {
      console.error(`Failed to load diagram ${diagram.id}:`, error);
      container.innerHTML = `<div class="error-message">Failed to load diagram. Please try refreshing the page.</div>`;

    } finally {
      skeleton.style.display = "none";
      updateLoadingProgress(diagram);
    }
  }

  // Create an array of promises for fetching diagrams
  const fetchPromises = diagrams.map(diagram => loadDiagram(diagram));

  // Execute all fetch requests simultaneously
  await Promise.all(fetchPromises);

  initZoomableDiagrams();
});

// NOTE - SVG zoomable with mobile fullscreen support
function initZoomableDiagrams() {
  const containers = document.querySelectorAll(".diagram-container");

  containers.forEach((container) => {
    const svg = container.querySelector("svg");
    const resetButton = container.querySelector(".reset-zoom");

    if (!svg) return;

    // Apply white background to the diagram
    svg.style.backgroundColor = "#ffffff";

    let viewBox = svg.viewBox.baseVal;
    let originalViewBox = {
      x: viewBox.x,
      y: viewBox.y,
      width: viewBox.width,
      height: viewBox.height,
    };

    let isPanning = false;
    let startPoint = { x: 0, y: 0 };
    let viewBoxStart = { x: 0, y: 0 };

    svg.addEventListener("wheel", onWheel);
    svg.addEventListener("mousedown", onMouseDown);
    svg.addEventListener("mousemove", onMouseMove);
    svg.addEventListener("mouseup", onMouseUp);
    svg.addEventListener("mouseleave", onMouseUp);

    resetButton.addEventListener("click", resetZoom);

    if (window.innerWidth <= 768) {
      // Adjust 768 to your desired breakpoint
      svg.addEventListener("click", enterFullscreen);
    }

    function onWheel(event) {
      event.preventDefault();

      const scaleFactor = event.deltaY > 0 ? 1.1 : 0.9;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;

      const startPoint = point.matrixTransform(svg.getScreenCTM().inverse());

      viewBox.x += (startPoint.x - viewBox.x) * (1 - scaleFactor);
      viewBox.y += (startPoint.y - viewBox.y) * (1 - scaleFactor);
      viewBox.width *= scaleFactor;
      viewBox.height *= scaleFactor;

      svg.setAttribute(
        "viewBox",
        `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
      );
    }

    function onMouseDown(event) {
      isPanning = true;
      startPoint = { x: event.clientX, y: event.clientY };
      viewBoxStart = { x: viewBox.x, y: viewBox.y };
    }

    function onMouseMove(event) {
      if (!isPanning) return;

      const dx =
        ((event.clientX - startPoint.x) * viewBox.width) / svg.clientWidth;
      const dy =
        ((event.clientY - startPoint.y) * viewBox.height) / svg.clientHeight;

      viewBox.x = viewBoxStart.x - dx;
      viewBox.y = viewBoxStart.y - dy;

      svg.setAttribute(
        "viewBox",
        `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
      );
    }

    function onMouseUp() {
      isPanning = false;
    }

    function resetZoom() {
      viewBox.x = originalViewBox.x;
      viewBox.y = originalViewBox.y;
      viewBox.width = originalViewBox.width;
      viewBox.height = originalViewBox.height;
      svg.setAttribute(
        "viewBox",
        `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
      );
    }

    function enterFullscreen() {
      const fullscreenOverlay = document.createElement("div");
      fullscreenOverlay.classList.add("fullscreen-overlay");

      const fullscreenSvg = svg.cloneNode(true);
      fullscreenSvg.setAttribute(
        "viewBox",
        `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
      );
      fullscreenSvg.style.backgroundColor = "#ffffff"; // Set white background

      const closeButton = document.createElement("button");
      closeButton.classList.add("close-fullscreen");
      closeButton.innerText = "Close";

      fullscreenOverlay.appendChild(fullscreenSvg);
      fullscreenOverlay.appendChild(closeButton);
      document.body.appendChild(fullscreenOverlay);

      closeButton.addEventListener("click", () => {
        document.body.removeChild(fullscreenOverlay);
      });

      fullscreenOverlay.addEventListener("click", (e) => {
        if (e.target === fullscreenOverlay) {
          document.body.removeChild(fullscreenOverlay);
        }
      });

      initZoomableDiagrams(); // Reinitialize zoom for the fullscreen SVG
    }
  });
}
