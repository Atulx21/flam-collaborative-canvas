// client/js/canvas.js
export class CanvasEngine {
    constructor(canvasId, socket) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.socket = socket;
        
        this.isDrawing = false;
        this.currentPath = [];
        this.color = '#000000';
        this.width = 4;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initInputListeners();
    }

    resize() {
        // Handle high-DPI displays for crisp text/lines
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initInputListeners() {
        // Mouse Events
        this.canvas.addEventListener('mousedown', (e) => this.startStroke(e));
        this.canvas.addEventListener('mousemove', (e) => this.moveStroke(e));
        window.addEventListener('mouseup', () => this.endStroke());
        
        // Touch Events (Bonus: Mobile Support)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            this.startStroke(e.touches[0]);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.moveStroke(e.touches[0]);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', () => this.endStroke());
    }

    getPos(e) {
        return { x: e.clientX, y: e.clientY };
    }

    startStroke(e) {
        this.isDrawing = true;
        const pos = this.getPos(e);
        this.currentPath = [pos];
        
        // Draw a dot for single clicks
        this.ctx.beginPath();
        this.ctx.fillStyle = this.color;
        this.ctx.arc(pos.x, pos.y, this.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    moveStroke(e) {
        // Broadcast cursor position even if not drawing
        this.socket.emit('cursor_move', this.getPos(e));

        if (!this.isDrawing) return;

        const pos = this.getPos(e);
        this.currentPath.push(pos);

        // Render locally immediately (Optimistic UI)
        this.drawSmoothPath(this.currentPath, this.color, this.width);

        // Stream to server
        // Optimization: In a real app, we would throttle this
        this.socket.emit('draw_chunk', {
            points: this.currentPath.slice(-3), // Send only recent points
            color: this.color,
            width: this.width
        });
    }

    endStroke() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        
        // Commit the finished stroke to the server history
        this.socket.emit('draw_commit', {
            points: this.currentPath,
            color: this.color,
            width: this.width
        });
        
        this.currentPath = [];
    }

    // The Magic: Quadratic Bezier Curves for smoothness
    drawSmoothPath(points, color, width) {
        if (points.length < 2) return;

        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        // Handle the last 2 points
        if (points.length > 2) {
            const last = points[points.length - 1];
            const secondLast = points[points.length - 2];
            this.ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
        } else {
            this.ctx.lineTo(points[1].x, points[1].y);
        }

        this.ctx.stroke();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}