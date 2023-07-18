const express = require("express")
const bodyParser = require("body-parser")
const config = require("config")
const axios = require("axios")
const {createObjectCsvWriter} = require("csv-writer")

const app = express()

app.use(bodyParser.json({limit: "10mb"}))

// Generate CSV report for a specific user
// eslint-disable-next-line max-statements
app.get("/generate/:userId", async (req, res) => {
  const {userId} = req.params

  try {
    const investmentsResponse = await axios.get(`${config.get("investmentsServiceUrl")}/investments`)
    const investments = investmentsResponse.data

    const companiesResponse = await axios.get(`${config.get("financialCompaniesServiceUrl")}/companies`)
    const companies = companiesResponse.data

    const userHoldings = {}

    for (const investment of investments) {
      if (investment.userId === userId) {
        for (const holding of investment.holdings) {
          const company = companies.find((c) => c.id === holding.id)
          const holdingValue = investment.investmentTotal * holding.investmentPercentage

          if (userHoldings[company.name]) {
            userHoldings[company.name] += holdingValue
          } else {
            userHoldings[company.name] = holdingValue
          }
        }
      }
    }

    const csvData = Object.entries(userHoldings).map(([holding, value]) => ({
      User: userId,
      "First Name": investments[0].firstName,
      "Last Name": investments[0].lastName,
      Date: investments[0].date,
      Holding: holding,
      Value: value.toFixed(2),
    }))

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

    await csvWriter.writeRecords(csvData)

    await axios.post(`${config.get("investmentsServiceUrl")}/investments/export`, {csvData}, {
      headers: {"Content-Type": "application/json"},
    })

    res.send("CSV report generated and sent successfully.")
  } catch (error) {
    console.error("Error occurred while sending the CSV report:", error)
    res.status(500).send("Failed to send the CSV report.")
  }
})

app.listen(config.get("port"), (err) => {
  if (err) {
    console.error("Error occurred starting the server", err)
    process.exit(1)
  }
  console.log(`Server running on port ${config.get("port")}`)
})
