function applyRandomTilts() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        if (!card.style.transform) { // Only apply if not already tilted
            const randomTilt = (Math.random() - 0.5) * 4;
            card.style.transform = `rotate(${randomTilt}deg)`;
        }
    });
}

// Watch for new cards being added
const observer = new MutationObserver(() => {
    applyRandomTilts();
});

observer.observe(document.body, { childList: true, subtree: true });