const translations = {
  ko: {
    navAbout: "소개", navWork: "경력", navGames: "Games", eyebrow: "임베디드 시스템 · 카메라",
    heroTitle: "시스템을 설계하고, 경험을 선명하게 만듭니다.",
    heroCopy: "카메라 시스템과 화질 개발 경험을 바탕으로 임베디드 하드웨어와 소프트웨어의 접점을 탐구합니다.",
    aboutTitle: "정진철 · Embedded Explorer",
    aboutCopy: "컴퓨터 공학을 전공하고 삼성전자 무선사업부에서 카메라 시스템 개발과 카메라 화질 개발을 진행했습니다. 임베디드 시스템, 시스템 개발, 임베디드 H/W에 관심이 있습니다.",
    workTitle: "관찰하고, 연결하고, 개선합니다.", workCopy: "기술의 디테일과 사용자의 경험을 함께 바라보며 견고한 시스템을 고민합니다.",
    gamesTitle: "Pixel Rescue Mission", gamesCopy: "지하 던전에서 공주를 구하는 오리지널 픽셀풍 게임이 준비 중입니다.",
    gamesStatus: "게임 영역 준비 중 · 다음 루프에서 조작과 상태를 구현합니다.", footerText: "Systems, pixels, and curiosity."
  },
  en: {
    navAbout: "About", navWork: "Work", navGames: "Games", eyebrow: "EMBEDDED SYSTEMS · CAMERA",
    heroTitle: "Designing systems, sharpening experiences.",
    heroCopy: "Exploring the space between embedded hardware and software through camera system and image-quality development.",
    aboutTitle: "Jinchul · Embedded Explorer",
    aboutCopy: "I studied computer engineering and worked on camera system and image-quality development at Samsung Electronics Wireless Business Division. My interests include embedded systems, system development, and embedded hardware.",
    workTitle: "Observe, connect, improve.", workCopy: "I think about robust systems by looking at technical detail and human experience together.",
    gamesTitle: "Pixel Rescue Mission", gamesCopy: "An original pixel-style dungeon game about rescuing a princess is in preparation.",
    gamesStatus: "Game area in preparation · Controls and state come in the next loop.", footerText: "Systems, pixels, and curiosity."
  }
};

const languageToggle = document.querySelector("[data-language-toggle]");
let language = "ko";

function renderLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translations[language][element.dataset.i18n];
  });
  languageToggle.textContent = language === "ko" ? "EN" : "KO";
  languageToggle.setAttribute("aria-pressed", String(language === "en"));
}

languageToggle.addEventListener("click", () => {
  language = language === "ko" ? "en" : "ko";
  renderLanguage();
});

renderLanguage();
