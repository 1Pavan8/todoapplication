const exp = require("express");
const app = exp();
const { open } = require("sqlite");
const path = require("path");
const dbpath = path.join(__dirname, "todoApplication.db");
const sqlite3 = require("sqlite3");
app.use(exp.json());
let db = null;

const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
    console.log("staart");
  } catch (e) {
    console.log(`Error DB : ${e.message}`);
    process.exit(1);
  }
};

initialize();

/*app.get("/todos/", async (req, resp) => {
  
  const { status, priority, search_q } = req.query;
  const todoq = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND 
    status='${status}' AND priority='${priority}';`;
  const dbres = await db.all(todoq);
  resp.send(dbres);
});*/

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (req, resp) => {
  const { todoId } = req.params;
  //console.log(todoId);
  const gettod = `SELECT * FROM todo WHERE id='${todoId}';`;
  let todo = await db.get(gettod);
  resp.send(todo);
});

app.post("/todos/", async (req, resp) => {
  const todode = req.body;
  console.log(req.body);
  const { todo, priority, status } = todode;
  const todoadd = `INSERT INTO todo (todo,priority,status)
    VALUES ('${todo}','${priority}','${status}');`;
  const todonew = await db.run(todoadd);
  const id = todonew.lastID;
  //console.log(districtId);
  resp.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (req, resp) => {
  const { todoId } = req.params;
  console.log(todoId);
  let updcol = "";
  const rbody = req.body;
  console.log(req.body);
  if (rbody.status !== undefined) {
    console.log("Updating status");
    updcol = "Status";
  } else if (rbody.priority !== undefined) {
    console.log("Updating priority");
    updcol = "Priority";
  } else if (rbody.todo !== undefined) {
    console.log("Updating todo");
    updcol = "Todo";
  } else {
    console.log("No property found to update");
  }

  const prevtodq = `SELECT * FROM todo WHERE id=${todoId};`;
  const prevtodo = await db.get(prevtodq);

  const {
    todo = prevtodo.todo,
    status = prevtodo.status,
    priority = prevtodo.priority,
  } = req.body;

  const updatetodo = `UPDATE todo SET todo='${todo}',priority='${priority}',
  status='${status}'
     WHERE id='${todoId}';`;

  await db.run(updatetodo);
  resp.send(`${updcol} Updated`);
});

app.delete("/todos/:todoId/", async (req, resp) => {
  const { todoId } = req.params;
  const delq = `DELETE FROM todo 
  WHERE id=${todoId};`;
  await db.run(delq);
  resp.send("Todo Deleted");
});

module.exports = app;
