const { body, validationResult } = require("express-validator");
const db = require("../db/queries");

//The inventory controller
//Has post/get methods for dev and boardgame databases.
//handles adding relations as well to the dev + boardgame bridge table.

function renderBoardForm(req, res) {
  res.render("boardForm");
}

function renderDeveloperForm(req, res) {
  res.render("developerForm");
}

async function listBoardDevView(req, res) {
  const boardgames = await db.getAllBoardGames();
  const developers = await db.getAllDevelopers();
  res.render("listView", { boardgames, developers });
}

async function boardGet(req, res) {
  const boardgames = await db.getAllBoardGames();
  res.render("listView", { boardgames, developers: [] });
}

// Get board game details
async function boardGameDetail(req, res) {
  const boardgameId = req.params.id;
  const boardgame = await db.getBoardGameById(boardgameId);
  const developers = await db.getDevelopersByBoardGame(boardgameId);
  res.render("boardgameDetail", { boardgame, developers });
}

// Get developer details
async function developerDetail(req, res) {
  const developerId = req.params.id;
  const developer = await db.getDeveloperById(developerId);
  const boardgames = await db.getBoardGamesByDeveloper(developerId);
  res.render("developerDetail", { developer, boardgames });
}

async function boardPost(req, res) {
  const { boardgame } = req.body;
  await db.insertBoardgame(boardgame);
  res.redirect("/");
}

async function devGet(req, res) {
  const developers = await db.getAllDevelopers();
  res.render("listView", { boardgames: [], developers });
}

async function devPost(req, res) {
  const { developer } = req.body;
  await db.insertDeveloper(developer);
  res.redirect("/");
}

module.exports = {
  boardGet,
  boardPost,
  devGet,
  devPost,
  listBoardDevView,
  renderDeveloperForm,
  developerDetail,
  boardGameDetail,
  renderBoardForm,
};
