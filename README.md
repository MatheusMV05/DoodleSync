# DoodleSync

DoodleSync is a productivity and collaboration SaaS based on Excalidraw, featuring folder organization, email permissions, and real-time collaboration.

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure Firebase**
    *   Create a Firebase project at [firebase.google.com](https://firebase.google.com).
    *   Enable **Authentication** (Google Provider).
    *   Enable **Firestore Database**.
    *   Copy your Firebase configuration keys.
    *   Create a `.env` file based on `.env.example` and fill in your keys.

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

## Features

*   **Dashboard**: Organize your drawings in folders.
*   **Editor**: Full Excalidraw integration with custom header.
*   **Collaboration**: Real-time collaboration (requires `excalidraw-room` server).
*   **Persistence**: Auto-save to Firestore.

## Deployment

To build for production:

```bash
npm run build
```

## Troubleshooting

*   **Build Errors**: If you encounter type errors during build, check `src/contexts/AuthContext.tsx` and `src/pages/Editor.tsx` for any strict type mismatches with the installed libraries.
*   **Collaboration**: Ensure the `COLLAB_SERVER_URL` in `src/pages/Editor.tsx` points to a running `excalidraw-room` instance.
