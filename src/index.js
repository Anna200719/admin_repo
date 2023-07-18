const express = require("express")
const bodyParser = require("body-parser")
const config = require("config")
const request = require("request")
const {createObjectCsvWriter} = require("csv-writer")

const app = express()

app.use(bodyParser.json({limit: "10mb"}))

app.get("/investments/:id", async (req, res) => {
  const {id} = req.params
  const userHoldings = null
  request.get(`${config.investmentsServiceUrl}/investments/${id}`, (e, r, investments) => {
    if (e) {
      console.error(e)
      res.send(500)
    } else {
      res.send(investments)
    }
  })
})

const csvWriter = createObjectCsvWriter({
  path: "report.csv",
  header: [
    {id: "User", title: "User"},
    {id: "First Name", title: "First Name"},
    {id: "Last Name", title: "Last Name"},
    {id: "Date", title: "Date"},
    {id: "Holding", title: "Holding"},
    {id: "Value", title: "Value"},
  ],
})

await csvWriter.writeRecords(userHoldings);

app.listen(config.port, (err) => {
  if (err) {
    console.error("Error occurred starting the server", err)
    process.exit(1)
  }
  console.log(`Server running on port ${config.port}`)
})
