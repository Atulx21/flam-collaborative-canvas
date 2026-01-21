// client/js/socket.js
import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

class SocketClient {
    constructor() {
        this.socket = io();
        this.isConnected = false;
    }

    on(event, callback) {
        this.socket.on(event, callback);
    }

    emit(event, data) {
        this.socket.emit(event, data);
    }

    connect() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('Connected with ID:', this.socket.id);
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
        });
    }
}

export const socketClient = new SocketClient();