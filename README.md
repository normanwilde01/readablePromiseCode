# Readable Node.js Code Using JavaScript Promises
## Author: Norman Wilde, [http://www.normanwilde.net](http://www.normanwilde.net)
## Keywords:
JavaScript, Promises, Nodejs, Microservices, Progamming best practices,
Software Engineering
## Summary:
JavaScript code, as used in programming microservices on node.js, can become very difficult to read due to the heavy use of callbacks.
So-called "Promise" objects can improve things, but even Promise-based code can be complicated.

This project presents some suggested good practices for using Promises. I suggest using object-oriented principles to encapsulate each chain of Promises in a class. I also suggest certain conventions for programming the class and the chain to provide easily readable and maintainable code.

## Resources:
- Presentation video, 24 minutes: [https://vimeo.com/425643863](https://vimeo.com/425643863)
- Slides: [readablePromiseCode.pdf](/readablePromiseCode.pdf)

## Sample Code:
- `SimpleServiceTester.ts`, a sample class for Promise chains that run simple tests of web services
- `shortExampleMain.ts`, a main program containing a Promise chain that uses the SimpleServiceTester class

