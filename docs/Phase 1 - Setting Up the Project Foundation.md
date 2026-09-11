# **Step 1 — Setting Up the Project Foundation**

## **1\. Starting the Project**

I started development of **HiddenGems Nepal** by first preparing my development environment.

Before creating the actual application, I wanted to make sure the basic development tools were installed and working properly. I checked **Node.js, npm, and Git**, since these tools would be important throughout the project.

The versions I verified were:

&nbsp;

**node \-v  \>\>** Node.js — 22.17.0

**npm \-v  \>\>** npm — 10.9.2

**git \--version \>\>** Git — 2.51.0.windows.2

Everything was working properly, so I moved on to creating the project.

---

## **2\. Creating the Next.js Application**

I decided to build HiddenGems Nepal using **Next.js with TypeScript**.

I created the project using:

**npx create-next-app@latest hidden-gems-nepal**

During the setup, Next.js asked several configuration questions. I selected the options based on how I wanted to structure the project.

### **Configuration I Selected**

**TypeScript**          — Yes

**ESLint**              — Yes

**React Compiler**      — No

**Tailwind CSS**        — Yes

**src/ Directory**      — No

**App Router**          — Yes

**Import Alias**        — Default

**AGENTS.md**            — Yes

This gave me a clean and modern starting point for the application.

I chose **TypeScript** because I wanted better type safety while building a larger application.

I enabled **ESLint** to help catch coding problems and maintain cleaner code.

I enabled **Tailwind CSS** because I planned to build the interface with a custom design instead of depending on a ready-made CSS framework.

I also selected the **Next.js App Router**, which would be used to organize the application's pages and routing.

---

## **3\. Checking Whether the Application Worked**

After the project was created, I wanted to make sure everything was working before making any changes.

I started the development server:

**npm run dev**

Next.js started successfully.

The application became available at:

**http://localhost:3000**

I opened the address in my browser and saw the default Next.js starter page.

This confirmed that:

* Next.js was installed correctly.  
* Dependencies were installed correctly.  
* The development server was working.  
* The browser could access the application.  
* My local development environment was ready.

&nbsp;

The project was running on:

Next.js 16.3.4

Turbopack

At this point, I had a working but completely default Next.js application.

---

## **4\. Discovering a Git Problem**

After creating the project, I checked the Git setup.

I discovered that the project was originally created inside:

D:\\Safal\_Projects\\Project\\hidden-gems-nepal

The problem was that D:\\Safal\_Projects was already part of another Git repository.

That meant HiddenGems Nepal could potentially become mixed with files and Git history from my other projects.

I did not want that.

I wanted HiddenGems Nepal to have its **own independent repository**.

---

## **5\. Moving the Project**

To fix the Git structure, I moved the project outside the existing repository.

New location:

D:\\hidden-gems-nepal

After moving it, I checked the Git root again.

This time, the project was no longer inside my old repository.

&nbsp;

&nbsp;

This gave me a clean separation:

Other Projects

    ↓

D:\\Safal\_Projects

&nbsp;

HiddenGems Nepal

    ↓

D:\\hidden-gems-nepal

Now HiddenGems Nepal could have its own Git history and GitHub repository.

---

## **6\. Creating a New Git Repository**

With the project in the correct location, I initialized a new Git repository:

**git init**

This created a fresh Git repository specifically for HiddenGems Nepal.

From this point onward, Git would track only this project.

---

## **7\. Creating the First Commit**

I then added the project files to Git:

**git add .**

After staging the files, I created my first commit:

**git commit \-m "chore: initial Next.js project setup"**

The first commit was created successfully.

Commit: f13e2c0

The commit contained:

19 files changed

7090 insertions

After committing, I checked the repository status again.

The working tree was clean.

This meant there were no uncommitted changes at that point.

---

## **8\. Creating the GitHub Repository**

After setting up Git locally, I created a GitHub repository for the project:

**safalbhujel/hidden-gems-nepal**

The purpose was to keep the project safely backed up online and make version control easier during development.

I then connected my local repository with GitHub.

The remote repository was:

origin

---

## **9\. Pushing the Project to GitHub**

After connecting the repositories, I pushed my local main branch to GitHub:

**git push \-u origin main**

The push completed successfully.

The local branch was now connected to:

origin/main

So the project now had both:

Local Project

      ↓

Local Git Repository

      ↓

GitHub Repository

---

# **Step 1 Result**

By the end of Step 1, I had completed the basic foundation of HiddenGems Nepal.

### **What I Completed**

✅ Checked development environment

**✅ Verified Node.js**

**✅ Verified npm**

**✅ Verified Git**

✅ Created Next.js project

✅ **Added TypeScript**

**✅ Added ESLint**

**✅ Added Tailwind CSS**

✅ Selected App Router

✅ Installed project dependencies

✅ Tested application locally

✅ Found Git repository conflict

✅ **Moved project to independent location**

✅ Created dedicated Git repository

✅ Created first Git commit

✅ Created GitHub repository

✅ Connected local Git to GitHub

**✅ Pushed project to GitHub**

### **Current Project Location**

D:\\hidden-gems-nepal

### **Current GitHub Repository**

safalbhujel/hidden-gems-nepal

### **First Commit**

f13e2c0

chore: initial Next.js project setup

## 

## **What This Step Means**

This was not the actual feature development yet.

This step was about **building a clean foundation before writing the real application**.

I now had a working Next.js project, proper version control, an independent repository, and a GitHub backup.

**Step 1 — Project Foundation: COMPLETE.**

&nbsp;