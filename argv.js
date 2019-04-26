const argv = process.argv.splice(2);

if (argv.length < 2) {
  return console.log(`
    Usage
      $ db-book --user=username --pwd=password
`);
}

const user = parseArgv(argv);

export default user;

function parseArgv(argv) {
  const result = {};
  argv.map(arg => {
    const [key, value] = arg.split('=');
    result[key] = value;
  });
  return result;
}
