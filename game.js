let score = 0;
const statusEl = document.getElementById('status');
const btn = document.getElementById('btn');

btn.addEventListener('click', () => {
  score += 1;
  statusEl.textContent = Score: ;
});

