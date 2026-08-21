const languageButtons = document.querySelectorAll("[data-language]");
const translatableElements = document.querySelectorAll("[data-az][data-en]");
const surveyLink = document.getElementById("survey-link");

function setLanguage(language) {
  document.documentElement.lang = language;

  translatableElements.forEach((element) => {
    element.textContent = element.dataset[language];
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.language === language;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  document.title =
    language === "az"
      ? "Pasiyent məmnuniyyəti sorğusu"
      : "Patient satisfaction survey";

  localStorage.setItem("preferredLanguage", language);
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.language);
  });
});

surveyLink.addEventListener("click", (event) => {
  if (surveyLink.getAttribute("href") === "#") {
    event.preventDefault();
    const message =
      document.documentElement.lang === "az"
        ? "Sorğu linki növbəti mərhələdə əlavə ediləcək."
        : "The survey link will be added in the next step.";
    alert(message);
  }
});

const savedLanguage = localStorage.getItem("preferredLanguage");
setLanguage(savedLanguage === "en" ? "en" : "az");

document.getElementById("current-year").textContent = new Date().getFullYear();
