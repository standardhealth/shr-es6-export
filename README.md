> # Content Has Moved!
>
> **The shr-es6-export repo has been integrated into the**
> **[shr-tools](https://github.com/standardhealth/shr-tools) monorepo.  All further development**
> **will be in [shr-tools/packages/shr-es6-export](https://github.com/standardhealth/shr-tools/tree/master/packages/shr-es6-export).**
>
> **Current releases can be found at [shr-tools/releases](https://github.com/standardhealth/shr-tools/releases).**

# SHR ES6 Class Export

The Standard Health Record (SHR) initiative is working to create a single, high-quality health record for every individual in the United States.  For more information, see [standardhealthrecord.org](http://standardhealthrecord.org/).

This GitHub repository contains an ES6 library for exporting ES6 classes representing the SHR.

The SHR text definitions and grammar files can be found in the [shr_spec](https://github.com/standardhealth/shr_spec) repo.  As the SHR text format (and content files) are still evolving, so is this library.

# Setting Up the Environment

This project is being developed and tested with Node.js 8.x (the current LTS version), although other versions _may_ work.  After installing Node.js and Yarn, change to the project directory and _yarn install_ the dependencies:
```
$ yarn install
```

# Running the Tests

To run the tests, execute the following command:
```
$ yarn test
```

During development, it is often helpful to run tests in _watch_ mode.  This launches a process that watches the filesystem for changes to the javascript files and will automatically re-run the tests whenever it detects changes.  To run the tests in _watch_ mode, execute the following command:
```
$ yarn run test:watch
```

# Linting the Code

To encourage quality and consistency within the code base, all code should pass eslint without any warnings.  Many text editors can be configured to automatically flag eslint violations.  We also provide a script for running eslint on the project.  To run eslint, execute the following command:
```
$ yarn run lint
```

# License

Copyright 2017 The MITRE Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
