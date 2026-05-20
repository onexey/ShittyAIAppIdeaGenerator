const ideaText = document.querySelector("#idea-text");
const statusText = document.querySelector("#status");
const shuffleButton = document.querySelector("#shuffle-button");
const copyButton = document.querySelector("#copy-button");
const ideaPanel = document.querySelector(".idea-panel");

const IDEA_INDEX_PATH = "./ShittyIdeas/index.json";
const IDEA_ROUTE_SEGMENT = "idea";
const IDEA_QUERY_PARAM = "idea";
const LAST_IDEA_STORAGE_KEY = "shitty-ai-idea-last-id";

let ideas = [];
let ideasById = new Map();
let currentIdea = null;
let renderTimer = 0;

const appBasePath = getBasePath(window.location.pathname);

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

function getPathSegments(pathname) {
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, "");
  return trimmedPath ? trimmedPath.split("/") : [];
}

function stripDocumentSegment(segments) {
  return segments.at(-1)?.includes(".") ? segments.slice(0, -1) : segments;
}

function getBasePath(pathname) {
  const segments = stripDocumentSegment(getPathSegments(pathname));
  const routeIndex = segments.lastIndexOf(IDEA_ROUTE_SEGMENT);
  const baseSegments =
    routeIndex >= 0 && routeIndex < segments.length - 1
      ? segments.slice(0, routeIndex)
      : segments;

  return baseSegments.length > 0 ? `/${baseSegments.join("/")}/` : "/";
}

function buildIdeaPath(ideaId) {
  const url = new URL(appBasePath, window.location.origin);
  url.searchParams.set(IDEA_QUERY_PARAM, ideaId);
  return `${url.pathname}${url.search}${url.hash}`;
}

function buildIdeaUrl(ideaId) {
  return new URL(buildIdeaPath(ideaId), window.location.origin).toString();
}

function extractIdeaIdFromUrl(urlValue) {
  const url = new URL(urlValue, window.location.origin);
  const queryIdeaId = url.searchParams.get(IDEA_QUERY_PARAM);

  if (queryIdeaId) {
    return queryIdeaId;
  }

  const segments = stripDocumentSegment(getPathSegments(url.pathname));
  const routeIndex = segments.lastIndexOf(IDEA_ROUTE_SEGMENT);

  if (routeIndex >= 0 && routeIndex < segments.length - 1) {
    return decodeURIComponent(segments[routeIndex + 1]);
  }

  return null;
}

function rememberIdea(idea) {
  if (!idea) {
    return;
  }

  localStorage.setItem(LAST_IDEA_STORAGE_KEY, idea.id);
}

function pickRandomIdea(allIdeas, excludeIdeaIds = []) {
  if (allIdeas.length === 0) {
    return null;
  }

  const previousIdeaId = localStorage.getItem(LAST_IDEA_STORAGE_KEY);
  const blockedIdeaIds = new Set([previousIdeaId, ...excludeIdeaIds].filter(Boolean));
  const eligibleIdeas =
    blockedIdeaIds.size > 0 && blockedIdeaIds.size < allIdeas.length
      ? allIdeas.filter((idea) => !blockedIdeaIds.has(idea.id))
      : allIdeas;

  return eligibleIdeas[Math.floor(Math.random() * eligibleIdeas.length)] ?? allIdeas[0];
}

function setStatus(message) {
  statusText.textContent = message;
}

function renderIdea(idea, { skipTransition = false } = {}) {
  window.clearTimeout(renderTimer);

  if (!idea) {
    ideaPanel.classList.remove("is-transitioning");
    ideaText.textContent = "No bad ideas were found.";
    return;
  }

  if (skipTransition) {
    ideaPanel.classList.remove("is-transitioning");
    ideaText.textContent = idea.text;
    return;
  }

  ideaPanel.classList.remove("is-transitioning");
  void ideaPanel.offsetWidth;
  ideaText.textContent = idea.text;
  ideaPanel.classList.add("is-transitioning");

  renderTimer = window.setTimeout(() => {
    ideaPanel.classList.remove("is-transitioning");
  }, 220);
}

function syncIdeaRoute(idea, historyMethod) {
  if (!idea || !historyMethod) {
    return;
  }

  window.history[historyMethod]({ ideaId: idea.id }, "", buildIdeaPath(idea.id));
}

function showIdea(
  idea,
  { historyMethod = null, skipTransition = false, statusMessage = "" } = {},
) {
  if (!idea) {
    renderIdea(null, { skipTransition: true });
    return;
  }

  currentIdea = idea;
  rememberIdea(idea);
  syncIdeaRoute(idea, historyMethod);
  renderIdea(idea, { skipTransition });

  if (statusMessage) {
    setStatus(statusMessage);
  }
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
  ideasById = new Map(ideas.map((idea) => [idea.id, idea]));

  if (ideas.length === 0) {
    throw new Error("No ideas available.");
  }

  const requestedIdeaId = extractIdeaIdFromUrl(window.location.href);
  const linkedIdea = requestedIdeaId ? ideasById.get(requestedIdeaId) : null;
  const initialIdea = linkedIdea ?? pickRandomIdea(ideas);

  if (requestedIdeaId && !linkedIdea) {
    showIdea(initialIdea, {
      historyMethod: "replaceState",
      skipTransition: true,
      statusMessage: "That pitch link was broken. Replacement nonsense deployed.",
    });
    return;
  }

  showIdea(initialIdea, {
    historyMethod: "replaceState",
    skipTransition: true,
    statusMessage: linkedIdea
      ? "Shared nonsense loaded."
      : `${ideas.length} terrible ideas loaded.`,
  });
}

function showAnotherIdea() {
  if (ideas.length === 0) {
    return;
  }

  showIdea(pickRandomIdea(ideas, [currentIdea?.id]), {
    historyMethod: "pushState",
    statusMessage: "Fresh nonsense deployed.",
  });
}

async function copyIdeaLink() {
  if (!currentIdea) {
    return;
  }

  try {
    await navigator.clipboard.writeText(buildIdeaUrl(currentIdea.id));
    setStatus("Pitch link copied.");
  } catch (error) {
    setStatus("Clipboard access failed.");
  }
}

function handlePopState() {
  if (ideas.length === 0) {
    return;
  }

  const requestedIdeaId = extractIdeaIdFromUrl(window.location.href);
  const linkedIdea = requestedIdeaId ? ideasById.get(requestedIdeaId) : null;

  if (linkedIdea) {
    showIdea(linkedIdea, {
      skipTransition: true,
      statusMessage: "Linked nonsense loaded.",
    });
    return;
  }

  showIdea(pickRandomIdea(ideas, [currentIdea?.id]), {
    historyMethod: "replaceState",
    skipTransition: true,
    statusMessage: "That pitch vanished. Replacement nonsense deployed.",
  });
}

shuffleButton.addEventListener("click", showAnotherIdea);
copyButton.addEventListener("click", copyIdeaLink);
window.addEventListener("popstate", handlePopState);

loadIdeas().catch((error) => {
  console.error(error);
  ideaText.textContent = "The bad-idea pipeline is offline.";
  setStatus(error.message);
});
