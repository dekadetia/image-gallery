// import { createServer } from "node:http";
// import next from "next";
// import { Server } from "socket.io";

// const dev = process.env.NODE_ENV !== "production";
// const hostname = "localhost";
// const port = 3000;
// // when using middleware `hostname` and `port` must be provided below
// const app = next({ dev, hostname, port });
// const handler = app.getRequestHandler();

// app.prepare().then(() => {
//     const httpServer = createServer(handler);

//     const io = new Server(httpServer);

//     io.on("connection", (socket) => {
//         console.log('New client connected');

//         socket.on('disconnect', () => {
//             console.log('Client disconnected');
//         });

//         // Event for image upload
//         socket.on('imageUploaded', (data) => {
//             io.emit('imageUploaded', data); // Broadcast to all clients
//         });

//         // Event for image deletion
//         socket.on('imageDeleted', (data) => {
//             io.emit('imageDeleted', data); // Broadcast to all clients
//         });

//         // Event for image update
//         socket.on('imageUpdated', (data) => {
//             -
//             io.emit('imageUpdated', data); // Broadcast to all clients
//         });
//     });

//     httpServer
//         .once("error", (err) => {
//             console.error(err);
//             process.exit(1);
//         })
//         .listen(port, () => {
//             console.log(`> Ready on http://${hostname}:${port}`);
//         });
// });



const express = require('express');
const next = require('next');
const http = require('http');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    const httpServer = http.createServer(server);
    const io = new Server(
        httpServer,
        {
            cors: {
                origin: "https://image-gallery-omega-one.vercel.app", // Replace with your actual client origin
                methods: ["GET", "POST"]
            }
        }
    );

    io.on('connection', (socket) => {
        console.log('a user connected');
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });

        // Event for image upload
        socket.on('image_uploaded', (data) => {
            io.emit('image_uploaded', data); // Broadcast to all clients
        });

        // Event for image deletion
        socket.on('image_deleted', () => {
            io.emit('image_deleted'); // Broadcast to all clients
        });

        // Event for image update
        socket.on('image_updated', (data) => {
            io.emit('image_updated', data); // Broadcast to all clients
        });
    });

    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });

}).catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
});


