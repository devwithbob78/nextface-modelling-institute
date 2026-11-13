const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

menuButton.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.textContent = isOpen ? "×" : "☰";
});

document.querySelectorAll(".nav a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "☰";
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

document.getElementById("enquiryForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  // Replace this placeholder with the institute's approved admissions email.
  const admissionsEmail = "YOUR-ADMISSIONS-EMAIL@example.com";
  const data = new FormData(form);
  const subject = encodeURIComponent("Nextface Modelling Institute — New Enquiry");
  const body = encodeURIComponent(
    `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nProgram: ${data.get("interest")}\nEnquiry for: ${data.get("agegroup")}\nMessage: ${data.get("message") || "No additional message"}`
  );

  if (admissionsEmail.includes("YOUR-ADMISSIONS-EMAIL")) {
    document.getElementById("formStatus").textContent =
      "Demo form checked successfully. Add the institute's real admissions email in script.js before launch.";
    return;
  }
  window.location.href = `mailto:${admissionsEmail}?subject=${subject}&body=${body}`;
});
