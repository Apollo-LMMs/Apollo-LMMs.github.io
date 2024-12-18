// assets/scripts/star.js
(function() {
    let stars = [];
    let connections = [];
    let backgroundImage = null;

    const canvas = document.getElementById('starCanvas');
    const ctx = canvas.getContext('2d');
    const starInfo = document.getElementById('starInfo');

    let lastFrameTime = 0; 
    const pulseSpeed = 0.005;  
    const pulseRange = 0.25;    

    async function loadStars() {
        const response = await fetch('assets/config/stars.yaml');
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        backgroundImage = await loadImage(data.background_image);
        stars = (data.stars || []).map(star => {
            star.pulseOffset = Math.random() * Math.PI * 2;
            return star;
        });
        connections = data.connections || [];
        requestAnimationFrame(animate);
    }

    function loadImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });
    }

    function drawScene(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        }

        lastFrameTime = time;
        drawConnections();

        for (const star of stars) {
            const pulse = Math.sin((time * pulseSpeed) + star.pulseOffset) * pulseRange;
            const pulsedRadius = star.radius * (1 + pulse);

            ctx.beginPath();
            ctx.arc(star.x, star.y, pulsedRadius, 0, 2 * Math.PI);

            const gradient = ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, pulsedRadius * 2
            );
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }

    function drawConnections() {
        ctx.strokeStyle = 'rgba(0,255,255,0.5)';
        ctx.lineWidth = 1;

        for (const conn of connections) {
            const startIndex = conn[0] - 1;
            const endIndex = conn[1] - 1;
            if (stars[startIndex] && stars[endIndex]) {
                ctx.beginPath();
                ctx.moveTo(stars[startIndex].x, stars[startIndex].y);
                ctx.lineTo(stars[endIndex].x, stars[endIndex].y);
                ctx.stroke();
            }
        }
    }

    function isPointInStar(x, y, star) {
        const dx = x - star.x;
        const dy = y - star.y;
        return Math.sqrt(dx*dx + dy*dy) <= star.radius * (1 + pulseRange);
    }

    function updateHover(clientX, clientY, canvasX, canvasY) {
        const hovered = stars.find(star => isPointInStar(canvasX, canvasY, star));
        if (hovered) {
            // Convert star's canvas coordinates to client coordinates
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            const starClientX = rect.left + (hovered.x / scaleX);
            const starClientY = rect.top + (hovered.y / scaleY);
    
            // Set a fixed width for the starInfo box
            const boxWidth = 200; // adjust as needed
            starInfo.style.width = boxWidth + 'px';
    
            // Center the box horizontally below the star
            starInfo.style.left = (starClientX - boxWidth / 2) + 'px';
            // Position it slightly below the star
            starInfo.style.top = (starClientY + 20) + 'px';
    
            starInfo.textContent = hovered.text;
            starInfo.classList.add('visible');
        } else {
            starInfo.classList.remove('visible');
        }
    }
    

    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        return { x, y };
    }

    function handleMove(e) {
        const {x, y} = getCanvasCoordinates(e);
        updateHover(e.clientX, e.clientY, x, y);
    }
    
    function handleUp(e) {
        const {x, y} = getCanvasCoordinates(e);
        updateHover(e.clientX, e.clientY, x, y);
    }
    
    // Add both pointer and mouse listeners for cross-browser compatibility
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('mousemove', handleMove); // Fallback for Safari
    
    canvas.addEventListener('pointerup', handleUp);
    canvas.addEventListener('mouseup', handleUp); // Fallback for Safari
    // Add touch event listeners
    canvas.addEventListener('touchstart', handleTouch, {passive: false});
    canvas.addEventListener('touchmove', handleTouch, {passive: false});
    canvas.addEventListener('touchend', handleTouch, {passive: false});

    function handleTouch(e) {
        e.preventDefault(); 
        const touch = e.touches[0] || e.changedTouches[0];
        if (!touch) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;

        updateHover(touch.clientX, touch.clientY, x, y);
    }

    
    

    function animate(time) {
        drawScene(time);
        requestAnimationFrame(animate);
    }

    loadStars();
})();
