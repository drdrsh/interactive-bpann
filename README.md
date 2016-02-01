# A web-based interactive visualization of artificial neural networks

This demo aims to serve as a tool to help visual learners, like myself, to gain visual intuition as to how artificial neural networks work. This demo allows a step-by-step iteration through a fully-connected backpropagation artificial neural network network to get some intuition as to what goes on during the process of training. It uses the latest Javascript technologies, particularly the "yield" keyword that allows clean loop pause and resume. The default demo attempts to learn an XOR problem.

**The demo is experimental and it uses the latest ES6 features so it won't work on all browsers, also the performance still needs optimization so I recommend running it in Google Chrome.**

The code still needs cleanup and further testing so issue reports and pull request are most welcome. The code is live on http://experiments.mostafa.io/public/ffbpann/

# How to install locally

To run this demo on your local machine (technically, it is a client side so it will always run on your machine, but you get the idea), you will need to have [nodejs](https://nodejs.org/en/), [npm](https://www.npmjs.com/), [grunt](http://gruntjs.com) and [bower](http://bower.io/) installed.

After that clone the repository to your local system.

    git clone https://github.com/drdrsh/interactive-bpann

navigate to the path where the code resides and run

    npm install
    grunt
    grunt serve

This will install all the dependancies and run grunt server on port 9000 

    http://localhost:9000/index.html
    