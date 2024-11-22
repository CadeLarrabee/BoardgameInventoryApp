const express = require("express");
const inventoryRouter = express.Router();
const controller = require("../controllers/inventoryController");

inventoryRouter.get("/", controller.listBoardDevView);

// Serve forms
inventoryRouter.get("/boardgames/add", controller.renderBoardForm);
inventoryRouter.get("/developers/add", controller.renderDeveloperForm);

// List data
inventoryRouter.get("/boardgames", controller.boardGet);
inventoryRouter.get("/developers", controller.devGet);

// form handlers
inventoryRouter.post("/boardgames", controller.boardPost);
inventoryRouter.post("/developers", controller.devPost);

//individual boardgame/dev pages
inventoryRouter.get("/boardgames/:id", controller.boardGameDetail);
inventoryRouter.get("/developers/:id", controller.developerDetail);

module.exports = inventoryRouter;
