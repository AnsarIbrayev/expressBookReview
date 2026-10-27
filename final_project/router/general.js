const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Task 6: Register a new user
public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ message: "Unable to register user. Username and password are required." });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "Customer successfully registered. Now you can login" });
});

// Raw book data endpoint used by the Axios-based routes below
public_users.get('/books', (req, res) => {
  return res.status(200).json(books);
});

// Helper: fetch all books from the server using Axios
const fetchBooks = () => axios.get(`${BASE_URL}/books`);

// Helper: convert the books object into an array of full book objects
const toBookList = (booksObj) =>
  Object.keys(booksObj).map((isbn) => ({
    isbn,
    author: booksObj[isbn].author,
    title: booksObj[isbn].title,
    reviews: booksObj[isbn].reviews
  }));

// Task 1 + Task 10: Get all books - using async/await with Axios
public_users.get('/', async (req, res) => {
  try {
    const response = await fetchBooks();
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving books", error: error.message });
  }
});

// Task 2 + Task 11: Get book details based on ISBN - using Promise callbacks with Axios
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  fetchBooks()
    .then((response) => {
      const book = response.data[isbn];
      if (book) {
        return res.status(200).send(JSON.stringify({ isbn, ...book }, null, 4));
      }
      return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    })
    .catch((error) => res.status(500).json({ message: "Error retrieving book", error: error.message }));
});

// Task 3 + Task 12: Get book details based on author - using async/await with Axios
public_users.get('/author/:author', async (req, res) => {
  const author = req.params.author;
  try {
    const response = await fetchBooks();
    const result = toBookList(response.data).filter(
      (book) => book.author.toLowerCase() === author.toLowerCase()
    );
    if (result.length > 0) {
      return res.status(200).send(JSON.stringify(result, null, 4));
    }
    return res.status(404).json({ message: `No books found by author ${author}` });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving books", error: error.message });
  }
});

// Task 4 + Task 13: Get all books based on title - using async/await with Axios
public_users.get('/title/:title', async (req, res) => {
  const title = req.params.title;
  try {
    const response = await fetchBooks();
    const result = toBookList(response.data).filter(
      (book) => book.title.toLowerCase() === title.toLowerCase()
    );
    if (result.length > 0) {
      return res.status(200).send(JSON.stringify(result, null, 4));
    }
    return res.status(404).json({ message: `No books found with title ${title}` });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving books", error: error.message });
  }
});

// Task 5: Get book review
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
});

module.exports.general = public_users;
