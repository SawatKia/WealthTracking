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
  mermaid.initialize({ startOnLoad: false });
  if (typeof mermaid !== "object") {
    console.error("Mermaid not loaded.");
  }
  console.log("Mermaid loaded successfully.");

  // Array of diagram paths, including fallback SVG paths
  const diagrams = [
    {
      id: "softwareArchitectureDiagram",
      mmdPath: "../newClassesDesign/SoftwareArchitectureDiagram.mmd",
      loadingId: "loadingSoftwareArchitecture",
      svgPath: "../newClassesDesign/SoftwareArchitectureDiagram.svg",
    },
    {
      id: "userFlowDiagram",
      mmdPath: "../newClassesDesign/UserFlow.mmd",
      loadingId: "loadingUserFlow",
      svgPath: "../newClassesDesign/UserFlow.svg",
    },
    {
      id: "userCreateDiagram",
      mmdPath: "../newClassesDesign/UserManagement/create.mmd",
      loadingId: "loadingUserCreate",
      svgPath: "../newClassesDesign/UserManagement/create.svg",
    },
    {
      id: "userReadDiagram",
      mmdPath: "../newClassesDesign/UserManagement/read.mmd",
      loadingId: "loadingUserRead",
      svgPath: "../newClassesDesign/UserManagement/read.svg",
    },
    {
      id: "userUpdateDiagram",
      mmdPath: "../newClassesDesign/UserManagement/update.mmd",
      loadingId: "loadingUserUpdate",
      svgPath: "../newClassesDesign/UserManagement/update.svg",
    },
    {
      id: "userDeleteDiagram",
      mmdPath: "../newClassesDesign/UserManagement/delete.mmd",
      loadingId: "loadingUserDelete",
      svgPath: "../newClassesDesign/UserManagement/delete.svg",
    },
    {
      id: "bankAddDiagram",
      mmdPath: "../newClassesDesign/BankAccountManagement/add.mmd",
      loadingId: "loadingBankAdd",
      svgPath: "../newClassesDesign/BankAccountManagement/add.svg",
    },
    {
      id: "bankReadAllDiagram",
      mmdPath: "../newClassesDesign/BankAccountManagement/ReadAll.mmd",
      loadingId: "loadingBankReadAll",
      svgPath: "../newClassesDesign/BankAccountManagement/ReadAll.svg",
    },
    {
      id: "bankReadOneDiagram",
      mmdPath: "../newClassesDesign/BankAccountManagement/ReadOne.mmd",
      loadingId: "loadingBankReadOne",
      svgPath: "../newClassesDesign/BankAccountManagement/ReadOne.svg",
    },
    {
      id: "bankUpdateDiagram",
      mmdPath: "../newClassesDesign/BankAccountManagement/update.mmd",
      loadingId: "loadingBankUpdate",
      svgPath: "../newClassesDesign/BankAccountManagement/update.svg",
    },
    {
      id: "bankDeleteDiagram",
      mmdPath: "../newClassesDesign/BankAccountManagement/Delete.mmd",
      loadingId: "loadingBankDelete",
      svgPath: "../newClassesDesign/BankAccountManagement/Delete.svg",
    },
    {
      id: "IeCreateDiagram",
      mmdPath: "../newClassesDesign/IncomeExpenseManagement/IeCreate.mmd",
      loadingId: "loadingIeCreate",
      svgPath: "../newClassesDesign/IncomeExpenseManagement/IeCreate.svg",
    },
    {
      id: "IeDeleteDiagram",
      mmdPath: "../newClassesDesign/IncomeExpenseManagement/IeDelete.mmd",
      loadingId: "loadingIeDelete",
      svgPath: "../newClassesDesign/IncomeExpenseManagement/IeDelete.svg",
    },
    {
      id: "IeReadAllDiagram",
      mmdPath: "../newClassesDesign/IncomeExpenseManagement/IeReadAll.mmd",
      loadingId: "loadingIeReadAll",
      svgPath: "../newClassesDesign/IncomeExpenseManagement/IeReadAll.svg",
    },
    {
      id: "IeReadOneDiagram",
      mmdPath: "../newClassesDesign/IncomeExpenseManagement/IeReadOne.mmd",
      loadingId: "loadingIeReadOne",
      svgPath: "../newClassesDesign/IncomeExpenseManagement/IeReadOne.svg",
    },
    {
      id: "IeUpdateDiagram",
      mmdPath: "../newClassesDesign/IncomeExpenseManagement/IeUpdate.mmd",
      loadingId: "loadingIeUpdate",
      svgPath: "../newClassesDesign/IncomeExpenseManagement/IeUpdate.svg",
    },
    {
      id: "quotaCheckDiagram",
      mmdPath: "../newClassesDesign/api/QuotaCheck.mmd",
      loadingId: "loadingQuotaCheck",
      svgPath: "../newClassesDesign/api/QuotaCheck.svg",
    },
    {
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
    loadedDiagrams++;
    const progress = (loadedDiagrams / totalDiagrams) * 100;
    document.getElementById("loadingBar").style.width = `${progress}%`;
    loadingText.textContent = `${Math.round(
      progress
    )}% [${loadedDiagrams}/${totalDiagrams}] ${
      diagram.id
    } loaded and rendered successfully.`;
    if (loadedDiagrams === totalDiagrams) {
      // Ensure the progress bar reaches 100% before hiding
      document.getElementById("loadingBar").style.width = "100%";
      loadingText.textContent =
        "100% All diagrams loaded and rendered successfully.";
      // Use setTimeout to delay hiding the progress bar
      setTimeout(() => {
        document.getElementById("loadingProgress").style.display = "none";
      }, 500); // Delay of 500ms
    }
    if (progress >= 50) {
      loadingText.style.fontWeight = 700;
    }
  }

  // Add a small delay before starting to load diagrams
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Create an array of promises for fetching diagrams
  const fetchPromises = diagrams.map(async (diagram) => {
    // Function to load diagram from a Mermaid file with fallback to SVG
    const skeleton = document.getElementById(diagram.loadingId);
    try {
      const response = await fetch(diagram.mmdPath);
      if (!response.ok) {
        throw new Error("Failed to fetch Mermaid file.");
      }
      const text = await response.text();
      document.getElementById(diagram.id).textContent = text;
      mermaid.init(undefined, `#${diagram.id}`);
      console.log(`${diagram.id} loaded and rendered successfully.`);
    } catch (error) {
      console.error(
        `Mermaid file cannot load ${diagram.id}, falling back to SVG:${error}`
      );
      document.getElementById(
        diagram.id
      ).innerHTML = `<img src="${diagram.svgPath}" alt="Diagram">`;
    } finally {
      skeleton.style.display = "none"; // Hide skeleton indicator on success
      updateLoadingProgress(diagram);
    }
  });

  // Execute all fetch requests simultaneously
  await Promise.all(fetchPromises);

  initZoomableDiagrams();
});

//NOTE - SVG zoomable
function initZoomableDiagrams() {
  const containers = document.querySelectorAll(".diagram-container");

  containers.forEach((container) => {
    const svg = container.querySelector("svg");
    const resetButton = container.querySelector(".reset-zoom");

    if (!svg) return;

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
  });
}
