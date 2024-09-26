const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== 'production';
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(async () => {

    const httpServer = createServer(handler);

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
        });
        
        socket.on('images_fetched', () => {
            io.emit('images_fetched');
            console.log('all images are fetched')
        });

        socket.on('upload', (data) => {
            console.log({ data: data });

            io.emit('upload', data); //Broadcast to all clients
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });

    /*const server = express();
    server.use(cors());

    const httpServer = http.createServer(server);
    const io = socketIO(httpServer);


    io.on('connection', (socket) => {
        console.log('a user connected');

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });

        //Event for image upload
        socket.on('images_fetched', () => {
            io.emit('images_fetched'); //Broadcast to all clients
            console.log('all images are fetched')
        });

        //Event for image upload
        socket.on('image_uploaded', (data) => {
            io.emit('image_uploaded', data); //Broadcast to all clients
        });

        //Event for image deletion
        socket.on('image_deleted', () => {
            io.emit('image_deleted'); //Broadcast to all clients
        });

        //Event for image update
        socket.on('image_updated', (data) => {
            io.emit('image_updated', data); //Broadcast to all clients
        });
    });

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });*/

}).catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
});


