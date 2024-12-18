// assets/scripts/arch.js
(function() {
    let archStars = [];
    let archConnections = [];
    let archBackgroundImage = null;

    const archCanvas = document.getElementById('archCanvas');
    const archCtx = archCanvas.getContext('2d');
    const archInfo = document.getElementById('archInfo');

    let archLastFrameTime = 0; 
    const archPulseSpeed = 0.005;
    const archPulseRange = 0.25;

    async function loadArchData() {
        const response = await fetch('assets/config/arch.yaml');
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        archBackgroundImage = await loadArchImage(data.background_image);
        archStars = data.stars || [];
        archConnections = data.connections || [];
        requestAnimationFrame(archAnimate);
    }

    function loadArchImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });
    }

    function archDrawScene(time) {
        archCtx.clearRect(0, 0, archCanvas.width, archCanvas.height);
        if (archBackgroundImage) {
            archCtx.drawImage(archBackgroundImage, 0, 0, archCanvas.width, archCanvas.height);
        }

        archLastFrameTime = time;

        const pulse = Math.sin(time * archPulseSpeed) * archPulseRange;

        archDrawConnections();

        for (const star of archStars) {
            archCtx.beginPath();
            const pulsedRadius = star.radius * (1 + pulse);
            archCtx.arc(star.x, star.y, pulsedRadius, 0, 2 * Math.PI);

            const gradient = archCtx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, pulsedRadius * 2
            );
            gradient.addColorStop(0, 'red');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');

            archCtx.fillStyle = gradient;
            archCtx.fill();
        }
    }

    function archDrawConnections() {
        archCtx.strokeStyle = 'rgba(0,255,255,0.5)';
        archCtx.lineWidth = 1;
        for (const conn of archConnections) {
            const startIndex = conn[0] - 1;
            const endIndex = conn[1] - 1;
            if (archStars[startIndex] && archStars[endIndex]) {
                archCtx.beginPath();
                archCtx.moveTo(archStars[startIndex].x, archStars[startIndex].y);
                archCtx.lineTo(archStars[endIndex].x, archStars[endIndex].y);
                archCtx.stroke();
            }
        }
    }

    function archIsPointInStar(x, y, star) {
        const dx = x - star.x;
        const dy = y - star.y;
        return Math.sqrt(dx*dx + dy*dy) <= star.radius * (1 + archPulseRange);
    }

    function updateHover(clientX, clientY, canvasX, canvasY) {
        const hovered = archStars.find(star => archIsPointInStar(canvasX, canvasY, star));
        if (hovered) {
            archInfo.textContent = hovered.text;
            archInfo.style.left = (clientX + 10) + 'px';
            archInfo.style.top = (clientY + 10) + 'px';
            archInfo.classList.add('visible');
        } else {
            archInfo.classList.remove('visible');
        }
    }

    function getCanvasCoordinates(e) {
        const rect = archCanvas.getBoundingClientRect();
        const scaleX = archCanvas.width / rect.width;
        const scaleY = archCanvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        return { x, y };
    }

    archCanvas.style.touchAction = 'none';

    archCanvas.addEventListener('pointermove', (e) => {
        const {x, y} = getCanvasCoordinates(e);
        updateHover(e.clientX, e.clientY, x, y);
    });

    archCanvas.addEventListener('pointerup', (e) => {
        const {x, y} = getCanvasCoordinates(e);
        updateHover(e.clientX, e.clientY, x, y);
    });

    function archAnimate(time) {
        archDrawScene(time);
        requestAnimationFrame(archAnimate);
    }

    loadArchData();
})();
