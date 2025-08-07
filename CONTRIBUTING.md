# 🤝 Contributing to Firebase Chat App

Thanks for taking the time to contribute! 🚀  
This project is beginner-friendly and open to contributors of all experience levels. Whether you're here to fix bugs, improve UI/UX, add features, or help with documentation—**you are welcome**.

---

## 📚 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Project Structure](#project-structure)
- [Feature Suggestions](#feature-suggestions)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Best Practices](#best-practices)
- [Running the App Locally](#running-the-app-locally)
- [Deployment](#deployment)
- [Need Help?](#need-help)

---

## 📜 Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md) to ensure a respectful and inclusive environment for everyone.

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork Locally

```bash
git clone https://github.com/<your-username>/firebase-chat-app.git
cd firebase-chat-app
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Firebase

- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project
- Enable **Authentication** → Google Sign-In
- Enable **Firestore Database**

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Replace the values in `.env` with your Firebase project config.

---

## ✨ How to Contribute

### 🛠 For Code Contributions

1. Create a new branch:

```bash
git checkout -b fix/feature-name
```

2. Make your changes locally.
3. Run the app and ensure everything works as expected.
4. Stage and commit your changes:

```bash
git add .
git commit -m "fix: brief description of your fix"
```

5. Push to your fork:

```bash
git push origin fix/feature-name
```

6. Open a Pull Request on the main repository.

---

## 📁 Project Structure

```
firebase-chat-app/
├── public/                   # Static assets
├── src/
│   ├── components/           # React Components
│   ├── styles/               # Component CSS
│   ├── firebase-config.js    # Firebase setup
│   ├── App.js                # Main App
│   └── index.js              # Entry point
├── .env.example              # Firebase env template
├── vite.config.js            # Vite configuration
├── package.json              # Scripts and dependencies
└── README.md                 # Project overview
```

---

## 💡 Feature Suggestions

We welcome ideas! Open an [Issue](https://github.com/Dhruvi-tech/firebase-chat-app/issues) with the `enhancement` label or propose features like:

| Feature             | Description                                | Level       |
|---------------------|--------------------------------------------|-------------|
| Group Chat          | Create multi-user rooms                    | Intermediate|
| Media Upload        | Allow sending images                       | Advanced    |
| Delete Message      | Delete messages from Firestore             | Intermediate|
| Emoji Support       | React to messages                          | Beginner    |
| Improved Typing UI  | Enhance simulated typing UI                | Beginner    |

---

## 📦 Commit Message Guidelines

Use clear and conventional commit messages.

| Type      | Purpose                         |
|-----------|---------------------------------|
| `feat`    | New feature                     |
| `fix`     | Bug fix                         |
| `refactor`| Code restructuring              |
| `style`   | CSS/style changes only          |
| `docs`    | Documentation only              |
| `test`    | Adding or fixing tests          |
| `chore`   | Build/config changes            |

Examples:

```bash
git commit -m "feat: add dark mode toggle"
git commit -m "fix: clear message input on send"
```

---

## ✅ Best Practices

- Keep PRs focused and small
- Write clean, readable code
- Reuse components where possible
- Test your changes in multiple screen sizes
- Keep environment variables private

---

## 🧪 Running the App Locally

```bash
npm install
npm run dev
```

Visit: http://localhost:3000

---

## 🚀 Deployment

If you want to deploy using Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## ❓ Need Help?

If you're stuck or need support:
- Open a GitHub [Discussion](https://github.com/Dhruvi-tech/firebase-chat-app)
- Create a new [Issue](https://github.com/Dhruvi-tech/firebase-chat-app/issues)
- Ping the maintainer: @Dhruvi-tech

---

Thank you for contributing to **Firebase Chat App** 💬  
Happy Coding! ✨



