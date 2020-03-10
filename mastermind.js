var devTools = 1;

var data = {
    guess: [0, 0, 0],
    solution: [0, 0, 0],
    lock: [0, 0, 0],
    solutionCeiling: 3, //the max value a solution integer can have
    solutionFloor: 0, //the min value a solution integer can have
    errorGuess: 0,
    solutionSolved: 0,
    tickSpeed: 1000, //ms
    flag: Array(5).fill(0), //not supported on IE
    timeToSolve: [0, 0, 0],
    tickToSolve: [0, 0, 0],
    errorsToSolve: [0, 0, 0], //contains a count of the number of errors generated per solve
};

window.onload = function() {
    if (devTools == 1) {
        this.enableDev();
    }

    for (i = 0; i < this.data.solution.length; i++) { //load some SOLUTION numbers at page load
        this.data.solution[i] = this.returnRandomInteger(data.solutionFloor, data.solutionCeiling);
        this.document.getElementById("sol" + i).innerHTML = this.data.solution[i];
    }

    document.getElementById("guessbuttondisable").disabled = true; //sometimes, on refresh, disabled button isn't disabled by default for some reason
}

var updateLoop = setInterval(update, 1000); //seperate to everything else, we run checks to see if stuff needs to be unlocked. Seperated from the guessLoop so that we don't spam checks needlessly

function update() {
    if (data.solutionSolved >= 10) //reveal solution length button after solving 10 codes
    {
        document.getElementById("solutionlengthbutton").style.display = "inline";
        document.getElementById("solutionceilingbutton").style.display = "inline";
    }
}

function guessLoop() { //begin the guess loop
    guessLoopGlobal = setInterval(guess, data.tickSpeed);
    document.getElementById("guessbutton").disabled = true;
    document.getElementById("guessbuttondisable").disabled = false;
}

function guessLoopDisable() { //disable the loop
    clearInterval(guessLoopGlobal);
    document.getElementById("guessbutton").disabled = false;
    document.getElementById("guessbuttondisable").disabled = true;
}

function guess() { //principle solution guessing function
    for (i = 0; i < data.solution.length; i++) {
        if (data.lock[i] == 0)
        {
            data.guess[i] = returnRandomInteger(data.solutionFloor, data.solutionCeiling);
            document.getElementById("guess" + i).innerHTML = data.guess[i];
        }
    }

    updateErrorsToSolve("tick");
    updateTimeToSolve("tick");
    compare();
}

function compare() { //compare the solution & guess arrays, lock any matches
    var _lockcount = 0;

    for (i = 0; i < data.solution.length; i++) {
        if (data.guess[i] == data.solution[i]) {
            data.lock[i] = 1; //lock the number as solution is correct - will prevent generating more numbers until cleared
            _lockcount++; //if lockcount == data.solutionlength at the end of the method, it means all numbers have been solved
            document.getElementById("guess" + i).style.color = "#5cb85c";
        } 
        else if (data.guess[i] != data.solution[i] && data.lock[i] == 0){           
            document.getElementById("guess" + i).style.color = "#d9534f";
        }
    }

    if (_lockcount == data.solution.length) {
        data.solutionSolved++;
        generateSolution("solved");
    } 
    else {
        data.errorGuess++;
    }

    document.getElementById("errorguess").innerHTML = data.errorGuess;
    document.getElementById("solvedsolution").innerHTML = data.solutionSolved;

}

function generateSolution(reason) { //used to create a new solution after solving the previous one
    switch (reason) {
        case "solved": //we generate a new solution when solving the old one
            for (i = 0; i < data.solution.length; i++) {
                data.lock[i] = 0; //we need to clear the lock array! Very important, or can't create new locks
                data.solution[i] = returnRandomInteger(data.solutionFloor, data.solutionCeiling);
                document.getElementById("sol" + i).innerHTML = data.solution[i];
                document.getElementById("guess" + i).style.color = "#0275d8"; //some visual feedback that a solution was reached - blue              
            }
            updateErrorsToSolve(reason);
            updateTimeToSolve(reason);
            break;
        case "upgrade": //we generate a new solution when upgrading. Guess to yellow instead of blue; clear time-to-solve
            for (i = 0; i < data.solution.length; i++) {
                data.lock[i] = 0; //we need to clear the lock array! Very important, or can't create new locks
                data.solution[i] = returnRandomInteger(data.solutionFloor, data.solutionCeiling);
                document.getElementById("sol" + i).innerHTML = data.solution[i];
                document.getElementById("guess" + i).style.color = "#f0ad4e"; //warning colour
            }
            break;
    }
    
    
}


// Functions related to upgrading solution length ---------------------------------------------------------------------------

function upgradeSolutionLength()
{
    if (data.solutionSolved >= 10) {
        data.solutionSolved = data.solutionSolved - 10;

        extendArrays(); //extend the length of the arrays (+ will run the HTML update)
    }    
}

function extendArrays() //used when increasing the solution length
{
    data.solution.push(0);
    data.guess.push(0);
    data.lock.push(0); //should default to unlocked - guess loop will lock it if it's already correct

    updateHTMLWithSolutionLengthIncrease();
    generateSolution("upgrade");
}

function updateHTMLWithSolutionLengthIncrease() //used to update the HTML after extending the arrays
{
    var newSolutionElement = document.createElement("span");
    newSolutionElement.id = "sol" + (data.solution.length - 1);
    newSolutionElement.innerHTML = 0;
    document.getElementById("solutiondiv").appendChild(document.createTextNode (" "));
    document.getElementById("solutiondiv").appendChild(newSolutionElement);
    var newGuessElement = document.createElement("span");
    newGuessElement.id = "guess" + (data.solution.length - 1);
    newGuessElement.innerHTML = 0;
    document.getElementById("guessdiv").appendChild(document.createTextNode (" "));
    document.getElementById("guessdiv").appendChild(newGuessElement);
}

// Functions related to upgrading solution floor + ceiling --------------------------------------------------------------------------------------------------

function upgradeSolutionCeiling()
{
    if (data.solutionSolved >= 10) {
        data.solutionSolved = data.solutionSolved - 10;

        data.solutionCeiling++;
        generateSolution("upgrade"); //generate a fresh solution using the new ceiling
    }    
}

//Functions related to Statistics---------------------------------------------------------------------------------------------------------------------

function updateTimeToSolve(reason) //function to update the time-related statistics
{
    switch (reason)
    {
        case "solved": //if we solved, then need to update previous time [1] with current [0] + reset the current time [0]
            data.timeToSolve[1] = data.timeToSolve[0];
            data.timeToSolve[0] = 0;
            data.tickToSolve[1] = data.tickToSolve[0];
            data.tickToSolve[0] = 0;
            document.getElementById("timetosolveprevious").innerHTML = data.timeToSolve[1];
            document.getElementById("ticktosolveprevious").innerHTML = data.tickToSolve[1];
            break;
        case "tick": //whenever we tick, we need to update the current time [0]
            data.timeToSolve[0] = data.timeToSolve[0] + (data.tickSpeed / 1000); //to get result in seconds, not ms
            data.tickToSolve[0]++;
            document.getElementById("timetosolvecurrent").innerHTML = data.timeToSolve[0];
            document.getElementById("ticktosolvecurrent").innerHTML = data.tickToSolve[0];
            break;
    }
}

function updateErrorsToSolve(reason) //functions mostly the same as above
{
    switch (reason)
    {
        case "solved":
            data.errorsToSolve[1] = data.errorsToSolve[0] - 1; //-1 because we're ticking first, which adds an error, but no error is generated on a solveNEEDS TO BE UPDATED *************************
            data.errorsToSolve[0] = 0;
            document.getElementById("errorstosolveprevious").innerHTML = data.errorsToSolve[1];
            break;
        case "tick":
            data.errorsToSolve[0] = data.errorsToSolve[0] + 1; //NEEDS TO BE UPDATED *************************
            document.getElementById("errorstosolvecurrent").innerHTML = data.errorsToSolve[0];
            break;
    }
}

//DEV FUNCTIONS --------------------------------------------------------------------------------------------------

function enableDev()
{
    //display all testing buttons
    var dev = document.getElementsByClassName("devtool");
    for (i = 0; i < dev.length; i++) {
            dev[i].style.display = "inline";
    }

    //make all flex coloumns more obvious
    var columnstyle = document.getElementsByClassName("leftcolumn");
    for (i = 0; i < columnstyle.length; i++) {
        columnstyle[i].style.backgroundColor = "#D0D0D0";
    }
    columnstyle = document.getElementsByClassName("centercolumn");
    for (i = 0; i < columnstyle.length; i++) {
        columnstyle[i].style.backgroundColor = "#E0E0E0";
    }
    columnstyle = document.getElementsByClassName("rightcolumn");
    for (i = 0; i < columnstyle.length; i++) {
        columnstyle[i].style.backgroundColor = "#C0C0C0";
    }
}

function devAddSolution()
{
    data.solutionSolved = data.solutionSolved + 10;
}

//MISC FUNCTIONS --------------------------------------------------------------------------------------------------

function returnRandomInteger(min, max) { //returns a random integer, min & max included
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}