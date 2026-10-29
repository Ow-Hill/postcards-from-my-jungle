document.querySelectorAll(".play-audio").forEach((button) => {
    button.addEventListener("click", () => {
        const galleryItem = button.closest(".gallery-item");
        const text = galleryItem.querySelector(".animal-text")?.textContent.trim();
        const audio = new Audio(galleryItem.dataset.audio);

        window.speechSynthesis?.cancel();

        audio.play().catch(() => {
            if (text && "speechSynthesis" in window) {
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
            }
        });
    });
});

document.querySelectorAll(".gallery-item img[data-fallback]").forEach((image) => {
    image.addEventListener("error", () => {
        image.src = image.dataset.fallback;
        image.removeAttribute("data-fallback");
    }, { once: true });
});
