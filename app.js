"use strict";

const lodash = require("lodash");
const uuidv4 = require("uuid/v4");

const express = require("express");

const app = express();
app.use(express.json());

let users = [];
let articles = [];
let validTokens = [];
let InvalidTokens = [];

app.post("/api/user", checkEmptyBody, (req, res) => {
  const userData = req.body;
  users.push(userData);
  return res.status(201).send(userData);
});

app.post("/api/authenticate", checkEmptyBody, authenticationMiddleware, (req, res) => {
  const token = uuidv4();
  addTokenToUser(req, token);
  validTokens.push(token);
  return res.status(200).send({ token });
});

app.post("/api/logout", authenticatedUsers, (req, res) => {
  InvalidTokens.push(token);
  return res.status(200).send("Logout Successfully And Token Became Invalid");
});

app.post("/api/articles", authenticatedUsers, checkEmptyBody, (req, res) => {
  const articleData = req.body;
  articles.push(articleData);
  return res.status(201).send(articleData);
});

app.get("/api/articles", authenticatedUsers, (req, res) => {
  const token = req.headers["authentication-header"];
  if (isTokenValid(req)) {
    const currentUser = users.find((user) => user.token === token);
    const userArticles = getLoggedInUserArticles(currentUser);
    return res.status(200).send(userArticles);
  }
  const userArticles = getPublicArticles();
  return res.status(200).send(userArticles);
});

function authenticationMiddleware(req, res, next) {
  const { login, password } = req.body;

  const userData = users.find((user) => user.login === login);
  if (!userData) return res.status(404).send("User Not Found");
  if (userData.password !== password) return res.status(401).send("Invalid Password");
  return next();
}

function checkEmptyBody(req, res, next) {
  const isEmpty = !Object.values(req.body).every((x) => x !== undefined && x !== "");
  return !isEmpty ? res.status(400).json() : next();
}

function authenticatedUsers(req, res, next) {
  const token = req.headers["authentication-header"];
  return validTokens.includes(token) ? next() : res.status(401).send("Invalid Token");
}

function addTokenToUser(req, token) {
  const { login } = req.body;
  users = users.map((user) => (user.login === login ? { ...user, token } : token));
}

function isTokenValid(token) {
  return validTokens.includes(token);
}

function getLoggedInUserArticles(currentUser) {
  const { id } = currentUser;
  return articles.filter(
    (article) => article.visibility === "public" || article.visibility === "logged_in" || article.user_id === id
  );
}

function getPublicArticles() {
  return articles.filter((article) => article.visibility === "public");
}

app.listen(process.env.HTTP_PORT || 3000);
