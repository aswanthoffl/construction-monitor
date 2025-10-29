# 🏗️ Construction Monitor

**Construction Monitor** is a comprehensive web application for monitoring and managing construction projects. It simplifies operations like floor plan management, panorama visualization, progress comparison, and report generation in a modern **Next.js** environment.

---

## 🚀 Live Demo

👉 [https://constructionmonitoringsite.netlify.app/](https://constructionmonitoringsite.netlify.app/)

---

## 📋 Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Technologies Used](#technologies-used)
* [Getting Started](#getting-started)
* [Usage Guide](#usage-guide)
* [Project Structure](#project-structure)
* [Environment Variables](#environment-variables)
* [Deployment](#deployment)
* [Contributing](#contributing)
* [Troubleshooting](#troubleshooting)
* [License](#license)

---

## 🧱 Overview

Construction Monitor streamlines the process of visualizing, tracking, and reporting progress in construction projects. Whether you are an engineer, project manager, or quality inspector, this platform provides the digital tools you need to monitor sites with precision.

---

## ✨ Features

### 🗺️ Floor Plan Management

* Upload, view, and edit site floor plans.
* Define and modify paths and zones interactively.
* Visualize 2D layouts with precision overlays.

### 📸 Panorama Viewer

* View 360° panoramic images directly in the browser.
* Navigate using compass and zoom controls.
* Integrate multiple panorama points for immersive site tours.

### 🎥 Camera Capture & Video Upload

* Capture live images using connected cameras.
* Upload and manage construction videos for documentation.

### ⏳ Timeline Comparison

* Compare project progress visually over time.
* Access side-by-side comparisons of images and reports.

### 🧾 Report Generation

* Generate detailed progress reports.
* Export/import reports as JSON or PDF for easy sharing.

### 🧭 Virtual Tour Management

* Create guided virtual tours for projects.
* Export/import tour configurations for team collaboration.

### 📊 Dashboard & Settings

* Centralized dashboard for managing all project data.
* Customizable settings for user preferences and system configuration.

---

## 🧰 Technologies Used

| Category           | Technology                                         |
| ------------------ | -------------------------------------------------- |
| Frontend           | Next.js, React, TypeScript                         |
| Styling            | Tailwind CSS, PostCSS                              |
| State Management   | React Hooks, Context API                           |
| Package Management | PNPM / NPM                                         |
| Deployment         | Netlify                                            |
| Utilities          | Custom Hooks, Toast Notifications, Image Utilities |

---

## ⚙️ Getting Started

### Prerequisites

Ensure you have the following installed:

* **Node.js** (v18 or later)
* **npm** (v9 or later)
* **pnpm** (preferred) or **yarn**

### Installation

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd construction-monitor-main
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start Development Server**

   ```bash
   pnpm run dev
   # or
   npm run dev
   ```

4. **Access Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧭 Usage Guide

### Floor Plan

* Upload new floor plans via the **Dashboard → Floor Plans**.
* Edit paths, add zones, and manage plan versions.

### Panorama

* Access the **Panorama Viewer** to visualize 360° site images.
* Use navigation controls to explore the site virtually.

### Timeline Comparison

* Navigate to **Timeline** to view construction progress.
* Compare two different project states side-by-side.

### Reports

* Generate, export, and import reports from the **Reports** section.
* Reports can include images, floor plans, and observations.

### Tours

* Create and manage interactive virtual tours.
* Export or import tours for other project members.

---

## 🗂️ Project Structure

```
construction-monitor-main/
├── app/                     # Next.js app routes and pages
│   ├── capture/              # Camera capture page
│   ├── comparison/           # Timeline comparison feature
│   ├── floor-plan/           # Floor plan management
│   ├── timeline/             # Progress timeline
│   ├── tour/                 # Virtual tour management
│   └── api/                  # API routes for backend logic
│
├── components/               # Reusable UI and feature components
│   ├── ui/                   # Buttons, dialogs, forms, etc.
│   └── panorama-viewer/      # Advanced 360° image viewer
│
├── hooks/                    # Custom React hooks
├── lib/                      # Utility libraries (image, geo, db, etc.)
├── public/                   # Static assets (images, icons, logos)
├── styles/                   # Global and component styles
├── next.config.mjs           # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── package.json              # Dependencies and scripts
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root and configure environment-specific values.

Example:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

---

## 🚀 Deployment

### Deploying to Netlify

1. Connect your GitHub repository to Netlify.
2. Set build command:

   ```
   npm run build
   ```
3. Set publish directory:

   ```
   .next
   ```
4. Configure environment variables in the Netlify dashboard.
5. Deploy and verify your live site.

---

## 🤝 Contributing

We welcome community contributions!

1. **Fork** the repository
2. **Create** a feature branch

   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes

   ```bash
   git commit -m "Add new feature"
   ```
4. **Push** the branch

   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open** a pull request and describe your changes.

For major updates, please open an issue first to discuss your proposal.

---

## 🧩 Troubleshooting

| Issue                    | Solution                                          |
| ------------------------ | ------------------------------------------------- |
| **Build errors**         | Check Node.js and package manager versions        |
| **Missing dependencies** | Run `pnpm install` or `npm install` again         |
| **Port already in use**  | Update port in `.env.local` (e.g., `PORT=4000`)   |
| **Deployment issues**    | Verify environment variables and Netlify settings |

---

## 🪪 License

This project is licensed under the **MIT License**.
You are free to use, modify, and distribute this project with proper attribution.

---

## 👷 Author

**Construction Monitor** is developed and maintained by the team to simplify and digitize the construction monitoring process.

---

Author: Aswanth 
https://www.linkedin.com/in/aswanth-a-aa7234256/
