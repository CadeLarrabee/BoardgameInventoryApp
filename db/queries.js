// queries.js

const { Pool } = require("pg");
const pool = require("./pool");

// Retrieve all board games
async function getAllBoardGames() {
  const { rows } = await pool.query("SELECT * FROM boardgames");
  return rows;
}

// Retrieve all developers
async function getAllDevelopers() {
  const { rows } = await pool.query("SELECT * FROM developers");
  return rows;
}

// Insert a new developer with associated board games
async function insertDeveloper(name, boardgames) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert the developer and get its ID
    const developerResult = await client.query(
      "INSERT INTO developers (developer_name) VALUES ($1) RETURNING developer_id",
      [name]
    );
    const developerId = developerResult.rows[0].developer_id;

    for (const boardgame of boardgames) {
      // Check if the board game already exists
      let boardgameResult = await client.query(
        "SELECT boardgame_id FROM boardgames WHERE boardgame_name = $1",
        [boardgame.name]
      );

      let boardgameId;
      if (boardgameResult.rows.length > 0) {
        // Board game exists
        boardgameId = boardgameResult.rows[0].boardgame_id;
      } else {
        // Board game does not exist, insert it
        const newBoardgameResult = await client.query(
          "INSERT INTO boardgames (boardgame_name, boardgame_rating, boardgame_desc) VALUES ($1, $2, $3) RETURNING boardgame_id",
          [
            boardgame.name,
            boardgame.rating || null,
            boardgame.description || null,
          ]
        );
        boardgameId = newBoardgameResult.rows[0].boardgame_id;
      }

      // Insert into the join table
      await client.query(
        "INSERT INTO developers_board_games (developer_id, boardgame_id) VALUES ($1, $2)",
        [developerId, boardgameId]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Insert a new board game with associated developers
async function insertBoardGame(name, rating, description, developers) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert the board game and get its ID
    const boardGameResult = await client.query(
      "INSERT INTO boardgames (boardgame_name, boardgame_rating, boardgame_desc) VALUES ($1, $2, $3) RETURNING boardgame_id",
      [name, rating, description]
    );
    const boardgameId = boardGameResult.rows[0].boardgame_id;

    for (const developerName of developers) {
      // Check if the developer already exists
      let developerResult = await client.query(
        "SELECT developer_id FROM developers WHERE developer_name = $1",
        [developerName]
      );

      let developerId;
      if (developerResult.rows.length > 0) {
        // Developer exists
        developerId = developerResult.rows[0].developer_id;
      } else {
        // Developer does not exist, insert them
        const newDeveloperResult = await client.query(
          "INSERT INTO developers (developer_name) VALUES ($1) RETURNING developer_id",
          [developerName]
        );
        developerId = newDeveloperResult.rows[0].developer_id;
      }

      // Insert into the join table
      await client.query(
        "INSERT INTO developers_board_games (developer_id, boardgame_id) VALUES ($1, $2)",
        [developerId, boardgameId]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Additional Queries

// Get board games by developer
async function getBoardGamesByDeveloper(developerId) {
  const { rows } = await pool.query(
    `
    SELECT bg.*
    FROM boardgames bg
    JOIN developers_board_games dbg ON bg.boardgame_id = dbg.boardgame_id
    WHERE dbg.developer_id = $1
    `,
    [developerId]
  );
  return rows;
}

// Get developers by board game
async function getDevelopersByBoardGame(boardgameId) {
  const { rows } = await pool.query(
    `
    SELECT d.*
    FROM developers d
    JOIN developers_board_games dbg ON d.developer_id = dbg.developer_id
    WHERE dbg.boardgame_id = $1
    `,
    [boardgameId]
  );
  return rows;
}

// Update board game details
async function updateBoardGame(boardgameId, name, rating, description) {
  const { rowCount } = await pool.query(
    `
    UPDATE boardgames
    SET boardgame_name = $1, boardgame_rating = $2, boardgame_desc = $3
    WHERE boardgame_id = $4
    `,
    [name, rating, description, boardgameId]
  );
  return rowCount > 0;
}

// Delete a board game
async function deleteBoardGame(boardgameId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    // Delete from join table first
    await client.query(
      "DELETE FROM developers_board_games WHERE boardgame_id = $1",
      [boardgameId]
    );
    // Then delete the board game
    const result = await client.query(
      "DELETE FROM boardgames WHERE boardgame_id = $1",
      [boardgameId]
    );
    await client.query("COMMIT");
    return result.rowCount > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Delete a developer
async function deleteDeveloper(developerId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    // Delete from join table first
    await client.query(
      "DELETE FROM developers_board_games WHERE developer_id = $1",
      [developerId]
    );
    // Then delete the developer
    const result = await client.query(
      "DELETE FROM developers WHERE developer_id = $1",
      [developerId]
    );
    await client.query("COMMIT");
    return result.rowCount > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Update developer details
async function updateDeveloper(developerId, name, boardgames) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Update developer name
    await client.query(
      `
      UPDATE developers
      SET developer_name = $1
      WHERE developer_id = $2
      `,
      [name, developerId]
    );

    // Optionally update boardgame associations
    // For simplicity, delete existing associations and re-insert
    await client.query(
      "DELETE FROM developers_board_games WHERE developer_id = $1",
      [developerId]
    );

    for (const boardgame of boardgames) {
      // Check if the board game exists
      let boardgameResult = await client.query(
        "SELECT boardgame_id FROM boardgames WHERE boardgame_name = $1",
        [boardgame.name]
      );

      let boardgameId;
      if (boardgameResult.rows.length > 0) {
        boardgameId = boardgameResult.rows[0].boardgame_id;
      } else {
        // Insert new board game
        const newBoardgameResult = await client.query(
          "INSERT INTO boardgames (boardgame_name, boardgame_rating, boardgame_desc) VALUES ($1, $2, $3) RETURNING boardgame_id",
          [
            boardgame.name,
            boardgame.rating || null,
            boardgame.description || null,
          ]
        );
        boardgameId = newBoardgameResult.rows[0].boardgame_id;
      }

      // Insert into join table
      await client.query(
        "INSERT INTO developers_board_games (developer_id, boardgame_id) VALUES ($1, $2)",
        [developerId, boardgameId]
      );
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getAllBoardGames,
  getAllDevelopers,
  insertBoardGame,
  insertDeveloper,
  getBoardGamesByDeveloper,
  getDevelopersByBoardGame,
  updateBoardGame,
  deleteBoardGame,
  deleteDeveloper,
  updateDeveloper,
};
