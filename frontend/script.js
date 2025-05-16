fetch('../frontend/bracket.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load bracket data');
    }
    return response.json();
  })
  .then(data => {
    renderBracket(data);
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById('bracket').innerText = 'Failed to load bracket data.';
  });

function renderBracket(match, depth = 0, container = document.getElementById('bracket')) {
  if (!match) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'match depth-' + depth;

  const text = document.createElement('div');
  text.className = 'match-info';
  text.innerText = `${match.p1} vs ${match.p2} → Winner: ${match.winner}`;
  wrapper.appendChild(text);

  container.appendChild(wrapper);

  if (match.left) renderBracket(match.left, depth + 1, container);
  if (match.right) renderBracket(match.right, depth + 1, container);
}
