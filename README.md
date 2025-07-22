# 💬 Firebase Chat App - Open Source Learning Project

A real-time chat application built with **HTML**, **CSS**, **JavaScript**, and **Firebase**. This beginner-friendly project is perfect for learning real-time database integration and building dynamic front-end experiences.

## 🌟 Features

* 🧑‍🤝‍🧑 Realtime 1-to-1 chat support
* 📥 Message persistence using Firebase
* 🔐 Simple login and logout system
* 📱 Mobile responsive design
* ⚡ Lightweight and fast
* ☁️ Hosted on Firebase (optional)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Dhruvi-tech/firebase-chat-app.git
cd firebase-chat-app
```

### 2. Setup Firebase

* Go to [Firebase Console](https://console.firebase.google.com/)
* Create a new project
* Enable **Authentication** (email/password)
* Enable **Firestore Database**
* Copy your Firebase config from the project settings

Replace the config object in `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-DOMAIN",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-BUCKET",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID"
};
```

### 3. Run the App

Just open `index.html` in a web browser. For development:

```bash
npx live-server
# OR
python -m http.server
```

## 🛠️ Technologies Used

* **HTML5** – Structure
* **CSS3** – Styling
* **JavaScript (ES6+)** – Functionality
* **Firebase** – Backend services (Authentication + Firestore)

## 🤝 Contributing

Contributions are welcome! Whether it’s bug fixes, improvements, or new features — you’re invited to collaborate.

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

### 🐛 Good First Issues

Browse [issues](https://github.com/Dhruvi-tech/firebase-chat-app/issues) for:

* `good first issue`
* `enhancement`
* `bug`
* `help wanted`

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

* Try logging in, sending and receiving messages
* Open in two tabs or devices to test real-time sync
* Check console for errors and Firebase logs

## 📜 License

Licensed under the [MIT License](LICENSE).

## 🌱 Learning Resources

* [Firebase Docs](https://firebase.google.com/docs)
* [Firestore Basics](https://firebase.google.com/docs/firestore)
* [JavaScript DOM Guide](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)
* [Open Source Guide](https://opensource.guide/how-to-contribute/)

## 📞 Contact

* **Maintainer**: [@Dhruvi-tech](https://github.com/Dhruvi-tech)
* **Open Issues**: [GitHub Issues](https://github.com/Dhruvi-tech/firebase-chat-app/issues)

---

**Happy Coding & Collaborating! 🚀**

> *This project is beginner-friendly. All contributors are welcome, regardless of experience level.*

Would you like this saved as a file or committed to your project repo structure?
