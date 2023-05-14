import inquirer from 'inquirer';

export async function confirmAction(message) {
  const { confirmation } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmation',
      message: message,
      default: false,
    },
  ]);
  return Promise.resolve(confirmation); // returns boolean
}

export function logEvents({ events, name }) {
  console.log('');
  console.log('****************************************************************************************************');
  console.log(name.toUpperCase());
  console.log('****************************************************************************************************');
  console.log('');
  for (const {start, end, summary, location, description} of events) {
    logDateTimes(start.dateTime, end.dateTime)
    console.log(summary);
    console.log('LOCATION:', location);
    console.log('DESCRIPTION:', description);
    console.log('');
    console.log('---');
    console.log('');
  }
}

function logDateTimes(start, end) {
  const optionsFull = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true,
  };
  const optionsShort = { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true,
  };
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (startDate.getDate() === endDate.getDate() && startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    const formattedStart = startDate.toLocaleString('en-US', optionsFull).replaceAll(',', '').replaceAll(' at ', ' ');
    const formattedEnd = endDate.toLocaleString('en-US', optionsShort).replaceAll(',', '').replaceAll(' at ', ' ');
    console.log(`${formattedStart} - ${formattedEnd}`);
  } else {
    throw new Error('Event end time is on a different day than start time.');
  }
}