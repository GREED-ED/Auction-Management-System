# 🏷️ Auction Management System (AMS)

A full-stack auction web application built with Node.js, Express, MongoDB, and Bootstrap. This platform allows users to create, view, bid on, and manage auctions with role-based controls.

---

## 🚀 Features

🧑‍💻 **User Roles**

- Seller: Can create, edit, and close auctions.
- Bidder: Can place bids on open auctions.

🔐 **Authentication**

- JWT-based secure login and role checks
- Auto role-based UI rendering

🛍️ **Auction Management**

- Create/Edit/Delete auctions (seller only)
- Place bids on open auctions (buyer only)
- Auto-close auction with winner display

📃 **Live Auction List**

- Real-time bid updates (reload to fetch)
- Responsive auction cards with bidder inputs

---

## 💻 Technologies Used

| Stack      | Tools |
|------------|-------|
| Backend    | Node.js, Express |
| Frontend   | HTML, CSS, Bootstrap 5 |
| Database   | MongoDB + Mongoose |
| Auth       | JSON Web Token (JWT), bcrypt |
| UI         | Bootstrap, JS DOM manipulation |

---

## 📁 Folder Structure

```bash
Auction-Platform/
├── public/
│   ├── styles.css
│   ├── login.html
│   ├── register.html
│   └── auctions.html
├── middleware/
│   └── auth.js  
├── config/
│   └── db.js     
├── routes/
│   ├── authRoutes.js
│   └── auctionRoutes.js
├── models/
│   ├── User.js
│   └── Auction.js
├── views/
│   ├── login.html
│   ├── register.html
│   └── auctions.html
├── app.js
├── data.js
├── .env
└── README.md
```
---

## 📸 ScreenShots

Some of the UML Diagram for the Auction Management System are [here](https://github.com/GREED-ED/Academic/blob/main/CSIT/5th%20sem/SAD/UML.md)

---

## 🛠️ Getting Started

### ✅ Prerequisites

Before you begin, make sure you have:

- [Node.js](https://nodejs.org/) and npm installed
- A MongoDB setup:  


---

## 🚚 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/GREED-ED/Auction-Management-System.git
cd Auction-Platform
npm install
```
---

## 🔐 Setup Environment Variables

Create a `.env` file in the **root directory** of your project and add the following values:

```ini
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## ▶️ Start the App
To run the app locally:

```bash
npm start
```
Then open http://localhost:3000 in your browser.

---

## ✅ To Do (Future Features)
 - Add WebSocket support for real-time bids

 - Implement image uploads for auction items

 - Create a dashboard for sellers with analytics

 - Add filters and sorting (e.g. highest bid, ending soon)

 ---

## 🤝 Contributing
Feel free to fork this repo and submit Pull Requests (PRs).
Suggestions, improvements, and code cleanup are always welcome!

