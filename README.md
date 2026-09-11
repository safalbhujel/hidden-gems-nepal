# 🏔️ HiddenGems Nepal

> *"Discover the Nepal that everyone misses."*

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![PostGIS](https://img.shields.io/badge/PostGIS-Enabled-47A248?style=for-the-badge&logo=postgresql)](https://postgis.net/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

[Live Demo ↗](https://hiddengems-nepal.vercel.app) • [Documentation 📚](./docs) • [Report Bug 🐛](https://github.com/safalbhujel/hidden-gems-nepal/issues) • [Request Feature ✨](https://github.com/safalbhujel/hidden-gems-nepal/issues)

</div>

---

## 🌟 What is HiddenGems Nepal?

Tired of visiting the same overcrowded tourist spots? **HiddenGems Nepal** is a community-driven discovery platform designed to help you find the *real* Nepal — the hidden waterfalls, cozy local cafés, quiet sunset viewpoints, and authentic food spots that make travel truly memorable.

Whether you're looking for a peaceful nature escape, a short hiking trail, or the perfect date spot, HiddenGems Nepal connects you with places worth discovering, curated by locals and travelers just like you.

**The simple idea:** If it deserves to be found, it belongs on HiddenGems Nepal.

---

## 💡 The Problem vs. Our Solution

### 🚫 The Problem
Most travel apps and social media algorithms push the same 5–10 popular destinations. Meanwhile, thousands of amazing places across Nepal remain invisible:
- Hidden gems are scattered across fragmented social media posts and word-of-mouth.
- Popular spots suffer from overtourism while local treasures go undiscovered.
- There is no single platform to find places based on *what you actually want to experience*.

### 🚀 The Solution
HiddenGems Nepal flips the script. Instead of scrolling through generic directories, you:
1. **Tell us your vibe** — a quiet café, a nature escape, a food adventure, or a sunset view.
2. **We show you what's nearby** — places perfectly matched to your mood and location across all 77 districts.
3. **You discover together** — backed by real photos, reviews, and tips from the community.

---

## ✨ Features That Make Discovery Easy

### 🎯 Smart, Intent-Based Discovery
- Search by experience, not just place names.
- Filter by mood, category, and vibe using intuitive tags (e.g., `Waterfall` + `Date Spot` + `Photography`).
- Comprehensive coverage of all 7 provinces and 77 districts of Nepal.

### 🗺️ Location-Aware Exploration
- Explore hidden gems visually on an interactive, custom-styled Mapbox map.
- "Find gems near me" powered by native PostGIS radius queries.
- One-click Google Maps directions from your live location to the pinned spot.

### 📸 See Before You Go
- Rich media support with up to 6 reorderable images per place.
- Optional external video embeds (YouTube/TikTok) to bring places to life.
- Authentic ratings, reviews, and practical travel tips from the community.

### 💫 Signature "Hidden Score"
Our unique differentiating metric estimates how under-the-radar a place is. It helps you find genuine, uncrowded spots, not tourist traps.

### 🤝 Community-Powered & Trusted
- **Submit a Gem:** Share your own discoveries with a structured, easy-to-use workflow.
- **Quality Assurance:** Every submission passes through an admin moderation queue to prevent spam and ensure accuracy.
- **Personalization:** Save your favorite spots to build a personal wishlist for future adventures.

---

## 🛠️ Technology Behind the Scenes

We built HiddenGems Nepal with a modern, scalable, and secure full-stack ecosystem:

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 14+](https://nextjs.org/) | Fast, SEO-friendly, full-stack App Router |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type safety and maintainable code |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Beautiful, accessible, and responsive UI |
| **Backend** | [Supabase](https://supabase.com/) | Managed PostgreSQL, Auth, and Storage |
| **Geospatial** | [PostGIS](https://postgis.net/) | Lightning-fast nearby/radius location queries |
| **Maps** | [Mapbox GL JS](https://www.mapbox.com/) | Interactive, custom-styled mapping experience |
| **Deployment** | [Vercel](https://vercel.com/) | Edge network hosting and CI/CD |

---

## 🚀 Getting Started (For Developers)

Want to contribute to the codebase? Follow these steps to run the project locally.

### Prerequisites
- **Node.js** 18.17 or later
- **npm**, **yarn**, **pnpm**, or **bun**
- A **Supabase** project with the **PostGIS** extension enabled
- A **Mapbox** access token (free tier is sufficient)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/safalbhujel/hidden-gems-nepal.git
cd hidden-gems-nepal