// Add event listeners to the navigation menu
document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll("nav a");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = link.getAttribute("href");
      const section = document.querySelector(href);
      section.scrollIntoView({ behavior: "smooth" });
    });
  });
});
