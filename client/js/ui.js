// client/js/ui.js
export class UIManager {
    constructor() {
        this.statusDot = document.getElementById('connectionStatus');
        this.statusText = document.getElementById('statusText');
        this.usersList = document.getElementById('usersList');
    }

    setConnectionStatus(isConnected) {
        if (isConnected) {
            this.statusDot.classList.remove('disconnected');
            this.statusDot.classList.add('connected');
            this.statusText.innerText = 'Connected';
        } else {
            this.statusDot.classList.remove('connected');
            this.statusDot.classList.add('disconnected');
            this.statusText.innerText = 'Reconnecting...';
        }
    }

    // Updates the bubbles in the top right
    updateUserList(users) {
        this.usersList.innerHTML = ''; // Clear current list
        
        users.forEach(user => {
            const bubble = document.createElement('div');
            bubble.className = 'user-bubble';
            bubble.style.backgroundColor = user.color;
            // Show first 2 letters of ID as avatar
            bubble.innerText = user.id.slice(0, 2).toUpperCase();
            bubble.title = `User ${user.id}`;
            this.usersList.appendChild(bubble);
        });
    }

    // Shows a "Toast" notification at the bottom
    showNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerText = message;
        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}