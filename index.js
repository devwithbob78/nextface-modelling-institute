const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.textContent = isOpen ? "×" : "☰";
  });
  document.querySelectorAll(".nav a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.textContent = "☰";
  }));
}
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
const form = document.getElementById("enquiryForm");
if (form) form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const subject = encodeURIComponent("Nextface Modelling Institute — New Enquiry");
  const body = encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\nProgram: ${data.get("interest")}\nEnquiry for: ${data.get("agegroup")}\nMessage: ${data.get("message") || "No additional message"}`);
  document.getElementById("formStatus").textContent = "This prototype prepares an email only. The admissions email must be configured before launch.";
  // Replace with the institute's approved admissions email before using this form.
  window.location.href = `mailto:YOUR-ADMISSIONS-EMAIL@example.com?subject=${subject}&body=${body}`;
});
