# GenLayer CLI

## Description

The GenLayer CLI is designed to streamline the setup and local execution of the GenLayer studio. This tool automates the process of downloading and launching the GenLayer studio, making it easy to start simulating and testing locally with minimal setup.

## Installation

Before installing the GenLayer CLI, ensure you have Node.js installed on your system. You can then install the CLI globally using npm:

```bash
npm install -g genlayer
```

## Usage

To initialize and start the GenLayer studio, run the following command:

```bash
genlayer init
```

This command will download the necessary components and start the studio. Once initialized, you will be ready to execute further commands (to be implemented) to interact with the studio.

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

## Testing

### Overview

The GenLayer CLI uses Jest in combination with ts-jest to handle testing of TypeScript files. The configuration is tailored to support ES Modules (ESM), aligning with the latest JavaScript standards and ensuring compatibility with modern tooling and Node.js features.

### Running Tests

To run the tests, use the following command:

```bash
npm run test
```

This command sets the appropriate Node.js options to handle ES Modules and watches for changes in the test files, making it suitable for development.

### Test Configuration

Our `jest.config.js` is set up as follows:

- ES Module Support: Configured to treat .ts files as ES Modules.
- Test Environment: Uses Node.js as the testing environment.
- Transformation: Utilizes ts-jest with an ESM preset to process TypeScript files.

Tests are located in the tests/ directory and should be named using the following pattern: [filename].test.ts. When writing tests, you can use all Jest functionalities such as describe, test, expect, and Jest mocks for testing asynchronous functions, component interactions, or API calls.

## License

This project is licensed under the ... License - see the [LICENSE](LICENSE) file for details.

## Credits

- TBD

## Contact

- TBD

## Further Development

Further commands are planned for implementation to enhance interaction with the GenLayer Studio. Stay tuned for updates.

## Feedback

If you have any feedback, please reach out to us at the contact provided above.
