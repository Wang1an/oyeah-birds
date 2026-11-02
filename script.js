"use strict";

const page = document.body.dataset.page;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function media(bird) {
  const placeholder = () => {
    const node = element("div", "placeholder");
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", bird.imageAlt || bird.name + "主图待补充");
    const mark = element("span", "placeholder-mark", "Alcedo");
    mark.setAttribute("aria-hidden", "true");
    node.append(mark, element("span", "placeholder-label", "主图待补充 · " + bird.name));
    return node;
  };
  if (!bird.image) return placeholder();
  const image = element("img", "bird-photo");
  image.alt = bird.imageAlt || bird.name;
  image.src = bird.image;
  image.loading = "lazy";
  image.addEventListener("error", () => image.replaceWith(placeholder()), { once: true });
  return image;
}

function renderList(birds) {
  const list = document.getElementById("bird-list");
  list.replaceChildren();
  if (!birds.length) {
    list.append(element("p", "status", "图鉴还在准备中，请稍后再来。"));
    return;
  }
  birds.forEach(bird => {
    const card = element("a", "bird-card");
    card.href = "./bird.html?id=" + encodeURIComponent(bird.id);
    const copy = element("div", "card-copy");
    const scientific = element("p", "scientific");
    scientific.append(element("i", "", bird.scientificName));
    copy.append(element("p", "eyebrow", bird.tag), element("h3", "", bird.name),
      scientific, element("p", "summary", bird.summary), element("span", "card-link", "认识它 →"));
    card.append(media(bird), copy);
    list.append(card);
  });
}

function showError(title, message) {
  const target = document.getElementById("bird-detail") || document.getElementById("bird-list");
  const section = element("section", "error-state");
  section.append(element(page === "bird" ? "h1" : "h3", "", title), element("p", "", message));
  const link = element("a", "button", page === "bird" ? "返回图鉴" : "重新加载");
  link.href = page === "bird" ? "./index.html" : "./index.html#birds";
  section.append(link);
  target.replaceChildren(section);
  target.setAttribute("aria-busy", "false");
  if (page === "bird") document.title = title + " · Oyeah Birds";
}

function renderDetail(bird) {
  document.title = bird.name + " · Oyeah Birds";
  const target = document.getElementById("bird-detail");
  const heading = element("header", "detail-heading");
  const scientific = element("p", "scientific");
  scientific.append(element("i", "", bird.scientificName));
  heading.append(element("p", "eyebrow", "鸟类图鉴 / " + bird.id), element("h1", "", bird.name), scientific);
  const figure = element("figure", "detail-media");
  figure.append(media(bird));
  const content = element("div", "detail-content");
  const features = element("section", "info-panel");
  const list = element("ul");
  bird.features.forEach(text => list.append(element("li", "", text)));
  features.append(element("h2", "", "如何认出它"), list);
  const life = element("section", "info-panel");
  const habits = element("div", "habits");
  habits.append(element("h3", "", "它怎样生活"), element("p", "", bird.habits));
  life.append(element("h2", "", "生境与习性"), element("h3", "", "在哪里遇见它"), element("p", "", bird.habitat), habits);
  content.append(features, life);
  const tip = element("aside", "tip");
  tip.append(element("h2", "", "带着这个线索去观察"), element("p", "", bird.observationTip));
  target.replaceChildren(heading, figure, content, tip);
  target.setAttribute("aria-busy", "false");
}

async function init() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (page === "bird" && !id) {
    showError("还没有选择鸟类", "请从图鉴首页选择一只鸟，或重新轻触 NFC 标签。");
    return;
  }
  try {
    const response = await fetch("./birds.json");
    if (!response.ok) throw new Error("HTTP " + response.status);
    const birds = await response.json();
    if (!Array.isArray(birds) || birds.some(bird => !bird || typeof bird.id !== "string" ||
      typeof bird.name !== "string" || typeof bird.scientificName !== "string" ||
      !Array.isArray(bird.features))) throw new Error("Invalid bird data");
    if (page === "bird") {
      const bird = birds.find(item => item.id === id);
      if (!bird) showError("暂未收录这只鸟", "这个编号还没有对应的资料，请返回图鉴查看已收录的鸟类。");
      else renderDetail(bird);
    } else renderList(birds);
  } catch (error) {
    showError("图鉴暂时没能打开", "资料加载失败，请检查网络后刷新页面再试。");
    console.error("Unable to load bird data:", error);
  }
}

init();
