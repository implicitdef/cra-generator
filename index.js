const parse = require("csv-parse/lib/sync");
const fs = require("fs");
const moment = require("moment");
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");

const DAY_FORMAT = "YYYY-MM-DD";

const optionDefinitions = [
  {
    name: "year",
    alias: "y",
    type: Number,
    defaultValue: moment().year(),
    description: "Target year, defaults to current year"
  },
  {
    name: "month",
    alias: "m",
    type: Number,
    defaultValue: moment().month() + 1,
    defaultOption: true,
    description: "Target month (1 to 12), defaults to current year"
  },
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Print this usage guide."
  }
];

function areSameDay(m1, m2) {
  return m1.utc().format(DAY_FORMAT) === m2.utc().format(DAY_FORMAT);
}

function getDaysArrayByMonth(firstDayMoment) {
  var daysInMonth = firstDayMoment.daysInMonth();
  return Array(daysInMonth)
    .fill(null)
    .map((_, idx) => firstDayMoment.clone().date(1 + idx));
}

function parseJoursFeriesFile() {
  console.log("Reading jours feries file...");
  const fileContent = fs.readFileSync("./data/jours_feries_seuls.csv", "utf8");
  const parsed = parse(fileContent);
  return parsed
    .filter((_, idx) => idx !== 0)
    .map(row => row[0])
    .map(s => moment.utc(s, DAY_FORMAT));
}
const joursFeries = parseJoursFeriesFile();

function isFerie(m) {
  return !!joursFeries.find(j => areSameDay(m, j));
}

console.log("Reading command line options...");
const options = commandLineArgs(optionDefinitions);
if (options.help) {
  const sections = [
    {
      header: "CRA generator",
      content: "Generates a base template for the CRA"
    },
    {
      header: "Options",
      optionList: optionDefinitions
    }
  ];
  const usage = commandLineUsage(sections);
  console.log(usage, usage === "", usage.length);
} else {
  const targetMonthFirstDay = moment.utc({
    month: options.month - 1,
    year: options.year,
    day: 1
  });
  console.log(
    ` == Template CRA for ${targetMonthFirstDay.format("MMMM YYYY")} ==`
  );
  const days = getDaysArrayByMonth(targetMonthFirstDay)
    .map(day => ({
      day,
      isFerie: isFerie(day),
      isWeekend: [0, 6].includes(day.day())
    }))
    .map(day => ({
      ...day,
      isWorked: !day.isFerie && !day.isWeekend
    }));

  days.forEach(({ day, isFerie, isWeekend, isWorked }) => {
    console.log(
      `${day.format("DD MMM YYYY")} ${isWorked ? 1 : 0} ${
        isFerie ? "      ~ Férié" : ""
      }${isWeekend ? "      ~ Week-end" : ""}`
    );
  });
  const nbWorkedDays = days.filter(_ => _.isWorked).length;
  console.log(`Total days worked ${nbWorkedDays}`);
}
