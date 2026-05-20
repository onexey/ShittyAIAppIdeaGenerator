const ideaText = document.querySelector("#idea-text");
const statusText = document.querySelector("#status");
const shuffleButton = document.querySelector("#shuffle-button");
const copyButton = document.querySelector("#copy-button");
const ideaPanel = document.querySelector(".idea-panel");

const IDEA_INDEX_PATH = "./ShittyIdeas/index.json";
const LAST_IDEA_STORAGE_KEY = "shitty-ai-idea-last-id";

let ideas = [];
let currentIdea = null;

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`);
  }

  return response.json();
}

function flattenIdeas(filePayloads) {
  return filePayloads.flatMap(({ source, ideas: fileIdeas }) =>
    fileIdeas.map((idea, index) => ({
      id: `${source.slug}-${index}`,
      text: idea.text.trim(),
    })),
  );
}

function pickRandomIdea(allIdeas) {
  if (allIdeas.length === 0) {
    return null;
  }

  const previousIdeaId = localStorage.getItem(LAST_IDEA_STORAGE_KEY);
  const eligibleIdeas =
    allIdeas.length > 1
      ? allIdeas.filter((idea) => idea.id !== previousIdeaId)
      : allIdeas;

  const chosenIdea =
    eligibleIdeas[Math.floor(Math.random() * eligibleIdeas.length)] ?? allIdeas[0];

  localStorage.setItem(LAST_IDEA_STORAGE_KEY, chosenIdea.id);
  return chosenIdea;
}

function setStatus(message) {
  statusText.textContent = message;
}

function renderIdea(idea) {
  if (!idea) {
    ideaText.textContent = "No bad ideas were found.";
    return;
  }

  currentIdea = idea;
  ideaPanel.classList.add("is-transitioning");

  window.setTimeout(() => {
    ideaText.textContent = idea.text;
    ideaPanel.classList.remove("is-transitioning");
  }, 170);
}

async function loadIdeas() {
  setStatus("Loading deeply regrettable opportunities...");

  const manifest = await fetchJson(IDEA_INDEX_PATH);
  const filePayloads = await Promise.all(
    manifest.files.map(async (file) => ({
      source: {
        title: file.title,
        slug: file.slug,
      },
      ideas: (await fetchJson(`./ShittyIdeas/${file.file}`)).ideas,
    })),
  );

  ideas = flattenIdeas(filePayloads).filter((idea) => idea.text.length > 0);

  if (ideas.length === 0) {
    throw new Error("No ideas available.");
  }

  renderIdea(pickRandomIdea(ideas));
  setStatus(`${ideas.length} terrible ideas loaded.`);
}

function showAnotherIdea() {
  if (ideas.length === 0) {
    return;
  }

  renderIdea(pickRandomIdea(ideas));
  setStatus("Fresh nonsense deployed.");
}

async function copyIdea() {
  if (!currentIdea) {
    return;
  }

  try {
    await navigator.clipboard.writeText(currentIdea.text);
    setStatus("Pitch copied.");
  } catch (error) {
    setStatus("Clipboard access failed.");
  }
}

shuffleButton.addEventListener("click", showAnotherIdea);
copyButton.addEventListener("click", copyIdea);

loadIdeas().catch((error) => {
  console.error(error);
  ideaText.textContent = "The bad-idea pipeline is offline.";
  setStatus(error.message);
});
