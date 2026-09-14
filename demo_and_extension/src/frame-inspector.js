const params = new URLSearchParams(location.search);
const videoPath = params.get("video");
const targetSeconds = finite(params.get("t"), 0);
const minSeconds = finite(params.get("min"), 0);
const maxSecondsParam = Number(params.get("max"));
const label = params.get("label") || "Recorded Street View frame";

const crop = readCrop(params);
const elements = {
  title: document.querySelector("#title"),
  stage: document.querySelector("#stage"),
  status: document.querySelector("#status"),
  requested: document.querySelector("#requested"),
  selected: document.querySelector("#selected"),
  offset: document.querySelector("#offset"),
  sharpness: document.querySelector("#sharpness"),
  openPng: document.querySelector("#open-png"),
  toggleContext: document.querySelector("#toggle-context"),
  contextVideo: document.querySelector("#context-video"),
};

elements.title.textContent = label;
elements.requested.textContent = `${targetSeconds.toFixed(3)} s`;

if (!videoPath || !videoPath.startsWith("/data/exploration-videos/")) {
  fail("The frame inspector received an invalid exploration-video path.");
} else {
  void inspect();
}

async function inspect() {
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = videoPath;
  await waitFor(video, "loadedmetadata", 12000);

  const maxSeconds = Number.isFinite(maxSecondsParam)
    ? Math.min(maxSecondsParam, Math.max(0, video.duration - 0.04))
    : Math.max(0, video.duration - 0.04);
  const lower = Math.max(0, Math.min(minSeconds, maxSeconds));
  const target = clamp(targetSeconds, lower, maxSeconds);
  const offsetsMs = [-600, -450, -300, -150, 0, 150, 300, 450, 600];
  const candidates = unique(
    offsetsMs.map((offset) => clamp(target + offset / 1000, lower, maxSeconds)),
  );

  let best = null;
  for (let index = 0; index < candidates.length; index += 1) {
    const time = candidates[index];
    elements.status.textContent = `Checking frame ${index + 1}/${candidates.length}…`;
    await seek(video, time);
    await nextPaint();
    const captured = captureFrame(video, crop);
    const sharpness = scoreSharpness(captured.canvas);
    const distancePenalty = Math.abs(time - target) * 0.8;
    const score = sharpness - distancePenalty;
    if (!best || score > best.score) {
      best?.url && URL.revokeObjectURL(best.url);
      const blob = await canvasBlob(captured.canvas);
      best = {
        time,
        sharpness,
        score,
        url: URL.createObjectURL(blob),
      };
    }
  }

  if (!best) throw new Error("No usable video frame could be decoded.");
  const img = document.createElement("img");
  img.src = best.url;
  img.alt = `${label} at ${best.time.toFixed(3)} seconds`;
  elements.stage.replaceChildren(img);
  elements.selected.textContent = `${best.time.toFixed(3)} s`;
  const offsetMs = Math.round((best.time - target) * 1000);
  elements.offset.textContent = `${offsetMs >= 0 ? "+" : ""}${offsetMs} ms`;
  elements.sharpness.textContent = best.sharpness.toFixed(1);
  elements.openPng.href = best.url;
  elements.openPng.hidden = false;

  elements.contextVideo.src = videoPath;
  elements.contextVideo.currentTime = Math.max(lower, best.time - 1.5);
  elements.toggleContext.addEventListener("click", () => {
    const hidden = elements.contextVideo.hidden;
    elements.contextVideo.hidden = !hidden;
    elements.toggleContext.textContent = hidden ? "Hide video context" : "Show video context";
  });
}

function captureFrame(video, crop) {
  const source = resolveSourceRect(video, crop);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width));
  canvas.height = Math.max(1, Math.round(source.height));
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(
    video,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return { canvas };
}

function resolveSourceRect(video, crop) {
  if (!crop) return { x: 0, y: 0, width: video.videoWidth, height: video.videoHeight };
  const scaleX = video.videoWidth / crop.viewportWidth;
  const scaleY = video.videoHeight / crop.viewportHeight;
  const x = clamp(crop.x * scaleX, 0, Math.max(0, video.videoWidth - 1));
  const y = clamp(crop.y * scaleY, 0, Math.max(0, video.videoHeight - 1));
  const width = clamp(crop.width * scaleX, 1, video.videoWidth - x);
  const height = clamp(crop.height * scaleY, 1, video.videoHeight - y);
  return { x, y, width, height };
}

function scoreSharpness(sourceCanvas) {
  const width = 180;
  const height = Math.max(80, Math.round(sourceCanvas.height / sourceCanvas.width * width));
  const sample = document.createElement("canvas");
  sample.width = width;
  sample.height = height;
  const ctx = sample.getContext("2d", { alpha: false, willReadFrequently: true });
  ctx.drawImage(sourceCanvas, 0, 0, width, height);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const gray = new Float32Array(width * height);
  for (let i = 0, p = 0; i < rgba.length; i += 4, p += 1) {
    gray[p] = rgba[i] * 0.299 + rgba[i + 1] * 0.587 + rgba[i + 2] * 0.114;
  }
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - width] - gray[i + width];
      sum += lap;
      sumSq += lap * lap;
      count += 1;
    }
  }
  if (!count) return 0;
  const mean = sum / count;
  return Math.max(0, sumSq / count - mean * mean);
}

function readCrop(search) {
  const values = ["x", "y", "w", "h", "vw", "vh"].map((key) => Number(search.get(key)));
  if (!values.every(Number.isFinite) || values[2] <= 0 || values[3] <= 0 || values[4] <= 0 || values[5] <= 0) {
    return null;
  }
  return {
    x: values[0], y: values[1], width: values[2], height: values[3],
    viewportWidth: values[4], viewportHeight: values[5],
  };
}

function seek(video, time) {
  if (Math.abs(video.currentTime - time) < 0.015 && video.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out seeking the recorded video.")), 6000);
    const done = () => { clearTimeout(timer); resolve(); };
    video.addEventListener("seeked", done, { once: true });
    video.currentTime = time;
  });
}

function waitFor(target, event, timeoutMs) {
  if (event === "loadedmetadata" && target.readyState >= 1) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}.`)), timeoutMs);
    target.addEventListener(event, () => { clearTimeout(timer); resolve(); }, { once: true });
    target.addEventListener("error", () => { clearTimeout(timer); reject(new Error("The recorded WebM could not be loaded.")); }, { once: true });
  });
}

function canvasBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode selected frame.")), "image/png");
  });
}

function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function unique(values) { return [...new Set(values.map((value) => value.toFixed(3)))].map(Number); }
function fail(message) {
  elements.status.classList.add("error");
  elements.status.textContent = message;
}

window.addEventListener("unhandledrejection", (event) => {
  fail(event.reason instanceof Error ? event.reason.message : String(event.reason));
});
