const axios = require("axios")
const {aggregateUserHoldings, generateCSVData} = require("../src/index")


describe("Admin Microservice", () => {
  describe("CSV Report Generation", () => {
    it("should generate correct CSV data for a user", async () => {
      const investmentsData = [
        {
          userId: "1",
          firstName: "John",
          lastName: "Doe",
          date: "2022-01-01",
          investmentTotal: 20000,
          holdings: [
            {id: "1", investmentPercentage: 0.5},
            {id: "2", investmentPercentage: 0.5},
          ],
        },
      ]

      const companiesData = [
        {id: "1", name: "Company A"},
        {id: "2", name: "Company B"},
      ]

      axios.get.mockResolvedValueOnce({data: investmentsData})
      axios.get.mockResolvedValueOnce({data: companiesData})

      const userId = "1"

      const userHoldings = aggregateUserHoldings(investmentsData, companiesData, userId)
      const csvData = generateCSVData(userHoldings, investmentsData)

      expect(csvData).toEqual([
        {
          User: "1",
          "First Name": "John",
          "Last Name": "Doe",
          Date: "2022-01-01",
          Holding: "Company A",
          Value: "10000.00",
        },
        {
          User: "1",
          "First Name": "John",
          "Last Name": "Doe",
          Date: "2022-01-01",
          Holding: "Company B",
          Value: "10000.00",
        },
      ])
    })
  })
})
