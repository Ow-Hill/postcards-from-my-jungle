const galleryItems = [...document.querySelectorAll(".gallery-item")];
const modeToggle = document.querySelector(".display-mode-toggle");
const hockeyPusher = document.querySelector(".hockey-pusher");
const display = document.createElement("dialog");
display.className = "animal-display";
display.setAttribute("aria-label", "Animal display");
document.body.append(display);

const closeButton = document.createElement("button");
closeButton.className = "display-close";
closeButton.type = "button";
closeButton.textContent = "Close";
closeButton.setAttribute("aria-label", "Close animal display");
const displayImage = document.createElement("img");
displayImage.className = "display-image";
const displayText = document.createElement("p");
displayText.className = "display-text";
const displayAudio = document.createElement("audio");
displayAudio.className = "display-audio";
displayAudio.controls = true;
display.append(closeButton, displayImage, displayText, displayAudio);

let selectedItem = null;
let lastTrigger = null;
const imageColors = new WeakMap();

function readAverageImageColor(image) {
    if (!image.complete || !image.naturalWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    try {
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let red = 0;
        let green = 0;
        let blue = 0;
        let count = 0;
        for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index + 3] < 48) continue;
            red += pixels[index];
            green += pixels[index + 1];
            blue += pixels[index + 2];
            count += 1;
        }
        imageColors.set(image, count
            ? [Math.round(red / count), Math.round(green / count), Math.round(blue / count)]
            : [96, 142, 65]);
    } catch {
        imageColors.set(image, [96, 142, 65]);
    }
}

function closeDisplay() {
    if (!display.open) return;
    display.close();
    displayAudio.pause();
    displayAudio.currentTime = 0;
    selectedItem?.classList.remove("is-open");
    selectedItem = null;
    lastTrigger?.focus();
}

closeButton.addEventListener("click", closeDisplay);
display.addEventListener("click", (event) => {
    if (event.target === display) closeDisplay();
});
display.addEventListener("cancel", closeDisplay);

galleryItems.forEach((item, index) => {
    const image = item.querySelector("img");
    const phrase = item.querySelector(".animal-text");
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "dvd-logo";
    image.alt = `Animal ${index + 1}`;
    image.loading = "eager";
    trigger.append(image);
    trigger.setAttribute("aria-label", `Open animal ${index + 1}`);
    item.replaceChildren(trigger);

    image.addEventListener("error", () => {
        if (image.dataset.fallback) {
            image.src = image.dataset.fallback;
            delete image.dataset.fallback;
        }
    });
    image.addEventListener("load", () => readAverageImageColor(image));
    readAverageImageColor(image);

    item.addEventListener("click", () => {
        if (display.open) closeDisplay();
        selectedItem = item;
        lastTrigger = trigger;
        item.classList.add("is-open");
        displayImage.src = image.currentSrc || image.src;
        displayImage.alt = image.alt;
        displayText.textContent = phrase?.textContent.trim() || "";
        displayAudio.src = item.dataset.audio;
        display.showModal();
    });
});

const gallery = document.querySelector(".gallery");
const titleCard = document.querySelector(".home-header");
let titleX = 16;
let titleY = 64;
let titleVx = 1.8;
let titleVy = 1.5;
const movers = galleryItems.map((item) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 1.4;
    return {
        item,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        lastSpinAt: 0,
        logo: item.querySelector(".dvd-logo"),
        logoX: Math.random() * 10,
        logoY: Math.random() * 10,
        logoVx: (Math.random() < 0.5 ? -1 : 1) * (0.75 + Math.random() * 0.45),
        logoVy: (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.45),
        lastPusherHitAt: 0,
    };
});

let pusherX = 20;
let pusherY = 20;
let pusherVelocityX = 0;
let pusherVelocityY = 0;
let pusherDragging = false;
let pusherOffsetX = 0;
let pusherOffsetY = 0;
let lastPusherMove = 0;

function movePusherTo(x, y) {
    pusherX = Math.max(0, Math.min(window.innerWidth - hockeyPusher.offsetWidth, x));
    pusherY = Math.max(0, Math.min(window.innerHeight - hockeyPusher.offsetHeight, y));
    hockeyPusher.style.left = `${pusherX}px`;
    hockeyPusher.style.top = `${pusherY}px`;
}

hockeyPusher.addEventListener("pointerdown", (event) => {
    if (document.body.classList.contains("is-paused")) return;
    pusherDragging = true;
    pusherOffsetX = event.clientX - pusherX;
    pusherOffsetY = event.clientY - pusherY;
    lastPusherMove = performance.now();
    hockeyPusher.setPointerCapture(event.pointerId);
    hockeyPusher.classList.add("is-dragging");
    event.preventDefault();
});

hockeyPusher.addEventListener("pointermove", (event) => {
    if (!pusherDragging) return;
    const now = performance.now();
    const nextX = event.clientX - pusherOffsetX;
    const nextY = event.clientY - pusherOffsetY;
    const elapsed = Math.max(1, now - lastPusherMove);
    pusherVelocityX = Math.max(-14, Math.min(14, (nextX - pusherX) * 16 / elapsed));
    pusherVelocityY = Math.max(-14, Math.min(14, (nextY - pusherY) * 16 / elapsed));
    lastPusherMove = now;
    movePusherTo(nextX, nextY);
});

function releasePusher() {
    pusherDragging = false;
    pusherVelocityX = 0;
    pusherVelocityY = 0;
    hockeyPusher.classList.remove("is-dragging");
}

hockeyPusher.addEventListener("pointerup", releasePusher);
hockeyPusher.addEventListener("pointercancel", releasePusher);

function rotatedBounds(mover) {
    const radians = mover.rotation * Math.PI / 180;
    const width = mover.item.offsetWidth;
    const height = mover.item.offsetHeight;
    const rotatedWidth = width * Math.abs(Math.cos(radians)) + height * Math.abs(Math.sin(radians));
    const rotatedHeight = height * Math.abs(Math.cos(radians)) + width * Math.abs(Math.sin(radians));
    return {
        width: rotatedWidth,
        height: rotatedHeight,
        insetX: (rotatedWidth - width) / 2,
        insetY: (rotatedHeight - height) / 2,
    };
}

function clampMover(mover) {
    const bounds = rotatedBounds(mover);
    const maxX = gallery.clientWidth - mover.item.offsetWidth - bounds.insetX;
    const maxY = gallery.clientHeight - mover.item.offsetHeight - bounds.insetY;
    mover.x = Math.max(bounds.insetX, Math.min(maxX, mover.x));
    mover.y = Math.max(bounds.insetY, Math.min(maxY, mover.y));
}

function spinOnCollision(mover, normalX, normalY) {
    const now = performance.now();
    if (now - mover.lastSpinAt < 180) return;
    mover.lastSpinAt = now;
    const tangent = normalX * mover.vy - normalY * mover.vx;
    const direction = Math.sign(tangent) || Math.sign(normalX - normalY) || 1;
    const amount = Math.min(10, 3 + Math.hypot(mover.vx, mover.vy) * 1.8);
    mover.rotation = (mover.rotation + direction * amount + 360) % 360;
    mover.item.style.transition = "transform 220ms ease-out";
    mover.item.style.transform = `rotate(${mover.rotation}deg)`;
    const baseColor = imageColors.get(mover.logo.querySelector("img")) || [96, 142, 65];
    const variedColor = baseColor.map((channel) => {
        const varied = channel + (Math.random() - 0.5) * 56;
        return Math.max(0, Math.min(255, Math.round(varied + (255 - varied) * 0.32)));
    });
    mover.item.style.setProperty("--impact-glow", `rgba(${variedColor.join(", ")}, 0.98)`);
    mover.item.style.setProperty("--impact-fill", `rgba(${variedColor.join(", ")}, 0.56)`);
    mover.item.classList.remove("is-bumping");
    void mover.item.offsetWidth;
    mover.item.classList.add("is-bumping");
}

function sizeGallery() {
    if (!document.body.classList.contains("non-normal-display")) {
        gallery.style.height = "";
        titleCard.style.left = "";
        titleCard.style.top = "";
        titleCard.style.width = "";
        movers.forEach(({ item }) => {
            item.style.width = "";
            item.style.height = "";
            item.style.left = "";
            item.style.top = "";
        });
        return;
    }
    const columns = 4;
    const rows = Math.ceil(movers.length / columns);
    const gap = 12;
    const galleryWidth = window.innerWidth;
    const galleryHeight = window.innerHeight;
    gallery.style.height = `${galleryHeight}px`;
    titleCard.style.left = `${titleX}px`;
    titleCard.style.top = `${titleY}px`;
    titleX = Math.max(0, Math.min(galleryWidth - titleCard.offsetWidth, titleX));
    titleY = Math.max(0, Math.min(galleryHeight - titleCard.offsetHeight, titleY));
    titleCard.style.left = `${titleX}px`;
    titleCard.style.top = `${titleY}px`;
    const firstRowY = titleY + titleCard.offsetHeight + 20;
    const size = Math.max(1, Math.min(
        220,
        (galleryWidth - gap * (columns - 1)) / columns,
        (galleryHeight - firstRowY - gap * (rows - 1)) / rows,
    ));
    movers.forEach(({ item }, index) => {
        item.style.width = `${size}px`;
        item.style.height = `${size}px`;
        const column = index % columns;
        const row = Math.floor(index / columns);
        if (item !== selectedItem) {
            movers[index].x = column * (size + gap);
            movers[index].y = firstRowY + row * (size + gap);
        }
        clampMover(movers[index]);
        item.style.transform = `rotate(${movers[index].rotation}deg)`;
        item.style.left = `${movers[index].x}px`;
        item.style.top = `${movers[index].y}px`;
    });
}

modeToggle.addEventListener("click", () => {
    const isPaused = document.body.classList.toggle("is-paused");
    modeToggle.textContent = isPaused ? "Resume bouncing" : "Static display";
});

sizeGallery();
window.addEventListener("resize", () => {
    sizeGallery();
    movePusherTo(pusherX, pusherY);
});

function animateLogos() {
    if (document.body.classList.contains("is-paused")) {
        requestAnimationFrame(animateLogos);
        return;
    }
    const titleMaxX = Math.max(0, window.innerWidth - titleCard.offsetWidth);
    const titleMaxY = Math.max(0, window.innerHeight - titleCard.offsetHeight);
    titleX += titleVx;
    titleY += titleVy;
    if (titleX <= 0 || titleX >= titleMaxX) titleVx *= -1;
    if (titleY <= 0 || titleY >= titleMaxY) titleVy *= -1;
    titleX = Math.max(0, Math.min(titleMaxX, titleX));
    titleY = Math.max(0, Math.min(titleMaxY, titleY));
    titleCard.style.left = `${titleX}px`;
    titleCard.style.top = `${titleY}px`;

    for (const mover of movers) {
        if (mover.item === selectedItem) continue;
        const bounds = rotatedBounds(mover);
        const minX = bounds.insetX;
        const minY = bounds.insetY;
        const maxX = Math.max(minX, gallery.clientWidth - mover.item.offsetWidth - bounds.insetX);
        const maxY = Math.max(minY, gallery.clientHeight - mover.item.offsetHeight - bounds.insetY);
        mover.x += mover.vx;
        mover.y += mover.vy;
        const hitX = mover.x <= minX || mover.x >= maxX;
        const hitY = mover.y <= minY || mover.y >= maxY;
        if (hitX) mover.vx *= -1;
        if (hitY) mover.vy *= -1;
        mover.x = Math.min(maxX, Math.max(minX, mover.x));
        mover.y = Math.min(maxY, Math.max(minY, mover.y));
        if (hitX || hitY) {
            const normalX = hitX ? (mover.x <= minX ? 1 : -1) : 0;
            const normalY = hitY ? (mover.y <= minY ? 1 : -1) : 0;
            spinOnCollision(mover, normalX, normalY);
            clampMover(mover);
        }
        mover.item.style.left = `${mover.x}px`;
        mover.item.style.top = `${mover.y}px`;

        const logoMaxX = Math.max(0, mover.item.clientWidth - mover.logo.offsetWidth);
        const logoMaxY = Math.max(0, mover.item.clientHeight - mover.logo.offsetHeight);
        mover.logoX += mover.logoVx;
        mover.logoY += mover.logoVy;
        if (mover.logoX <= 0 || mover.logoX >= logoMaxX) mover.logoVx *= -1;
        if (mover.logoY <= 0 || mover.logoY >= logoMaxY) mover.logoVy *= -1;
        mover.logoX = Math.min(logoMaxX, Math.max(0, mover.logoX));
        mover.logoY = Math.min(logoMaxY, Math.max(0, mover.logoY));
        mover.logo.style.left = `${mover.logoX}px`;
        mover.logo.style.top = `${mover.logoY}px`;
    }

    if (pusherDragging) {
        const puckRadius = hockeyPusher.offsetWidth / 2;
        const puckCenterX = pusherX + puckRadius;
        const puckCenterY = pusherY + puckRadius;
        for (const mover of movers) {
            if (mover.item === selectedItem) continue;
            const bounds = rotatedBounds(mover);
            const centerX = mover.x + mover.item.offsetWidth / 2;
            const centerY = mover.y + mover.item.offsetHeight / 2;
            const nearestX = Math.max(centerX - bounds.width / 2, Math.min(puckCenterX, centerX + bounds.width / 2));
            const nearestY = Math.max(centerY - bounds.height / 2, Math.min(puckCenterY, centerY + bounds.height / 2));
            const dx = centerX - nearestX;
            const dy = centerY - nearestY;
            const distance = Math.hypot(dx, dy);
            if (distance >= puckRadius + 8 || performance.now() - mover.lastPusherHitAt < 45) continue;

            const directionX = distance ? dx / distance : Math.sign(pusherVelocityX) || 1;
            const directionY = distance ? dy / distance : Math.sign(pusherVelocityY) || 0;
            mover.vx = Math.max(-8.5, Math.min(8.5, mover.vx + directionX * 2.5 + pusherVelocityX * 0.65));
            mover.vy = Math.max(-8.5, Math.min(8.5, mover.vy + directionY * 2.5 + pusherVelocityY * 0.65));
            mover.lastPusherHitAt = performance.now();
        }
    }

    for (const mover of movers) {
        const moverIsStill = mover.item === selectedItem;
        const collisionInset = 0;
        const titleCollisionWidth = Math.max(0, titleCard.offsetWidth - collisionInset * 2);
        const titleCollisionHeight = Math.max(0, titleCard.offsetHeight - collisionInset * 2);
        const bounds = rotatedBounds(mover);
        const dx = titleX + titleCard.offsetWidth / 2 - (mover.x + mover.item.offsetWidth / 2);
        const dy = titleY + titleCard.offsetHeight / 2 - (mover.y + mover.item.offsetHeight / 2);
        const overlapX = (titleCollisionWidth + bounds.width) / 2 - Math.abs(dx);
        const overlapY = (titleCollisionHeight + bounds.height) / 2 - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        if (overlapX < overlapY) {
            const direction = dx < 0 ? -1 : 1;
            const overlap = moverIsStill ? overlapX : overlapX / 2;
            titleX += direction * overlap;
            if (moverIsStill) titleVx = direction * Math.abs(titleVx);
            else {
                mover.x -= direction * overlap;
                if ((titleVx - mover.vx) * direction < 0) [titleVx, mover.vx] = [mover.vx, titleVx];
            }
            if (!moverIsStill) spinOnCollision(mover, -direction, 0);
        } else {
            const direction = dy < 0 ? -1 : 1;
            const overlap = moverIsStill ? overlapY : overlapY / 2;
            titleY += direction * overlap;
            if (moverIsStill) titleVy = direction * Math.abs(titleVy);
            else {
                mover.y -= direction * overlap;
                if ((titleVy - mover.vy) * direction < 0) [titleVy, mover.vy] = [mover.vy, titleVy];
            }
            if (!moverIsStill) spinOnCollision(mover, 0, -direction);
        }

        titleX = Math.max(0, Math.min(titleMaxX, titleX));
        titleY = Math.max(0, Math.min(titleMaxY, titleY));
        clampMover(mover);
        titleCard.style.left = `${titleX}px`;
        titleCard.style.top = `${titleY}px`;
        mover.item.style.left = `${mover.x}px`;
        mover.item.style.top = `${mover.y}px`;
    }

    for (let i = 0; i < movers.length; i += 1) {
        const a = movers[i];
        for (let j = i + 1; j < movers.length; j += 1) {
            const b = movers[j];
            const aIsStill = a.item === selectedItem;
            const bIsStill = b.item === selectedItem;
            if (aIsStill && bIsStill) continue;
            const aBounds = rotatedBounds(a);
            const bBounds = rotatedBounds(b);
            const dx = a.x + a.item.offsetWidth / 2 - (b.x + b.item.offsetWidth / 2);
            const dy = a.y + a.item.offsetHeight / 2 - (b.y + b.item.offsetHeight / 2);
            const overlapX = (aBounds.width + bBounds.width) / 2 - Math.abs(dx);
            const overlapY = (aBounds.height + bBounds.height) / 2 - Math.abs(dy);
            if (overlapX <= 0 || overlapY <= 0) continue;

            if (overlapX < overlapY) {
                const direction = dx < 0 ? -1 : 1;
                const pushA = aIsStill ? 0 : bIsStill ? overlapX : overlapX / 2;
                const pushB = bIsStill ? 0 : aIsStill ? overlapX : overlapX / 2;
                a.x += direction * pushA;
                b.x -= direction * pushB;
                if (aIsStill) b.vx = -direction * Math.abs(b.vx);
                else if (bIsStill) a.vx = direction * Math.abs(a.vx);
                else if ((a.vx - b.vx) * direction < 0) [a.vx, b.vx] = [b.vx, a.vx];
                if (!aIsStill) spinOnCollision(a, direction, 0);
                if (!bIsStill) spinOnCollision(b, -direction, 0);
            } else {
                const direction = dy < 0 ? -1 : 1;
                const pushA = aIsStill ? 0 : bIsStill ? overlapY : overlapY / 2;
                const pushB = bIsStill ? 0 : aIsStill ? overlapY : overlapY / 2;
                a.y += direction * pushA;
                b.y -= direction * pushB;
                if (aIsStill) b.vy = -direction * Math.abs(b.vy);
                else if (bIsStill) a.vy = direction * Math.abs(a.vy);
                else if ((a.vy - b.vy) * direction < 0) [a.vy, b.vy] = [b.vy, a.vy];
                if (!aIsStill) spinOnCollision(a, 0, direction);
                if (!bIsStill) spinOnCollision(b, 0, -direction);
            }
            clampMover(a);
            clampMover(b);
            a.item.style.left = `${a.x}px`;
            a.item.style.top = `${a.y}px`;
            b.item.style.left = `${b.x}px`;
            b.item.style.top = `${b.y}px`;
        }
    }
    requestAnimationFrame(animateLogos);
}

requestAnimationFrame(animateLogos);
