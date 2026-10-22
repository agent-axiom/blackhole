import { initHero } from './hero.js';
import { initExplorer } from './explorer.js';

const canvas = document.getElementById('hero-canvas');
if (canvas) {
  try { initHero(canvas, document.getElementById('hero-pause')); }
  catch (error) { console.error('The profile visualization could not start.', error); }
}
initExplorer().catch(error => {
  console.error('The research explorer could not start.', error);
  document.getElementById('chart-caption').textContent = 'The interactive data could not be loaded. You can still read the manuscript and download the archived data below.';
});

// A compact registry allows later manuscripts to be added without rebuilding the page.
fetch('./data/research.json').then(response => {
  if (!response.ok) throw new Error('Research registry unavailable');
  return response.json();
}).then(registry => {
  const list = document.getElementById('paper-list');
  for (const paper of registry.papers.slice(1)) {
    const article = document.createElement('article');
    article.className = 'paper-card';
    const index = document.createElement('div'); index.className = 'paper-index';
    const label = document.createElement('span'); label.textContent = 'PAPER';
    const number = document.createElement('strong'); number.textContent = paper.number;
    const date = document.createElement('span'); date.textContent = paper.date_label;
    index.append(label, number, date);
    const info = document.createElement('div'); info.className = 'paper-info';
    const status = document.createElement('span'); status.className = 'paper-state'; status.textContent = paper.status_label;
    const title = document.createElement('h3'); title.textContent = paper.title;
    const author = document.createElement('p'); author.textContent = paper.author;
    const abstract = document.createElement('p'); abstract.className = 'paper-abstract'; abstract.textContent = paper.summary;
    info.append(status, title, author, abstract);
    if (paper.pdf && /^\.\/papers\/[a-zA-Z0-9._-]+\.pdf$/.test(paper.pdf)) {
      const links = document.createElement('div'); links.className = 'paper-links';
      const link = document.createElement('a'); link.className = 'button button-dark'; link.href = paper.pdf; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Read manuscript ↗';
      links.append(link); info.append(links);
    }
    article.append(index, info); list.append(article);
  }
}).catch(error => console.warn(error.message));
