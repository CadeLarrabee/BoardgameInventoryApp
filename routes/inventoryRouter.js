const express = require("express");
const inventoryRouter = express.Router();
const controller = require("../controllers/inventoryController");

// Serve forms
inventoryRouter.get("/boardgames/add", controller.renderBoardForm);
inventoryRouter.get("/developers/add", controller.renderDeveloperForm);

// List data
inventoryRouter.get("/boardgames", controller.boardGet);
inventoryRouter.get("/developers", controller.devGet);

// Handle form submissions
inventoryRouter.post("/boardgames", controller.boardPost);
inventoryRouter.post("/developers", controller.devPost);

module.exports = inventoryRouter;
