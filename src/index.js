const express = require("express")
const bodyParser = require("body-parser")
const config = require("config")
const axios = require("axios")
const {createObjectCsvWriter} = require("csv-writer")

const app = express()

app.use(bodyParser.json({limit: "10mb"}))

const calculateHoldingValue = (investmentTotal, investmentPercentage) => {
  return investmentTotal * investmentPercentage
}

const aggregateUserHoldings = (investments, companies, userId) => {
  const userHoldings = {}

  for (const investment of investments) {
    if (investment.userId === userId) {
      for (const holding of investment.holdings) {
        const company = companies.find((company) => company.id === holding.id)
        const holdingValue = calculateHoldingValue(investment.investmentTotal, holding.investmentPercentage)

        if (userHoldings[company.name]) {
          userHoldings[company.name] += holdingValue
        } else {
          userHoldings[company.name] = holdingValue
        }
      }
    }
  }

  return userHoldings
}

const generateCSVData = (userHoldings, investments) => {
  const {userId, firstName, lastName, date} = investments[0]

  return Object.entries(userHoldings).map(([holding, value]) => ({
    User: userId,
    "First Name": firstName,
    "Last Name": lastName,
    Date: date,
    Holding: holding,
    Value: value.toFixed(2),
  }))
}

app.get("/generate/:userId", async (req, res) => {
  const {userId} = req.params

  try {
    const investmentsResponse = await axios.get(`${config.get("investmentsServiceUrl")}/investments`)
    const investmentsData = investmentsResponse.data

    const companiesResponse = await axios.get(`${config.get("financialCompaniesServiceUrl")}/companies`)
    const companiesData = companiesResponse.data

    const userHoldings = aggregateUserHoldings(investmentsData, companiesData, userId)
    const csvData = generateCSVData(userHoldings, investmentsData)

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

const port = config.get("port")
app.listen(port, (err) => {
  if (err) {
    console.error("Error occurred starting the server", err)
    process.exit(1)
  }
  console.log(`Server running on port ${port}`)
})
