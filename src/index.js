const express = require("express")
const bodyParser = require("body-parser")
const config = require("config")

const createCsvWriter = require("csv-writer").createObjectCsvWriter
const axios = require("axios")

const app = express()

app.use(bodyParser.json({limit: "10mb"}))

// app.get("/investments/:id", (req, res) => {
//   const {id} = req.params
//   request.get(`${config.investmentsServiceUrl}/investments/${id}`, (e, r, investments) => {
//     if (e) {
//       console.error(e)
//       res.send(500)
//     } else {
//       res.send(investments)
//     }
//   })
// })

app.get("/investments/:id", async (req, res) => {
  const {id} = req.params
  const investmentResponse = await axios.get(`http://localhost:8081/investments/${id}`)
  const investment = investmentResponse.data

  // Fetch holdings from financial-companies service
  const companiesResponse = await axios.get("http://localhost:8082/companies")
  const companies = companiesResponse.data

  // Find user's holdings
  const userHoldings = investment.holdings.map((holding) => {
    const company = companies.find((c) => c.id === holding.id)
    const holdingValue = investment.investmentTotal * holding.investmentPercentage
    return {
      User: investment.userId,
      "First Name": investment.firstName,
      "Last Name": investment.lastName,
      Date: investment.date,
      Holding: company.name,
      Value: holdingValue.toFixed(2),
    }
  })

  // Create CSV file
  const csvWriter = createCsvWriter({
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

  await csvWriter.writeRecords(userHoldings)

  // Send CSV file to investments service
  try {
    await axios.post("http://localhost:8081/investments/export", {
      csvData: userHoldings,
    }, {
      headers: {"Content-Type": "application/json"},
    })
    res.send("CSV report generated and sent successfully.")
  } catch (error) {
    console.error("Error occurred while sending the CSV report:", error)
    res.status(500).send("Failed to send the CSV report.")
  }
})

app.listen(config.port, (err) => {
  if (err) {
    console.error("Error occurred starting the server", err)
    process.exit(1)
  }
  console.log(`Server running on port ${config.port}`)
})
