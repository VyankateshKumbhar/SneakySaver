const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'signupDB'; // Name of your MongoDB database

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' folder

// Connect to MongoDB
mongoose.connect(`${MONGO_URL}/${DB_NAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// Schema & Model
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

//recursive bill schema
const billSchema = new mongoose.Schema({
  email: String,
  title: String,
  amount: Number,
  dueDate: Date,
  category: String,
  recurring: String,
  status: { type: String, default: "" }, // "upcoming", "missed", "paid"
});
const Bill = mongoose.model('Bill', billSchema);
//daily expense schema
const entrySchema = new mongoose.Schema({
  email: { type: String, required: true }, // foreign key reference via email
  type: { type: String, enum: ["expense", "income"], required: true },
  category: { type: String, default: "—" }, // optional for income
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  comment: { type: String, default: "" }
});

const Entry = mongoose.model("Entry", entrySchema);

const User = mongoose.model('User', userSchema);

// Route: Serve homepage.html when accessing the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
});

// Route: Register
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(409).json({ message: 'Email already exists!' });
    }

    // Save the plaintext password without hashing
    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({ message: 'Account created successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Route: Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Compare the plaintext password with the stored password
    if (password !== user.password) {
      return res.status(401).json({ message: 'Incorrect password!' });
    }

    res.status(200).json({ message: 'Logged in successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
//adding expense 
app.post("/add-expense", async (req, res) => {
  const { email, type, category, amount, date, comment } = req.body;

  if (!email || !type || !amount || !date) {
    return res.status(400).json({ success: false, message: "Missing fields." });
  }

  try {
    const newEntry = new Entry({ email, type, category, amount, date, comment });
    await newEntry.save();
    res.json({ success: true, message: "Entry saved successfully." });
  } catch (err) {
    console.error("Error saving entry:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});
//get expense
app.get("/get-expenses", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ success: false, message: "Email is required." });

  try {
    const expenses = await Entry.find({ email }).sort({ date: -1 });
    res.json({ success: true, expenses });
  } catch (err) {
    console.error("Error retrieving entries:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});
//recursive bill routes.
app.get('/bills/:email', async (req, res) => {
  const email = req.params.email;
  const bills = await Bill.find({ email });

  const today = new Date();
  const updatedBills = bills.map(bill => {
    if (bill.status !== 'paid') {
      bill.status = new Date(bill.dueDate) < today ? 'missed' : 'upcoming';
    }
    return bill;
  });

  res.json(updatedBills);
});

app.post('/bills', async (req, res) => {
  const bill = new Bill(req.body);
  await bill.save();
  res.status(201).json(bill);
});

app.put('/bills/:id/paid', async (req, res) => {
  const updated = await Bill.findByIdAndUpdate(req.params.id, { status: 'paid' }, { new: true });
  res.json(updated);
});

// Backend route to update the bill's status
app.put('/bills/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updatedBill = await Bill.findByIdAndUpdate(id, { status }, { new: true });
    res.json(updatedBill);
  } catch (err) {
    res.status(500).json({ error: "Failed to update status." });
  }
});


// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
