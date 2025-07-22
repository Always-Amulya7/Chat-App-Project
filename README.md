![chat-app-badge](https://img.shields.io/badge/Status-Completed-%23000080)

# 💬 **Real-Time Chat Application with Firebase**

**Human-Like Conversations, Powered by Firebase** 🔥

![Tech Badge](https://img.shields.io/badge/Tech-Firebase%2C%20React%2C%20Vite-blue)  
![License Badge](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 **Project Overview**

This project is a **real-time chat application** built with **React** and **Firebase**, offering secure authentication, instant messaging via Firestore, and seamless deployment with Firebase Hosting.  
The design is **simple**, **clean**, and focuses on **human-like chat** interaction using purely frontend logic—**no external AI models like ChatGPT used**.

**✨ Now powered by Vite for lightning-fast development and optimized builds!**

---

## ✨ **Key Features**

- 🔐 **Google Sign-In Authentication**
- 💬 **Real-Time Messaging with Firestore**
- 💡 **Typing Indicators (Simulated)**
- 😊 **Emotion-Sensitive Replies (Keyword-Based)**
- 📱 **Responsive UI (Mobile Friendly)**
- 🌗 **Toggle Light and Dark Mode**

---

## 🎬 **Getting Started**

### 1. **Clone the Repository**

```bash
git clone https://github.com/JaiSwarup/firebase-chat-app.git
cd firebase-chat-app
```

### 2. **Install Dependencies**

```bash
npm install
```

### 3. **Setup Firebase Configuration**

- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project
- Enable **Authentication** (Google Sign-In)
- Enable **Firestore Database**
- Copy your Firebase config from the project settings

Replace the config object in `src/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-DOMAIN",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-BUCKET",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID",
};
```

### 4. **Run the App Locally**

```bash
npm run dev
# or
npm start
```

Navigate to `http://localhost:3000` in your browser.

### 5. **Build for Production**

```bash
npm run build
```

### 6. **Preview Production Build**

```bash
npm run preview
```

---

## 🛠️ **Advanced Features**

| Feature                | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| 🔄 Typing Status       | Bot typing simulation before reply                          |
| 🧠 Sentiment Response  | Responds with comforting or happy replies based on keywords |
| 🧾 Message Time Tags   | Every message is timestamped                                |
| 🌐 Firebase Hosting    | Easy deployment and scaling                                 |
| 💡 Minimal & Modern UI | Clean chat bubble design with auto-scroll                   |
| 🌗 Dark/Light Mode     | Toggle between Dark & Light modes                           |

---

## 🌍 **Project Structure**

```bash
firebase-chat-app/
├── index.html                 # Vite entry point
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies and scripts
├── public/                   # Static assets
│   ├── favicon.ico
│   ├── logo192.png
│   └── manifest.json
├── src/
│   ├── App.js               # Main app component
│   ├── index.js             # React entry point
│   ├── firebase-config.js   # Firebase configuration
│   ├── App.css              # Global styles
│   ├── components/
│   │   ├── AppWrapper.js    # App wrapper component
│   │   ├── Auth.js          # Authentication component
│   │   └── Chat.js          # Chat room component
│   └── styles/
│       ├── Auth.css         # Auth component styles
│       └── Chat.css         # Chat component styles
└── build/                   # Production build output
```

---

## 👨‍💻 **Tech Stack**

- **Frontend**: React 18, CSS3
- **Build Tool**: Vite (for fast development and optimized builds)
- **Backend**: Firebase (Authentication, Firestore)
- **Hosting**: Firebase Hosting
- **Authentication**: Google OAuth

---

## 🚀 **Deployment: Firebase Hosting**

### 1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

### 2. Login and Initialize:

```bash
firebase login
firebase init hosting
```

### 3. Build and Deploy:

```bash
npm run build
firebase deploy
```

---

## 🤝 **Contributing**

Contributions are welcome! Whether it's bug fixes, improvements, or new features.

### 📌 How to Contribute

1. **Fork** this repo
2. **Clone** your fork
3. **Create a new branch**: `git checkout -b feature-name`
4. **Make your changes**
5. **Commit and push**:
   ```bash
   git commit -m "Add: [your description]"
   git push origin feature-name
   ```
6. **Open a Pull Request**

### 💡 Contribution Ideas

| Feature          | Description                         | Level        |
| ---------------- | ----------------------------------- | ------------ |
| Group Chat       | Add support for group conversations | Intermediate |
| Media Support    | Allow users to send images          | Advanced     |
| Dark Mode        | Toggle UI themes                    | Beginner     |
| Message Deletion | Add delete functionality            | Intermediate |
| Typing Indicator | Show "User is typing..."            | Advanced     |

## 🧪 Testing

Currently, manual testing is used:

- Try logging in, sending and receiving messages
- Open in two tabs or devices to test real-time sync
- Check console for errors and Firebase logs

## � License

Licensed under the [MIT License](LICENSE).

## 🌱 Learning Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Basics](https://firebase.google.com/docs/firestore)
- [React Documentation](https://react.dev/)
- [Open Source Guide](https://opensource.guide/how-to-contribute/)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 📞 **Contact**

- **Maintainer**: [@Dhruvi-tech](https://github.com/Dhruvi-tech)
- **Open Issues**: [GitHub Issues](https://github.com/Dhruvi-tech/firebase-chat-app/issues)

---

**Happy Coding & Collaborating! 🚀**

> _This project is beginner-friendly. All contributors are welcome, regardless of experience level._

Would you like this saved as a file or committed to your project repo structure?
