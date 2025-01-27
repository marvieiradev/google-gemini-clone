const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const sugestionsItens = document.querySelector(".suggests__item");

const themeToggleButton = document.querySelector("themeToggler");
const clearChatButton = document.querySelector("deleteButton");

let currentUserMessage = null;
let isGeneratingResponse = false;
