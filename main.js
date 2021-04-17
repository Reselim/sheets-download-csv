const yargs = require("yargs")
const { GoogleSpreadsheet } = require("google-spreadsheet")
const { createObjectCsvWriter } = require("csv-writer")
const fs = require("fs")
const path = require("path")

const argv = yargs(process.argv).options({
	key: {
		alias: "k",
		demandOption: true,
		describe: "Service account key",
		type: "string",
	},

	document: {
		alias: "d",
		demandOption: true,
		describe: "Sheets document ID",
		type: "string",
	},

	output: {
		alias: "o",
		demandOption: true,
		describe: "Output folder",
		type: "string",
	},
}).argv

const keyPath = path.resolve(process.cwd(), argv.key)
const outputPath = path.resolve(process.cwd(), argv.output)

const serviceAccountKey = JSON.parse(fs.readFileSync(keyPath, "utf-8"))

async function run() {
	const document = new GoogleSpreadsheet(argv.document)
	document.useServiceAccountAuth(serviceAccountKey)
	await document.loadInfo()

	for (const title in document.sheetsByTitle) {
		console.log(`Writing ${title}...`)

		const sheet = document.sheetsByTitle[title]
		const rows = await sheet.getRows()

		const writer = createObjectCsvWriter({
			path: path.join(outputPath, `${title}.csv`),
			header: [
				{ id: "Key", title: "Key" },
				{ id: "Source", title: "Source" },
			],
		})

		await writer.writeRecords(rows)
	}
}

run().catch(console.error)