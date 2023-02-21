const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//get API 1

app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    SELECT * 
    FROM
    state
    ORDER BY state_id;
    `;
  const statesArray = await database.all(getAllStatesQuery);
  response.send(
    statesArray.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
  );
});

//Get API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getSatesQuery = `
    SELECT *
    FROM 
    state
    WHERE state_id = ${stateId};
    `;
  const statesArrays = await database.get(getSatesQuery);
  response.send(convertDbObjectToResponseObject(statesArrays));
});

//Put API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const insertedDistrictQuery = `
    INSERT INTO
    district (districtName, stateId, cases, cured, active, deaths)
    VLAUES 
    ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths}); 
    `;
  await database.run(insertedDistrictQuery);
  response.send("District Successfully Added");
});

//Get API 4
const convertDbObjectToResponseObjectOfDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtWiseQuery = `
    SELECT *
    FROM 
    district
    WHERE district_id = ${districtId};
    `;
  const districtIdWiseArray = await database.get(districtWiseQuery);
  response.send(convertDbObjectToResponseObjectOfDistrict(districtIdWiseArray));
});

//Delete API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletedQuery = `
    DELETE 
    FROM district
    WHERE district_id = ${districtId};
    `;
  await database.run(deletedQuery);
  response.send("District Removed");
});

//Put API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updatedDistrictQuery = `
    UPDATE 
    district
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId};
    `;
  await database.run(updatedDistrictQuery);
  response.send("District Details Updated");
});

const convertDbObjectToResponseObjects = (dbObject) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  };
};
//Get API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const { stateName } = request.body;
  const getStatesQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM 
    district
    WHERE 
    state_id = ${stateId};
    `;
  const specificStateArray = await database.get(getStatesQuery);
  response.send({
    totalCases: specificStateArray["SUM(cases)"],
    totalCured: specificStateArray["SUM(cured)"],
    totalActive: specificStateArray["SUM(active)"],
    totalDeaths: specificStateArray["SUM(deaths)"],
  });
});

//Get API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    SELECT state_id from district
    WHERE district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);
  const districtIdQuery = `
    SELECT 
    state.state_name AS stateName
    FROM 
    state
    WHERE 
    state_id = ${getDistrictIdQueryResponse.state_id}
    `;
  const districtIdArray = await database.get(districtIdQuery);
  response.send(districtIdArray);
});
module.exports = app;
