const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async (request, response) => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertPlayerDetailsObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDetailsObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertPlayerMatchScoreObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};
//GET PLAYERS API

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details ORDER BY player_id; `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDetailsObjectToResponseObject(eachPlayer)
    )
  );
});

//GET SPECIFIC PLAYER API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetailsQuery = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const playerArray = await db.get(playerDetailsQuery);
  response.send(convertPlayerDetailsObjectToResponseObject(playerArray));
});

//PUT API
app.put("/players/:playerId/",async(request,response)=>{
    const {playerId}=request.params;
    const {playerName}=request.body;
    const updatePlayerQuery=`UPDATE player_details SET player_name=`${playerName}` WHERE player_id=${playerId}`;
   await db.run(updatePlayerQuery);
   response.send("Player Details Updated");
});

//GET SPECIFIC MATCH DETAILS API 
app.get(" /matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const matchArray = await db.get(matchDetailsQuery);
  response.send(convertMatchDetailsObjectToResponseObject(matchArray));
});

//GET ALL MATCHES OF PARTICULAR PLAYER

app.get("/players/:playerId/matches", async (request, response) => {
  const {playerId}=request.params
  const getPlayerMatchesQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id=${playerId};`;
  const playerMatchesArray = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatchesArray.map((eachMatch) =>
      convertMatchDetailsObjectToResponseObject(eachMatch)
    )
  );
});

//GET LIST OF PLAYERS OF A SPECIFIC MATCH

app.get("/matches/:matchId/players", async (request, response) => {
  const {matchId}=request.params
  const getMatchPlayersQuery = `SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id=${matchId};`;
  const matchPlayersArray = await db.all(getPlayerMatchesQuery);
  response.send(
    matchPlayersArray.map((eachPlayer) =>
      convertPlayerDetailsObjectToResponseObject(eachPlayer)
    )
  );
});

//GET statistics of the total score, fours, sixes of a specific player

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchScoreQuery = `SELECT 
  player_id AS playerId,
  player_name AS playerName,
  SUM(score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
  FROM player_match_score NATURAL JOIN player_details WHERE player_id=${playerId}
  ;`;
  const playerScoresArray = await db.get(playerMatchScoreQuery);
  response.send(playerScoresArray);
});

module.exports=app;