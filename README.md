# GenLayer CLI

## Description

The GenLayer CLI is designed to streamline the setup and local execution of the GenLayer simulator. This tool automates the process of downloading and launching the GenLayer simulator, making it easy to start simulating and testing locally with minimal setup.

## Installation

Before installing the GenLayer CLI, ensure you have Node.js installed on your system. You can then install the CLI globally using npm:

```bash
npm install -g genlayer
```

## Usage

To initialize and start the GenLayer simulator, run the following command:

```bash
genlayer init
```

This command will download the necessary components and start the simulator. Once initialized, you will be ready to execute further commands (to be implemented) to interact with the simulator.

## Contributing

Contributions to the GenLayer CLI are welcome! Please feel free to fork the repository, make your changes, and submit a pull request. We appreciate your efforts to improve the software.

### Running the CLI from the repository

First, install the dependencies and start the build process
```bash
npm install
npm run dev
```
This will continuously rebuild the CLI from the source

Then in another window execute the CLI commands like so:

```bash
node dist/index.js init
```

## License

This project is licensed under the ... License - see the [LICENSE](LICENSE) file for details.

## Credits

- TBD

## Contact

- TBD

## Further Development

Further commands are planned for implementation to enhance interaction with the GenLayer simulator. Stay tuned for updates.

## Feedback

If you have any feedback, please reach out to us at the contact provided above.
