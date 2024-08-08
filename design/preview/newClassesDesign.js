//NOTE - Load the JSON data 
document.addEventListener("DOMContentLoaded", function () {
    fetch("./checkedData.json")
        .then(response => response.json())
        .then(data => {
            Object.keys(data).forEach(key => {
                const checkbox = document.getElementById(key);
                if (checkbox) {
                    checkbox.checked = data[key];
                }
            });
            console.log("Checked data loaded successfully:", data);
        })
        .catch(error => {
            console.error("Error loading checkedData.json:", error);
        });
});

//NOTE - Back to top button
const backToTopButton = document.getElementById("backToTop");

window.onscroll = function () {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.classList.add("visible");
    } else {
        backToTopButton.classList.remove("visible");
    }
};

backToTopButton.onclick = function () {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
};

//NOTE - Save button
function saveData() {
    console.log("Save button clicked");
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    const data = {};
    checkboxes.forEach(checkbox => {
        data[checkbox.id] = checkbox.checked;
    });
    // Convert the data object to JSON string
    const jsonData = JSON.stringify(data);

    // Send the JSON data to the server to save it in a file
    // You can use AJAX or fetch to send the data to the server
    // Here, I'm using a simple console.log to simulate the server request
    console.log(jsonData);

    // Create a Blob object with the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Create a temporary anchor element
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = 'checkedData.json';

    // Programmatically click the anchor element to trigger the download
    anchor.click();
}

//NOTE - Change the background color of the menu based on the active section
// Get all menu items
const menuItems = document.querySelectorAll('#menu a');

// Function to add/remove highlight class
const toggleHighlight = (menuItem, add) => {
    menuItem.classList[add ? 'add' : 'remove']('active');
};

// Add scroll event listener
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY; // Get current scroll position

    // Loop through menu items
    menuItems.forEach(menuItem => {
        const href = menuItem.getAttribute('href');
        const targetSection = document.querySelector(href);

        if (targetSection) {
            const sectionTop = targetSection.offsetTop;
            const sectionHeight = targetSection.offsetHeight;

            // Check if section is in viewport
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                toggleHighlight(menuItem, true);  // Highlight menu item
            } else {
                toggleHighlight(menuItem, false); // Remove highlight
            }
        }
    });
});