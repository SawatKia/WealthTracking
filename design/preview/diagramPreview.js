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
  var menu = document.getElementById("menu");
  var content = document.getElementById("content");
  var toggleButton = document.getElementById("menu-toggle");

  toggleButton.addEventListener("click", function () {
    menu.classList.toggle("expanded");
    toggleButton.style.transitionDuration = "0.5s";
    if (menu.classList.contains("expanded")) {
      toggleButton.textContent = "×";
      toggleButton.style.left = "260px";
      toggleButton.style.transform = "rotate(180deg)";
    } else {
      toggleButton.textContent = "☰";
      toggleButton.style.left = "10px";
      toggleButton.style.transform = "rotate(0deg)";
    }
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
      id: "tCreateDiagram",
      mmdPath: "../newClassesDesign/TransactionManagement/t-create.mmd",
      loadingId: "loadingTCreate",
      svgPath: "../newClassesDesign/TransactionManagement/t-create.svg",
    },
    {
      id: "tDeleteDiagram",
      mmdPath: "../newClassesDesign/TransactionManagement/t-delete.mmd",
      loadingId: "loadingTDelete",
      svgPath: "../newClassesDesign/TransactionManagement/t-delete.svg",
    },
    {
      id: "tReadAllDiagram",
      mmdPath: "../newClassesDesign/TransactionManagement/t-readAll.mmd",
      loadingId: "loadingTReadAll",
      svgPath: "../newClassesDesign/TransactionManagement/t-readAll.svg",
    },
    {
      id: "tReadOneDiagram",
      mmdPath: "../newClassesDesign/TransactionManagement/t-readOne.mmd",
      loadingId: "loadingTReadOne",
      svgPath: "../newClassesDesign/TransactionManagement/t-readOne.svg",
    },
    {
      id: "tUpdateDiagram",
      mmdPath: "../newClassesDesign/TransactionManagement/t-update.mmd",
      loadingId: "loadingTUpdate",
      svgPath: "../newClassesDesign/TransactionManagement/t-update.svg",
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
    const loading = document.getElementById(diagram.loadingId);
    // show loading indicator
    loading.style.display = "flex";
  });

  // Function to update loading progress
  function updateLoadingProgress(diagram) {
    loadedDiagrams++;
    const progress = (loadedDiagrams / totalDiagrams) * 100;
    document.getElementById("loadingBar").style.width = `${progress}%`;
    document.getElementById("loadingText").textContent = `${Math.round(progress)}% ${diagram.id} loaded and rendered successfully.`;
    if (loadedDiagrams === totalDiagrams) {
      document.getElementById("loadingProgress").style.display = "none";
    }
  }

  // Function to load diagram from a Mermaid file with fallback to SVG
  for (const diagram of diagrams) {
    const loading = document.getElementById(diagram.loadingId);
    try {
      const response = await fetch(diagram.mmdPath);
      if (!response.ok) {
        throw new Error("Failed to fetch Mermaid file.");
      }
      const text = await response.text();
      document.getElementById(diagram.id).textContent = text;
      mermaid.init(undefined, `#${diagram.id}`);
    } catch (error) {
      console.error("Mermaid file not loaded, falling back to SVG:", error);
      document.getElementById(
        diagram.id
      ).innerHTML = `<img src="${diagram.svgPath}" alt="Diagram">`;
    } finally {
      loading.style.display = "none"; // Hide loading indicator on success
      updateLoadingProgress(diagram);
    }
  }
});