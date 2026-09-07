# Docker exercise: Run the React app in a container

[Dansk](README.da.md) | **English**

In this exercise, you will write a `Dockerfile`, build a Docker image, and start the app in a container. Docker must be installed and running. You do not need Bun installed on your computer because it is included in the image.

A **Dockerfile** is the recipe for an **image**, which contains the app and its runtime environment. A **container** is a running instance of the image.

The app in `react/` uses Bun to run `src/index.ts`. The server provides both the React page and the API routes under `/api/hello`.

## 1. Prepare the project

Start Docker Desktop if that is the Docker installation you use. Then open a terminal in `docker-exercise/react`. In VS Code, you can right-click the `react` folder and select **Open in Integrated Terminal**.

Run this command to check that your terminal can connect to Docker:

```bash
docker info
```

The command should display information about both the client and the server. If you get a Docker connection error, start Docker and try again.

Find `package.json` in the `react` folder. Under `scripts`, the app's `start` command runs `bun src/index.ts` with `NODE_ENV=production`. This tells us which runtime and entry point the container needs.

## 2. Create an empty Dockerfile

Create `react/Dockerfile` without a file extension. Place it next to `package.json` and `bun.lock`:

```text
docker-exercise/
└── react/
    ├── README.md
    ├── README.da.md
    ├── Dockerfile
    ├── .dockerignore
    ├── package.json
    ├── bun.lock
    └── src/
```

In VS Code, right-click the `react` folder, select **New File**, and enter `Dockerfile`. Use this exact name, without a suffix such as `.txt`.

## 3. Write the Dockerfile step by step

Add the following code blocks to the same `Dockerfile`, in order.

### Choose a runtime environment

Start the file with:

```dockerfile
FROM oven/bun:1
```

The app uses Bun, so we choose an image with Bun already installed. You do not need to install Bun yourself inside the container.

### Choose a folder for the app

Add:

```dockerfile
WORKDIR /app
```

`/app` is a folder inside the image. This is where we place the project and where the startup command will run.

### Install the project's packages

Add:

```dockerfile
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
```

`package.json` tells Bun which packages the project uses, while `bun.lock` locks their selected versions. We copy these files first so Docker can reuse the cached installation when only the app's code changes.

### Copy the app's code

Add:

```dockerfile
COPY . .
```

The first dot is the project folder you will later pass to `docker build`. The second is the current working directory inside the image: `/app`. This includes `src` and the minion image. In the next step, you will create a `.dockerignore` file to exclude local files.

### Set the environment and user

Add:

```dockerfile
ENV NODE_ENV=production
ENV PORT=3000

USER bun
```

The app's `src/index.ts` uses `NODE_ENV` to disable development features. `PORT` specifies the server's port. `USER bun` selects a user provided by the base image so the app runs without root privileges.

### Set the port and startup command

Finish the file with:

```dockerfile
EXPOSE 3000

CMD ["bun", "src/index.ts"]
```

`EXPOSE` documents the port, and `CMD` tells Docker how to start the server. Save the file.

### Reference: What do the instructions mean?

| Instruction | What does it do, and why is it included? |
| --- | --- |
| `FROM oven/bun:1` | Starts from Bun's official image with Bun 1 installed. The tag follows version 1; use a specific version or digest if you need to pin the base image. |
| `WORKDIR /app` | Creates and selects the working directory inside the image. Subsequent commands use this folder. |
| `COPY package.json bun.lock ./` | Copies the package list and locked dependencies first. |
| `RUN bun install --frozen-lockfile` | Installs dependencies while building the image. Fails if installation would require changes to the lockfile. |
| `COPY . .` | Copies the remaining app files from the build context into `/app`, excluding files matched by `.dockerignore`. |
| `ENV NODE_ENV=production` | Makes this app's server disable development features such as hot reload. |
| `ENV PORT=3000` | Specifies the port the Bun server should listen on. |
| `USER bun` | Runs the app as the image's `bun` user, so the process does not need root privileges. |
| `EXPOSE 3000` | Documents the container's port. You still need to publish it with `docker run -p`. |
| `CMD ["bun", "src/index.ts"]` | Starts the server when the container starts. |

`RUN` executes when the image is built; `CMD` specifies the default command when the container starts. See the [Dockerfile reference](https://docs.docker.com/reference/dockerfile/).

Dependencies are copied and installed before the rest of the code so Docker can reuse the installation layer when you only change a file such as `App.tsx`. This example uses Bun's official image and a frozen lockfile installation as shown in [Bun's Docker guide](https://bun.com/guides/ecosystem/docker).

We also install development dependencies to keep the exercise simple. `NODE_ENV` is set afterwards.

### Why is there no `RUN bun run build`?

In this project, `src/index.ts` imports `src/index.html` and serves it through Bun. We therefore start the server directly and include the source code in the image. The project's `build` script builds frontend files into `dist/`, but the server is not configured to serve that folder. That would require a different setup.

## 4. Create a .dockerignore file

Right-click the `react` folder again, select **New File**, and name it `.dockerignore`, including the leading dot. Paste the following and save the file:

```dockerignore
node_modules
dist
.git
.DS_Store
*.log
.env
.env.*
```

`node_modules` must be installed inside the image to get packages for the container's environment. This setup does not include `dist`. The other entries exclude Git data, local files, and environment files that may contain secrets.

Docker removes matching files from the build context before sending it to the builder. See the [Docker documentation on .dockerignore](https://docs.docker.com/build/concepts/context/#dockerignore-files).

## 5. Build the image

Use the terminal from step 1, in `docker-exercise/react`, and run:

```bash
docker build -t minion-app .
```

`-t minion-app` gives the image a name. The dot selects the current folder as the **build context**: the files Docker can use in instructions such as `COPY`.

Wait for the build to finish without errors. The first time, Docker needs to download the base image and install packages. Then check that your image exists:

```bash
docker image ls minion-app
```

You should see a row named `minion-app`.

## 6. Start and test the container

Run this in the same terminal:

```bash
docker run --rm --name minion-app -p 127.0.0.1:3000:3000 minion-app
```

- `--rm` removes the container when it stops. The image remains.
- `--name minion-app` gives the container a name.
- `-p 127.0.0.1:3000:3000` connects port 3000 on your computer's localhost to port 3000 inside the container.
- The final `minion-app` is the name of the image to run.

Bun listens on `0.0.0.0` inside the container by default, allowing Docker to forward traffic to the server. See [Bun's server documentation](https://bun.com/docs/runtime/http/server).

Open http://localhost:3000 in your browser. You should see the React page with the minion image. Also test http://localhost:3000/api/hello, which should return JSON containing `"message": "Hello, world!"` and `"method": "GET"`.

Stop the container with `Ctrl+C`, or run this in another terminal:

```bash
docker stop minion-app
```

## 7. Try changing the app

Edit the text in `src/App.tsx` and save the file. The running container uses the copy placed in the image during the build.

1. Stop the container with `Ctrl+C` in the terminal where it is running.
2. Build a new image and start a new container with the commands below.
3. Reload the page in your browser and check that your change appears.

```bash
docker build -t minion-app .
docker run --rm --name minion-app -p 127.0.0.1:3000:3000 minion-app
```

## 8. Run another container with the same image

Try starting a second container from the `minion-app` image while the first container is still running.

Consider how do you test that the other is running both in CLI and in the browser?
