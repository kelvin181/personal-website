export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  links: {
    github?: string;
    live?: string;
  };
  content: string;
}

export const projects: Project[] = [
  {
    id: "cap-reranking",
    title: "CAP: Calibrated Adaptive Pairwise Re-ranking",
    description:
      "A novel text-to-image person re-identification method using multimodal LLMs for calibrated, adaptive pairwise re-ranking.",
    tags: ["Python", "PyTorch", "vLLM", "LoRA"],
    links: {
      github: "https://github.com/kelvin181/text-image-person-retrieval",
    },
    content: `# CAP: Calibrated Adaptive Pairwise Re-ranking

A novel text-to-image person re-identification method using multimodal LLMs.

## Overview
Designed and implemented the ranking pipeline end-to-end: run a base retriever, conduct pairwise
comparison of images using MLLMs with LoRA adapters, extract confidence scores for each image, and
combine those scores with the base ranking for a final ranking.

## Key Achievements
- Improved the base retriever by up to +3.1 Rank-1, +3.8 mAP, and +3.4 mINP across three benchmarks,
  matching or outperforming prior state-of-the-art MLLM re-rankers.
- Cut MLLM passes per query from 210 to 60 by deriving preferences symmetrically and skipping
  confidently-separated pairs, holding a similar positive gain at 3.5x lower cost.
`,
  },
  {
    id: "wdcc-dashboard",
    title: "WDCC Project Health Dashboard",
    description:
      "A dashboard tracking the health and velocity of 16 club-related projects, built as tech lead for a team of 10.",
    tags: ["Next.js", "TypeScript", "PostgreSQL", "Prisma"],
    links: {
      github: "https://github.com/UoaWDCC/projects-health-dashboard",
    },
    content: `# WDCC Project Health Dashboard

## Overview
Acted as tech lead for a team of 10 building a dashboard to track the progress of 16 club-related
projects.

## Key Achievements
- Designed and developed data ingestion pipelines, using CronJobs for weekly Discord/GitHub
  collection and GitHub webhooks for a live commit feed, enabling both trend analysis and real-time
  progress visibility.
- Implemented health and velocity scoring, using week-over-week and 4-week-average comparisons,
  surfacing at-risk projects at a glance without manual investigation.
`,
  },
  {
    id: "vps",
    title: "Virtual Patient Scenarios (VPS)",
    description:
      "A tool supporting interactive, immersive education for Medical and Health Science students at the University of Auckland through virtual patient scenarios.",
    tags: ["JavaScript", "TypeScript", "CSS"],
    links: {
      github: "https://github.com/UoaWDCC/VPS",
      live: "https://wdcc-vps.fly.dev/",
    },
    content: `# Virtual Patient Scenarios (VPS)

## Overview
A University of Auckland Web Development and Coding Club (WDCC) project providing Medical and
Health Science students with interactive, immersive virtual patient scenarios for learning.
`,
  },
  {
    id: "kefkode",
    title: "KefKode",
    description:
      "A LeetCode practice tracker for importing problems, filtering by topic and difficulty, and visualizing solve progress over time.",
    tags: ["React", "Express", "MongoDB", "Tailwind CSS"],
    links: {
      github: "https://github.com/kelvin181/KefKode",
      live: "https://kef-kode.vercel.app/",
    },
    content: `# KefKode

## Overview
A full-stack LeetCode practice tracker. Import problems, filter by topic and difficulty, and
visualize solve progress with charts and stats over time. Authentication is handled via Google
OAuth.

## Tech Stack
- React + Tailwind CSS frontend
- Express + MongoDB backend
- Passport.js (Google OAuth)
`,
  },
  {
    id: "dsa",
    title: "DSA Practice",
    description:
      "An ongoing collection of data structures and algorithms practice solutions, auto-synced from LeetCode.",
    tags: ["Python", "Algorithms", "Data Structures"],
    links: {
      github: "https://github.com/kelvin181/DSA",
    },
    content: `# DSA Practice

## Overview
An ongoing collection of data structures and algorithms practice solutions, managed and
auto-synced from LeetCode via the LeetPush extension.
`,
  },
  {
    id: "personal-os",
    title: "Personal OS Website",
    description:
      "An OS-like personal portfolio website with a virtual filesystem, terminal, and file manager.",
    tags: ["Next.js", "React", "TypeScript", "Redux Toolkit"],
    links: {
      github: "https://github.com/kelvin181/personal-website",
    },
    content: `# Personal OS Website

An interactive portfolio website that simulates a desktop operating system.

## Features
- Virtual filesystem with directories and files
- Terminal with Linux commands and portfolio commands
- File manager for visual browsing
- Text viewer with markdown rendering

## Tech Stack
- Next.js 16 + React 19
- TypeScript
- Redux Toolkit
- Tailwind CSS
`,
  },
];
